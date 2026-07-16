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
        const mode = data.get('mode') as string || 'convert';
        const format = data.get('format') as string || 'webp';
        const compressionLevel = data.get('compressionLevel') as string || 'standard';

        if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });

        const jobId = crypto.randomUUID();
        globalStore.jobs[jobId] = { progress: 0, status: 'processing' };

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // On extrait l'extension d'origine si on est en mode compression
        const originalExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
        const targetFormat = mode === 'compress' ? originalExtension : format;

        const tempDir = os.tmpdir();
        const inputPath = path.join(tempDir, `${jobId}-${file.name}`);
        const outputPath = path.join(tempDir, `converted-${jobId}.${targetFormat}`); 

        await writeFile(inputPath, buffer);

        const command = ffmpeg(inputPath);
        const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(targetFormat);

        // Logique exclusive selon le mode choisi
        if (mode === 'compress') {
        if (isImage) {
            // Options de compression pour les images
            command.outputOptions([compressionLevel === 'high' ? '-q:v 5' : '-q:v 2']);
        } else {
            // Options de compression pour les vidéos (CRF)
            command.outputOptions([compressionLevel === 'high' ? '-crf 28' : '-crf 23']);
        }
        } else {
        // Mode conversion (on garde la sécurité pour les images)
        if (isImage) {
            command.frames(1);
        }
        }

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
        .on('error', (err) => {
            console.error('Erreur FFmpeg:', err.message);
            globalStore.jobs[jobId].status = 'error';
        })
        .save(outputPath);

        // On renvoie aussi le targetFormat pour que le front sache quoi télécharger
        return NextResponse.json({ jobId, targetFormat });

    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}