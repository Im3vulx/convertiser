'use client';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getAcceptAttribute, getValidFilesOrNotify } from '@/lib/client-files';
import JSZip from 'jszip';

type JobState = { file: File; progress: number; status: 'idle' | 'converting' | 'done' | 'error'; previewUrl?: string; };

export default function RemoveBgPage() {
    const [jobs, setJobs] = useState<JobState[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const zipRef = useRef<JSZip>(new JSZip());
    const completedCount = useRef<number>(0);

    const generatePreview = async (file: File): Promise<string | undefined> => {
        if (file.type.startsWith('image/')) return URL.createObjectURL(file);
        return undefined;
    };

    const processFiles = async (files: File[] | FileList) => {
        const imageFiles = getValidFilesOrNotify(files, 'image');
        if (imageFiles.length === 0) return;

        const newJobs: JobState[] = imageFiles.map(file => ({ file, progress: 0, status: 'idle' }));
        setJobs(prev => [...prev, ...newJobs]);

        for (let i = 0; i < newJobs.length; i++) {
            const previewUrl = await generatePreview(newJobs[i].file);
            if (previewUrl) {
                setJobs(currentJobs => {
                    const updated = [...currentJobs];
                    const targetIndex = updated.findIndex(j => j.file === newJobs[i].file);
                    if (targetIndex !== -1) updated[targetIndex].previewUrl = previewUrl;
                    return updated;
                });
            }
        }
    };

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length > 0) processFiles(e.dataTransfer.files); };

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
                a.download = "Images_Detourees.zip";
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success("Archive téléchargée avec succès !", { id: toastId });
            } catch (error) {
                toast.error("Erreur lors de la création du ZIP", { id: toastId });
            }
        }
    };

    const startSingleJob = async (job: JobState, index: number, totalJobs: number) => {
        updateJobState(index, { status: 'converting' });
        const formData = new FormData();
        formData.append('file', job.file);

        try {
            const response = await fetch('/api/remove-bg', { method: 'POST', body: formData });
            const { jobId, targetFormat } = await response.json();
            if (!jobId) throw new Error("Erreur");

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
                            const res = await fetch(`/api/download?jobId=${jobId}&format=${targetFormat}`);
                            const blob = await res.blob();
                            const baseName = job.file.name.substring(0, job.file.name.lastIndexOf('.')) || job.file.name;
                            const ext = targetFormat || job.file.name.split('.').pop();
                            zipRef.current.file(`${baseName}-detoure.${ext}`, blob);
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
        } catch (error) { 
            updateJobState(index, { status: 'error' }); 
            toast.error("Une erreur est survenue lors du détourage de l'image.");
            checkBatchCompletion(totalJobs);
        }
    };

    const updateJobState = (index: number, updates: Partial<JobState>) => {
        setJobs(prevJobs => { const newJobs = [...prevJobs]; newJobs[index] = { ...newJobs[index], ...updates }; return newJobs; });
    };
    const removeJob = (indexToRemove: number) => setJobs(prev => prev.filter((_, index) => index !== indexToRemove));
    
    const isProcessing = jobs.some(job => job.status === 'converting');
    const totalProgress = jobs.length > 0 
        ? Math.round(jobs.reduce((acc, job) => acc + job.progress, 0) / jobs.length) 
        : 0;

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Supprimer l&apos;arrière-plan</h1>
            <p className="mt-2 text-gray-500">Détourez automatiquement vos photos (Humains, Animaux, Objets) via l&apos;IA locale</p>
            </header>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-end">
                    <button 
                        onClick={handleProcessAll} 
                        disabled={isProcessing || jobs.filter(j => j.status === 'idle').length === 0} 
                        className="w-full md:w-auto bg-black text-white px-6 py-2.5 rounded-lg font-medium transition-all hover:bg-gray-800 disabled:bg-gray-300"
                    >
                        {isProcessing ? 'Détourage par l\'IA en cours...' : 'Détourer la sélection'}
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

            <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ease-in-out ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'}`}>
            <input type="file" multiple accept={getAcceptAttribute('image')} disabled={isProcessing} onChange={(e) => e.target.files && processFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="pointer-events-none">
                <h3 className="text-lg font-medium text-gray-900">Glissez-déposez vos images ici</h3>
                <p className="mt-1 text-sm text-gray-500">Formats supportés : JPG, PNG, WebP</p>
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
                                {job.previewUrl ? (<img src={job.previewUrl} alt="preview" className="object-cover w-full h-full" />) : (<span className="text-xs font-medium text-gray-400">...</span>)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate text-sm">{job.file.name}</p>
                                {job.status !== 'idle' ? (
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2.5 overflow-hidden">
                                    <div className={`h-2 rounded-full transition-all duration-300 ease-out ${job.status === 'done' ? 'bg-green-500' : job.status === 'error' ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${job.progress}%` }}></div>
                                </div>
                                ) : ( <p className="text-xs text-gray-500 mt-1">Prêt pour l&apos;IA</p> )}
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