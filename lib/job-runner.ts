import { NextResponse } from 'next/server';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import ffmpeg from 'fluent-ffmpeg';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);
const globalStore = global as any;
if (!globalStore.jobs) globalStore.jobs = {};

const COMPLEX_FORMATS = ['heic', 'psd', 'svg', 'cr2', 'nef', 'dng', 'raw'];

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

        // ---------------------------------------------------------
        // MOTEUR 1 : IMAGEMAGICK (Pour les formats complexes)
        // ---------------------------------------------------------
        if (COMPLEX_FORMATS.includes(originalExtension)) {
        globalStore.jobs[jobId].progress = 40; 
        
        const targetFormat = formData.get('format') as string || 'png';
        const outputPath = path.join(tempDir, `converted-${jobId}.${targetFormat}`);
        
        (async () => {
            try {
            await execPromise(`convert "${inputPath}" "${outputPath}"`);
            globalStore.jobs[jobId].progress = 100;
            globalStore.jobs[jobId].status = 'done';
            globalStore.jobs[jobId].outputPath = outputPath;
            globalStore.jobs[jobId].inputPath = inputPath;
            } catch (err) {
            console.error('Erreur ImageMagick:', err);
            globalStore.jobs[jobId].status = 'error';
            }
        })();

        return NextResponse.json({ jobId, targetFormat });
        }
        
        // ---------------------------------------------------------
        // MOTEUR 2 : FFMPEG (Pour les vidéos et images standards)
        // ---------------------------------------------------------
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
        .on('error', (err) => {
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