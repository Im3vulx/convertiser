'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function PdfPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [action, setAction] = useState('compress');
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

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
        setFile(e.dataTransfer.files[0]);
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', action);
        
        try {
            const res = await fetch('/api/pdf', { method: 'POST', body: formData });
            const { jobId, targetFormat } = await res.json();
            
            const eventSource = new EventSource(`/api/progress?jobId=${jobId}`);
            
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.status === 'done') {
                eventSource.close();
                setIsProcessing(false);
                
                const link = document.createElement('a');
                link.href = `/api/download?jobId=${jobId}&format=${targetFormat}`;
                link.target = '_blank'; 
                link.click();
                } else if (data.status === 'error') {
                eventSource.close();
                setIsProcessing(false);
                alert("Une erreur s'est produite.");
                }
            };
        } catch (error) {
            console.error("Erreur API :", error);
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Retour au tableau de bord
            </Link>
            
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
            
            {/* Zone de Drag and Drop sécurisée et confinée */}
            <div 
                onDragOver={onDragOver} 
                onDragLeave={onDragLeave} 
                onDrop={onDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ease-in-out ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
            >
                <input 
                type="file" 
                accept=".pdf"
                disabled={isProcessing}
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                <h3 className="text-lg font-medium text-gray-900">
                    {file ? file.name : "Glissez-déposez votre PDF ici"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">ou cliquez pour parcourir votre ordinateur</p>
                </div>
            </div>

            <button 
                onClick={handleProcess} 
                disabled={!file || isProcessing}
                className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 disabled:bg-gray-300 transition-all"
            >
                {isProcessing ? 'Traitement en cours...' : 'Traiter le document'}
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