import { NextResponse } from 'next/server';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const globalStore = global as any;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const format = searchParams.get('format');

    if (!jobId || !format) {
        return new Response('Paramètres manquants', { status: 400 });
    }

    const originalName = globalStore.jobs?.[jobId]?.originalName || `document-${jobId.slice(0,4)}`;
    const suffix = format === 'zip' ? 'images' : 'converti';
    
    const finalFileName = `${originalName}-${suffix}.${format}`;
    const filePath = path.join(os.tmpdir(), `converted-${jobId}.${format}`);

    try {
        const fileBuffer = await readFile(filePath);
        
        setTimeout(() => {
            unlink(filePath).catch((err) => console.error("Erreur de nettoyage disque:", err));

            if (globalStore.jobs && globalStore.jobs[jobId]) {
                delete globalStore.jobs[jobId];
                console.log(`[Mémoire] Job ${jobId} définitivement supprimé après 30s.`);
            }
        }, 30000);

        const encodedFileName = encodeURIComponent(finalFileName);

        const safeFallbackName = finalFileName
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9.-]/g, "_");

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Disposition': `attachment; filename="${safeFallbackName}"; filename*=UTF-8''${encodedFileName}`,
                'Content-Type': 'application/octet-stream',
            },
        });
    } catch (error) {
        console.error("❌ ERREUR CRITIQUE AU TÉLÉCHARGEMENT :");
        console.error(error);
        return new Response('Fichier introuvable ou expiré', { status: 404 });
    }
}