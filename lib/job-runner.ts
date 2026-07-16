import { NextResponse } from 'next/server';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import ffmpeg from 'fluent-ffmpeg';
import crypto from 'node:crypto';

const globalStore = global as any;
if (!globalStore.jobs) globalStore.jobs = {};

export async function processFfmpegJob(
    request: Request,
    buildOptions: (command: ffmpeg.FfmpegCommand, formData: FormData, originalExt: string) => string 
) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as unknown as File;
        if (!file) return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });

        const jobId = crypto.randomUUID();
        globalStore.jobs[jobId] = { progress: 0, status: 'processing' };

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const originalExtension = file.name.split('.').pop()?.toLowerCase() || 'tmp';
        const tempDir = os.tmpdir();
        const inputPath = path.join(tempDir, `${jobId}-${file.name}`);
        
        await writeFile(inputPath, buffer);

        const command = ffmpeg(inputPath);
        
        const targetFormat = buildOptions(command, formData, originalExtension);
        const outputPath = path.join(tempDir, `converted-${jobId}.${targetFormat}`);

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

        return NextResponse.json({ jobId, targetFormat });

    } catch (error) {
        console.error('Erreur job-runner:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}