'use client';
import { useState } from 'react';
import { toast } from 'sonner'; 
import { motion, AnimatePresence } from 'framer-motion';

type JobState = { file: File; progress: number; status: 'idle' | 'converting' | 'done' | 'error'; previewUrl?: string; };

export default function VideoProPage() {
    const [jobs, setJobs] = useState<JobState[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [action, setAction] = useState('none');
    const [start, setStart] = useState('00:00:00');
    const [end, setEnd] = useState('00:00:10');
    const [speed, setSpeed] = useState('1.0');

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
        const newJobs: JobState[] = Array.from(files).map(file => ({ file, progress: 0, status: 'idle' }));
        setJobs(prev => [...prev, ...newJobs]);
        for (let i = 0; i < newJobs.length; i++) {
        const previewUrl = await generatePreview(newJobs[i].file);
        if (previewUrl) updateJobState(jobs.length + i, { previewUrl });
        }
    };

    const startSingleJob = async (job: JobState, index: number) => {
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
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateJobState(index, { progress: data.progress });
            if (data.status === 'done') {
            eventSource.close();
            updateJobState(index, { status: 'done', progress: 100 });
            const link = document.createElement('a');
            link.href = `/api/download?jobId=${jobId}&format=${targetFormat}`;
            link.target = '_blank'; link.click();
            }
        };
        } catch { 
            updateJobState(index, { status: 'error' });
            toast.error(`Erreur lors du traitement de ${job.file.name}`);
        }
    };

    const updateJobState = (index: number, updates: Partial<JobState>) => {
        setJobs(prev => { const next = [...prev]; next[index] = { ...next[index], ...updates }; return next; });
    };

    const isProcessing = jobs.some(j => j.status === 'converting');

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900">Vidéo Professionnelle</h1>
            </header>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select onChange={(e) => setAction(e.target.value)} className="text-black border p-2.5 rounded-lg bg-gray-50">
                <option value="none">Aucune action</option>
                <option value="trim">Découper (Trim)</option>
                <option value="mute">Supprimer le son</option>
                <option value="extract-audio">Extraire audio (MP3)</option>
                <option value="speed">Accélérer / Ralentir</option>
                </select>
                {action === 'trim' && (
                <div className="flex gap-2">
                    <input type="text" value={start} onChange={e => setStart(e.target.value)} className="text-black border p-2 rounded w-full" placeholder="Début (HH:MM:SS)" />
                    <input type="text" value={end} onChange={e => setEnd(e.target.value)} className="text-black border p-2 rounded w-full" placeholder="Fin (HH:MM:SS)" />
                </div>
                )}
                {action === 'speed' && (
                <input type="number" step="0.1" value={speed} onChange={e => setSpeed(e.target.value)} className="text-black border p-2 rounded" placeholder="Facteur (ex: 2.0)" />
                )}
            </div>
            <button onClick={() => jobs.forEach((j, i) => j.status === 'idle' && startSingleJob(j, i))} disabled={isProcessing} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800">
                {isProcessing ? 'Traitement en cours...' : 'Lancer le traitement'}
            </button>
            </div>

            <div onDragOver={(e) => {e.preventDefault(); setIsDragging(true)}} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }} className={`border-2 border-dashed rounded-2xl p-12 text-center ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            <h3 className="font-medium text-gray-900">Glissez-déposez vos vidéos</h3>
            </div>

            {jobs.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    <AnimatePresence mode="popLayout">
                        {jobs.map((job, i) => (
                            <motion.li 
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.2 }}
                                key={`${job.name}-${i}`}
                                className="p-4 flex items-center gap-4"
                            >
                            <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border">
                                {job.previewUrl ? <img src={job.previewUrl} className="object-cover w-full h-full" /> : <span className="text-xs text-gray-400">...</span>}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900 truncate">{job.file.name}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className={`h-2 rounded-full ${job.status === 'done' ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${job.progress}%` }}></div></div>
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