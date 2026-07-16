import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { removeBackground } from '@imgly/background-removal-node';

const globalStore = global as any;
if (!globalStore.jobs) globalStore.jobs = {};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as unknown as File;
        
        if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });

        const jobId = crypto.randomUUID();
        globalStore.jobs[jobId] = { progress: 0, status: 'processing' };

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const tempDir = os.tmpdir();
        const inputPath = path.join(tempDir, `${jobId}-${file.name}`);
        const outputPath = path.join(tempDir, `converted-${jobId}.png`); 
        
        await writeFile(inputPath, buffer);

        (async () => {
        try {
            globalStore.jobs[jobId].progress = 25;
            
            const blob = await removeBackground(inputPath);
            
            globalStore.jobs[jobId].progress = 75;
            
            const arrayBuffer = await blob.arrayBuffer();
            const outBuffer = Buffer.from(arrayBuffer);
            await writeFile(outputPath, outBuffer);

            globalStore.jobs[jobId].progress = 100;
            globalStore.jobs[jobId].status = 'done';
            globalStore.jobs[jobId].outputPath = outputPath;
            globalStore.jobs[jobId].inputPath = inputPath;
        } catch (err) {
            console.error('Erreur Remove BG:', err);
            globalStore.jobs[jobId].status = 'error';
        }
        })();

        return NextResponse.json({ jobId, targetFormat: 'png' });

    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}