'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getAcceptAttribute, getValidFilesOrNotify } from '@/lib/client-files';

type JobState = {
    file: File;
    progress: number;
    status: 'idle' | 'converting' | 'done' | 'error';
    previewUrl?: string;
};

export default function ImageProPage() {
    const [jobs, setJobs] = useState<JobState[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [action, setAction] = useState('lossless');

    const generatePreview = async (file: File): Promise<string | undefined> => {
        if (file.type.startsWith('image/')) return URL.createObjectURL(file);
        return undefined;
    };

    const processFiles = async (files: File[] | FileList) => {
        const imageFiles = getValidFilesOrNotify(files, 'image');
        if (imageFiles.length === 0) return;

        const newJobs: JobState[] = imageFiles.map((file) => ({ file, progress: 0, status: 'idle' }));
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

    const updateJobState = (index: number, updates: Partial<JobState>) => {
        setJobs(prev => {
        const next = [...prev];
        next[index] = { ...next[index], ...updates };
        return next;
        });
    };

    const startSingleJob = async (job: JobState, index: number) => {
        updateJobState(index, { status: 'converting' });
        const formData = new FormData();
        formData.append('file', job.file);
        formData.append('action', action);

        try {
        const res = await fetch('/api/image-pro', { method: 'POST', body: formData });
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
            } else if (data.status === 'error') {
            eventSource.close();
            updateJobState(index, { status: 'error' });
            }
        };
        } catch (error) {
            updateJobState(index, { status: 'error' });
            toast.error("Une erreur est survenue lors du traitement de l'image.");
        }
    };

    const isProcessing = jobs.some(j => j.status === 'converting');

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900">Image Professionnelle</h1>
            </header>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <select 
                onChange={(e) => setAction(e.target.value)} 
                className="w-full text-black border p-2.5 rounded-lg bg-gray-50 outline-none"
                disabled={isProcessing}
            >
                <option value="lossless">Compression Sans Perte (Lossless)</option>
                <option value="gif">Convertir en GIF animé</option>
                <option value="bw">Niveaux de gris (Haute Qualité)</option>
            </select>

            <button 
                onClick={() => jobs.forEach((j, i) => j.status === 'idle' && startSingleJob(j, i))} 
                disabled={isProcessing || jobs.length === 0}
                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 disabled:bg-gray-300"
            >
                {isProcessing ? 'Traitement en cours...' : 'Traiter les images'}
            </button>
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
                    accept={getAcceptAttribute('image')}
                    disabled={isProcessing}
                    onChange={(e) => e.target.files && processFiles(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                    <h3 className="text-lg font-medium text-gray-900">Glissez-déposez vos images ici</h3>
                    <p className="mt-1 text-sm text-gray-500">ou cliquez pour parcourir (JPG, PNG, WebP, GIF…)</p>
                </div>
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
                                key={`${job.file.name}-${i}`}
                                className="p-4 flex items-center gap-4"
                            >
                            <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border">
                                {job.previewUrl ? <img src={job.previewUrl} className="object-cover w-full h-full" /> : <span className="text-xs text-gray-400">...</span>}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900 truncate">{job.file.name}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div className={`h-2 rounded-full ${job.status === 'done' ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${job.progress}%` }}></div>
                                </div>
                            </div>
                            <span className={`text-sm font-medium w-20 text-right ${job.status === 'done' ? 'text-green-600' : 'text-gray-500'}`}>
                                {job.status === 'done' ? 'Terminé' : `${job.progress}%`}
                            </span>
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