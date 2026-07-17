'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function PdfMergePage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
        setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files!)]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
        setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (indexToRemove: number) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error("Veuillez sélectionner au moins 2 fichiers PDF");
            return;
        }
        setIsProcessing(true);

        const toastId = toast.loading("Fusion de vos documents en cours...");

        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        
        try {
            const res = await fetch('/api/pdf/merge', { method: 'POST', body: formData });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const firstFileName = files[0].name.replace('.pdf', '');
                a.download = `${firstFileName}-fusion.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success("Fusion terminée avec succès !", { id: toastId });
            } else {
                toast.error("Une erreur est survenue lors de la fusion.", { id: toastId });
            }
        } catch (error) {
            console.error("Erreur lors de la fusion:", error);
            toast.error("Erreur de connexion au serveur.", { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Fusionner vos PDF</h1>
            <p className="text-gray-500 mt-2">Glissez vos fichiers, ils seront fusionnés dans l&apos;ordre de la liste.</p>
            </header>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            
            {/* Zone de Drag and Drop sécurisée et confinée */}
            <div 
                onDragOver={onDragOver} 
                onDragLeave={onDragLeave} 
                onDrop={onDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ease-in-out ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
            >
                <input 
                type="file" 
                multiple 
                accept=".pdf" 
                disabled={isProcessing}
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="pointer-events-none">
                <h3 className="text-lg font-medium text-gray-900">Glissez-déposez vos fichiers PDF ici</h3>
                <p className="text-sm text-gray-500 mt-1">ou cliquez dans cette zone pour parcourir</p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Fichiers dans la file d&apos;attente ({files.length}) :</h3>
                <ul className="space-y-2">
                    <AnimatePresence mode="popLayout">
                    {files.map((f, i) => (
                        <motion.li 
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.2 }}
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-sm"
                        >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <span className="bg-black text-white px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0">{i + 1}</span>
                            <span className="truncate font-medium text-gray-700">{f.name}</span>
                        </div>
                        <button 
                            onClick={() => removeFile(i)}
                            disabled={isProcessing}
                            className="ml-2 text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        </motion.li>
                    ))}
                    </AnimatePresence>
                </ul>
                </div>
            )}

            <button 
                onClick={handleMerge} 
                disabled={isProcessing || files.length < 2}
                className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 disabled:bg-gray-300 transition-all"
            >
                {isProcessing ? 'Fusion en cours...' : `Fusionner les ${files.length} fichiers`}
            </button>
            </div>
        </div>
        </main>
    );
}