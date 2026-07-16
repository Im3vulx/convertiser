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
        
        unlink(filePath).catch((err) => console.error("Erreur de nettoyage:", err));

        return new NextResponse(fileBuffer, {
        headers: {
            'Content-Disposition': `attachment; filename="${finalFileName}"`,
            'Content-Type': 'application/octet-stream',
        },
        });
    } catch (error) {
        return new Response('Fichier introuvable ou expiré', { status: 404 });
    }
}