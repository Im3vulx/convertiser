import { NextResponse } from 'next/server';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import ffmpeg from 'fluent-ffmpeg';
import crypto from 'node:crypto';

const globalStore = global as any;
if (!globalStore.jobs) globalStore.jobs = {};

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;
        const format = data.get('format') as string || 'webp';

        if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });

        // 1. Création d'un ID unique pour cette tâche
        const jobId = crypto.randomUUID();
        globalStore.jobs[jobId] = { progress: 0, status: 'processing' };

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const tempDir = os.tmpdir();
        const inputPath = path.join(tempDir, `${jobId}-${file.name}`);
        const outputPath = path.join(tempDir, `converted-${jobId}.${format}`); 

        await writeFile(inputPath, buffer);

        // 2. Configuration de FFmpeg
        const command = ffmpeg(inputPath);

        // CORRECTION : Si le format de sortie est une image, on s'arrête après 1 seule image
        if (['jpg', 'png', 'webp'].includes(format)) {
        command.frames(1);
        }

        // On lance le traitement
        command
        .on('progress', (progress) => {
            if (progress.percent) {
            globalStore.jobs[jobId].progress = Math.round(progress.percent);
            }
        })
        .on('end', () => {
            globalStore.jobs[jobId].status = 'done';
            globalStore.jobs[jobId].outputPath = outputPath;
            globalStore.jobs[jobId].inputPath = inputPath; 
        })
        .on('error', (err, stdout, stderr) => {
            console.error('Erreur FFmpeg:', err.message);
            globalStore.jobs[jobId].status = 'error';
        })
        .save(outputPath);

            // 3. On répond immédiatement au front-end avec l'ID du job
            return NextResponse.json({ jobId, format });

        } catch (error) {
            return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
        }
}