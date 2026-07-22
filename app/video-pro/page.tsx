'use client';
import { useState, useRef } from 'react';
import { toast } from 'sonner'; 
import { motion, AnimatePresence } from 'framer-motion';
import { getAcceptAttribute, getValidFilesOrNotify } from '@/lib/client-files';
import { incrementStats } from '@/lib/stats';
import JSZip from 'jszip';

type JobState = { file: File; progress: number; status: 'idle' | 'converting' | 'done' | 'error'; previewUrl?: string; };

export default function VideoProPage() {
    const [jobs, setJobs] = useState<JobState[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [action, setAction] = useState('none');
    const [start, setStart] = useState('00:00:00');
    const [end, setEnd] = useState('00:00:10');
    const [speed, setSpeed] = useState('1.0');

    const zipRef = useRef<JSZip>(new JSZip());
    const completedCount = useRef<number>(0);

    const generatePreview = async (file: File): Promise<string | undefined> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            video.autoplay = true; video.muted = true; video.src = URL.createObjectURL(file);
            video.onloadeddata = () => { video.currentTime = 1; };
            video.onseeked = () => {
                canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg'));
            };
            video.onerror = () => resolve(undefined);
        });
    };

    const processFiles = async (files: File[] | FileList) => {
        const videoFiles = getValidFilesOrNotify(files, 'video');
        if (videoFiles.length === 0) return;

        const newJobs: JobState[] = videoFiles.map((file) => ({ file, progress: 0, status: 'idle' }));
        setJobs((prev) => [...prev, ...newJobs]);

        for (let i = 0; i < newJobs.length; i++) {
            const previewUrl = await generatePreview(newJobs[i].file);
            if (previewUrl) {
                setJobs((currentJobs) => {
                    const updated = [...currentJobs];
                    const targetIndex = updated.findIndex((j) => j.file === newJobs[i].file);
                    if (targetIndex !== -1) updated[targetIndex].previewUrl = previewUrl;
                    return updated;
                });
            }
        }
    };

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
    };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) processFiles(e.dataTransfer.files);
    };

    const handleProcessAll = () => {
        const jobsToProcess = jobs.filter(j => j.status === "idle");
        if (jobsToProcess.length === 0) return;

        zipRef.current = new JSZip();
        completedCount.current = 0;
        const totalJobs = jobsToProcess.length;

        jobs.forEach((job, index) => {
            if (job.status === 'idle') startSingleJob(job, index, totalJobs);
        });
    };

    const checkBatchCompletion = async (totalJobs: number) => {
        completedCount.current += 1;
        
        if (completedCount.current === totalJobs && totalJobs > 1) {
            const toastId = toast.loading("Finalisation de l'archive ZIP...");
            try {
                const content = await zipRef.current.generateAsync({ type: "blob" });
                const url = window.URL.createObjectURL(content);
                const a = document.createElement("a");
                a.href = url;
                a.download = "Videos_Pro.zip";
                a.click();
                window.URL.revokeObjectURL(url);
                
                incrementStats(totalJobs);
                toast.success("Archive téléchargée avec succès !", { id: toastId });
            } catch (error) {
                toast.error("Erreur lors de la création du ZIP", { id: toastId });
            }
        } else if (totalJobs === 1 && completedCount.current === 1) {
            incrementStats(1);
        }
    };

    const updateJobState = (index: number, updates: Partial<JobState>) => {
        setJobs(prev => { const next = [...prev]; next[index] = { ...next[index], ...updates }; return next; });
    };

    const removeJob = (indexToRemove: number) => {
        setJobs(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const startSingleJob = async (job: JobState, index: number, totalJobs: number) => {
        updateJobState(index, { status: 'converting' });
        const formData = new FormData();
        formData.append('file', job.file);
        formData.append('action', action);
        if (action === 'trim') { formData.append('start', start); formData.append('end', end); }
        if (action === 'speed') { formData.append('factor', speed); }

        try {
            const res = await fetch('/api/video', { method: 'POST', body: formData });
            const { jobId, targetFormat } = await res.json();
            
            const eventSource = new EventSource(`/api/progress?jobId=${jobId}`);
            eventSource.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                updateJobState(index, { progress: data.progress || 0 });
                
                if (data.status === 'done') {
                    eventSource.close();
                    updateJobState(index, { status: 'done', progress: 100 });
                    
                    if (totalJobs === 1) {
                        const link = document.createElement('a');
                        link.href = `/api/download?jobId=${jobId}&format=${targetFormat}`;
                        link.click();
                        checkBatchCompletion(totalJobs);
                    } else {
                        try {
                            const downloadRes = await fetch(`/api/download?jobId=${jobId}&format=${targetFormat}`);
                            const blob = await downloadRes.blob();
                            const baseName = job.file.name.substring(0, job.file.name.lastIndexOf('.')) || job.file.name;
                            const ext = targetFormat || job.file.name.split('.').pop();
                            zipRef.current.file(`${baseName}-pro.${ext}`, blob);
                        } catch (err) {
                            console.error("Erreur d'ajout au ZIP:", err);
                        }
                        checkBatchCompletion(totalJobs);
                    }
                } else if (data.status === 'error') {
                    eventSource.close();
                    updateJobState(index, { status: 'error' });
                    checkBatchCompletion(totalJobs);
                }
            };
        } catch { 
            updateJobState(index, { status: 'error' });
            toast.error(`Erreur lors du traitement de ${job.file.name}`);
            checkBatchCompletion(totalJobs);
        }
    };

    const isProcessing = jobs.some(j => j.status === 'converting');
    
    const totalProgress = jobs.length > 0 
        ? Math.round(jobs.reduce((acc, job) => acc + job.progress, 0) / jobs.length) 
        : 0;

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vidéo Professionnelle</h1>
                <p className="mt-2 text-gray-500">Montage et traitement vidéo rapide, 100% en local</p>
            </header>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={action} onChange={(e) => setAction(e.target.value)} disabled={isProcessing} className="text-black border-gray-300 border p-2.5 rounded-lg bg-gray-50 outline-none w-full">
                        <option value="none">Aucune action</option>
                        <option value="trim">Découper (Trim)</option>
                        <option value="mute">Supprimer le son</option>
                        <option value="extract-audio">Extraire audio (MP3)</option>
                        <option value="speed">Accélérer / Ralentir</option>
                    </select>

                    {action === 'trim' && (
                        <div className="flex gap-2">
                            <input type="text" value={start} onChange={e => setStart(e.target.value)} disabled={isProcessing} className="text-black border border-gray-300 p-2.5 rounded-lg bg-gray-50 outline-none w-full" placeholder="Début (HH:MM:SS)" />
                            <input type="text" value={end} onChange={e => setEnd(e.target.value)} disabled={isProcessing} className="text-black border border-gray-300 p-2.5 rounded-lg bg-gray-50 outline-none w-full" placeholder="Fin (HH:MM:SS)" />
                        </div>
                    )}
                    
                    {action === 'speed' && (
                        <input type="number" step="0.1" value={speed} onChange={e => setSpeed(e.target.value)} disabled={isProcessing} className="text-black border border-gray-300 p-2.5 rounded-lg bg-gray-50 outline-none w-full" placeholder="Facteur (ex: 2.0)" />
                    )}
                    
                    {/* Placeholder div pour garder le layout propre si l'action n'a pas d'options */}
                    {(action === 'none' || action === 'mute' || action === 'extract-audio') && (
                        <div className="hidden md:block"></div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <button 
                        onClick={handleProcessAll} 
                        disabled={isProcessing || jobs.filter(j => j.status === 'idle').length === 0} 
                        className="w-full md:w-auto bg-black text-white px-8 py-3 rounded-xl font-bold transition-all hover:bg-gray-800 disabled:bg-gray-300"
                    >
                        {isProcessing ? 'Traitement en cours...' : 'Lancer le traitement'}
                    </button>
                </div>

                {isProcessing && (
                    <div className="w-full pt-4 border-t border-gray-100 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-600 mb-2">
                            <span>Progression totale ({jobs.length} fichiers)</span>
                            <span>{totalProgress}%</span>
                        </div>
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="h-full bg-black rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${totalProgress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ease-in-out ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
            >
                <input
                    type="file"
                    multiple
                    accept={getAcceptAttribute('video')}
                    disabled={isProcessing}
                    onChange={(e) => e.target.files && processFiles(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                    <h3 className="text-lg font-medium text-gray-900">Glissez-déposez vos vidéos ici</h3>
                    <p className="mt-1 text-sm text-gray-500">ou cliquez pour parcourir (MP4, MOV, AVI, MKV, WebM…)</p>
                </div>
            </div>

            {jobs.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    <AnimatePresence mode="popLayout">
                        {jobs.map((job, i) => (
                            <motion.li 
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.2 }}
                                key={`${job.file.name}-${i}`}
                                className="p-4 flex items-center gap-4"
                            >
                                <div className="w-14 h-14 bg-gray-100 rounded-lg shrink-0 overflow-hidden flex items-center justify-center border border-gray-200">
                                    {job.previewUrl ? <img src={job.previewUrl} alt="preview" className="object-cover w-full h-full" /> : <span className="text-xs font-medium text-gray-400">...</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate text-sm">{job.file.name}</p>
                                    {job.status !== 'idle' ? (
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2.5 overflow-hidden">
                                            <div className={`h-2 rounded-full transition-all duration-300 ease-out ${job.status === 'done' ? 'bg-green-500' : job.status === 'error' ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${job.progress}%` }}></div>
                                        </div>
                                    ) : ( <p className="text-xs text-gray-500 mt-1">Prêt pour le traitement</p> )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-medium w-20 text-right ${job.status === 'done' ? 'text-green-600' : job.status === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
                                        {job.status === 'done' ? 'Terminé' : job.status === 'error' ? 'Erreur' : job.status === 'idle' ? '' : `${job.progress}%`}
                                    </span>
                                    {job.status !== 'converting' && (
                                        <button onClick={() => removeJob(i)} className="text-gray-400 hover:text-red-500 p-1">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </button>
                                    )}
                                </div>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            </div>
            )}
        </div>
        </main>
    );
}