'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Reorder, AnimatePresence } from 'framer-motion';

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Octet';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

type MergeItem = {
    id: string;
    file: File;
};

export default function PdfMergePage() {
    const [files, setFiles] = useState<MergeItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState<number>(0);

    const MAX_FILE_SIZE = 50 * 1024 * 1024;

    const validateAndAddFiles = (fileList: FileList | File[]) => {
        const incomingFiles = Array.from(fileList);
        const validItems: MergeItem[] = [];
        let errorCount = 0;

        incomingFiles.forEach((file) => {
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                toast.error("Format invalide", {
                    description: `"${file.name}" n'est pas un PDF et a été ignoré.`
                });
                errorCount++;
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                toast.error("Fichier trop lourd", {
                    description: `"${file.name}" dépasse la limite de 50 Mo.`
                });
                errorCount++;
                return;
            }

            validItems.push({ 
                id: Math.random().toString(36).substring(2, 9), 
                file 
            });
        });

        if (validItems.length > 0) {
            setFiles(prev => [...prev, ...validItems]);
            if (errorCount === 0) {
                toast.success(validItems.length > 1 ? `${validItems.length} fichiers ajoutés` : `Fichier ajouté`, {
                    description: "Prêt pour la fusion."
                });
            }
        }
    };

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
            validateAndAddFiles(e.dataTransfer.files);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            validateAndAddFiles(e.target.files);
        }
        e.target.value = '';
    };

    const removeFile = (idToRemove: string) => {
        setFiles(prev => prev.filter(item => item.id !== idToRemove));
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error("Veuillez sélectionner au moins 2 fichiers PDF");
            return;
        }
        setIsProcessing(true);
        setProgress(0); 

        const toastId = toast.loading("Fusion de vos documents en cours...");

        const progressInterval = setInterval(() => {
            setProgress((prev) => (prev >= 95 ? 95 : prev + Math.floor(Math.random() * 15)));
        }, 300);

        const formData = new FormData();
        files.forEach((item) => formData.append('files', item.file));
        
        try {
            const res = await fetch('/api/pdf/merge', { method: 'POST', body: formData });
            
            clearInterval(progressInterval);
            setProgress(100);

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const firstFileName = files[0].file.name.replace('.pdf', '');
                a.download = `${firstFileName}-fusion.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success("Fusion terminée avec succès !", { id: toastId });
            } else {
                toast.error("Une erreur est survenue lors de la fusion.", { id: toastId });
            }
        } catch (error) {
            clearInterval(progressInterval);
            console.error("Erreur lors de la fusion:", error);
            toast.error("Erreur de connexion au serveur.", { id: toastId });
        } finally {
            setTimeout(() => setIsProcessing(false), 500); 
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Fusionner vos PDF</h1>
            <p className="text-gray-500 mt-2">Glissez vos fichiers, réorganisez-les, puis fusionnez-les.</p>
            </header>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            
            <div 
                onDragOver={onDragOver} 
                onDragLeave={onDragLeave} 
                onDrop={onDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ease-in-out ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
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
                <p className="text-sm text-gray-500 mt-1">ou cliquez dans cette zone pour parcourir (Max: 50 Mo/fichier)</p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 text-sm flex justify-between items-center">
                    <span>Fichiers à fusionner ({files.length}) :</span>
                    {files.length > 1 && <span className="text-xs text-blue-500 font-normal">Vous pouvez glisser pour réorganiser ↑↓</span>}
                </h3>
                
                <Reorder.Group 
                    axis="y" 
                    values={files} 
                    onReorder={setFiles} 
                    className="space-y-2"
                >
                    <AnimatePresence mode="popLayout">
                    {files.map((item, i) => (
                        <Reorder.Item 
                            key={item.id}
                            value={item}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-sm cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors"
                        >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path>
                                </svg>
                            </div>
                            
                            <span className="bg-black text-white px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0">{i + 1}</span>
                            <span className="truncate font-medium text-gray-700 select-none">{item.file.name}</span>
                            <span className="text-xs text-gray-400 font-mono shrink-0">({formatFileSize(item.file.size)})</span>
                        </div>
                        
                        <button 
                            onClick={() => removeFile(item.id)}
                            disabled={isProcessing}
                            onPointerDown={(e) => e.stopPropagation()} 
                            className="ml-2 text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                        </Reorder.Item>
                    ))}
                    </AnimatePresence>
                </Reorder.Group>
                </div>
            )}

            {isProcessing && (
                <div className="w-full space-y-2 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                        <span>Fusion en cours...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className="h-full bg-black rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            <button 
                onClick={handleMerge} 
                disabled={isProcessing || files.length < 2}
                className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 disabled:bg-gray-300 transition-all active:scale-[0.98]"
            >
                {isProcessing ? 'Fusion en cours...' : `Fusionner les ${files.length} fichiers`}
            </button>
            </div>
        </div>
        </main>
    );
}