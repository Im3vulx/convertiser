import { NextResponse } from 'next/server';
import { readFile, unlink } from 'node:fs/promises';

const globalStore = global as any;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const format = searchParams.get('format') || 'file';

    if (!jobId || !globalStore.jobs || !globalStore.jobs[jobId]) {
        return new NextResponse('Job introuvable', { status: 404 });
    }

    const job = globalStore.jobs[jobId];

    if (job.status !== 'done' || !job.outputPath) {
        return new NextResponse('Fichier non prêt', { status: 400 });
    }

    try {
        const fileBuffer = await readFile(job.outputPath);

        // Nettoyage asynchrone des fichiers temporaires
        unlink(job.inputPath).catch(() => {});
        unlink(job.outputPath).catch(() => {});
        delete globalStore.jobs[jobId]; // On supprime le ticket de la mémoire

        return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="converti.${format}"`,
        },
        });
    } catch (error) {
        return new NextResponse('Erreur de lecture', { status: 500 });
    }
}