'use client';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Octet';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function PdfPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [action, setAction] = useState('compress');
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<number>(0);

    const MAX_FILE_SIZE = 50 * 1024 * 1024;

    const validateAndSetFile = (selectedFile: File) => {
        if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
            toast.error("Format invalide", {
                description: `Le fichier "${selectedFile.name}" n'est pas un PDF.`
            });
            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            toast.error("Fichier trop volumineux", {
                description: `Votre fichier fait ${formatFileSize(selectedFile.size)}. La limite est de 50 Mo.`
            });
            return;
        }

        setFile(selectedFile);
        toast.success("Fichier accepté", {
            description: `${selectedFile.name} (${formatFileSize(selectedFile.size)}) est prêt.`
        });
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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true);
        const toastId = toast.loading("Traitement en cours...");

        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', action);
        
        try {
            const res = await fetch('/api/pdf', { method: 'POST', body: formData });
            if (!res.ok) throw new Error("Erreur serveur");
            const { jobId, targetFormat } = await res.json();

            setProgress(0);

            const eventSource = new EventSource(`/api/progress?jobId=${jobId}`);
            
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.progress !== undefined) {
                    setProgress(data.progress);
                }
                
                if (data.status === 'done') {
                    eventSource.close();
                    setIsProcessing(false);
                    setProgress(100);
                    
                    const link = document.createElement('a');
                    link.href = `/api/download?jobId=${jobId}&format=${targetFormat}`;
                    link.target = '_blank'; 
                    link.click();

                    toast.success("Opération terminée !", { id: toastId });
                } else if (data.status === 'error') {
                    eventSource.close();
                    setIsProcessing(false);
                    setProgress(0);
                    toast.error("Une erreur s'est produite lors du traitement du PDF.", { id: toastId });
                }
            };
        } catch (error) {
            console.error("Erreur API :", error);
            toast.error("Une erreur s'est produite lors de l'appel à l'API.", { id: toastId });
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Outils PDF</h1>
                <p className="text-gray-500 mt-2">Manipulation et optimisation de documents</p>
            </header>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Choisir une action :</label>
                <select 
                value={action}
                onChange={(e) => setAction(e.target.value)} 
                className="w-full text-black border border-gray-300 p-3 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-black"
                disabled={isProcessing}
                >
                <option value="compress">🚀 Compresser (Gain de place)</option>
                <option value="to-images">🖼️ Convertir en Images (JPG)</option>
                </select>
            </div>
            
            <div 
                onDragOver={onDragOver} 
                onDragLeave={onDragLeave} 
                onDrop={onDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ease-in-out ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
            >
                <input 
                type="file" 
                accept=".pdf"
                disabled={isProcessing}
                onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                {file ? (
                    <>
                        <h3 className="text-lg font-bold text-blue-600 truncate px-4">{file.name}</h3>
                        <span className="inline-block mt-2 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                            {formatFileSize(file.size)}
                        </span>
                    </>
                ) : (
                    <>
                        <h3 className="text-lg font-medium text-gray-900">Glissez-déposez votre PDF ici</h3>
                        <p className="text-sm text-gray-500 mt-1">ou cliquez pour parcourir (Max: 50 Mo)</p>
                    </>
                )}
                </div>
            </div>

            {isProcessing && (
                <div className="w-full space-y-2 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                        <span>Traitement en cours...</span>
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
                onClick={handleProcess} 
                disabled={!file || isProcessing}
                className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 disabled:bg-gray-300 transition-all active:scale-[0.98]"
            >
                {isProcessing ? 'Veuillez patienter...' : 'Traiter le document'}
            </button>
            
            <div className="pt-6 border-t border-gray-100 text-center">
                <Link href="/pdf-merge" className="text-blue-600 font-medium hover:underline">
                Besoin de fusionner plusieurs fichiers ? Accéder à l&apos;outil de fusion
                </Link>
            </div>
            </div>
        </div>
        </main>
    );
}