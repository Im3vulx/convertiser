import { NextResponse } from 'next/server';
import { writeFile, unlink, readdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);
const globalStore = global as any;
if (!globalStore.jobs) globalStore.jobs = {};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as unknown as File;
        const action = formData.get('action') as string;

        if (!file) return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });

        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'Fichier trop volumineux. La limite est de 50 Mo.' },
                { status: 413 }
            );
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json({ error: 'Format non supporté' }, { status: 415 });
        }

        const jobId = crypto.randomUUID();
        const baseName = file.name.replace(/\.pdf$/i, '') || file.name;
        globalStore.jobs[jobId] = { progress: 0, status: 'processing', originalName: baseName };

        const tempDir = os.tmpdir();
        const inputPath = path.join(tempDir, `${jobId}-${file.name}`);
        await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

        (async () => {
            try {
                globalStore.jobs[jobId].progress = 30;

                if (action === 'compress') {
                    const outputPath = path.join(tempDir, `converted-${jobId}.pdf`);
                    await execPromise(
                        `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`
                    );
                    globalStore.jobs[jobId].progress = 100;
                    globalStore.jobs[jobId].status = 'done';
                    globalStore.jobs[jobId].outputPath = outputPath;
                } else if (action === 'to-images') {
                    const imagePattern = path.join(tempDir, `${jobId}-page%d.jpg`);
                    await execPromise(
                        `gs -sDEVICE=jpeg -r300 -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${imagePattern}" "${inputPath}"`
                    );

                    globalStore.jobs[jobId].progress = 70;

                    const files = await readdir(tempDir);
                    const imageFiles = files.filter((f) => f.startsWith(`${jobId}-page`) && f.endsWith('.jpg'));
                    const zipPath = path.join(tempDir, `converted-${jobId}.zip`);

                    if (imageFiles.length > 0) {
                        const quotedFiles = imageFiles.map((f) => `"${f}"`).join(' ');
                        await execPromise(`cd "${tempDir}" && zip -j "${zipPath}" ${quotedFiles}`);
                        for (const f of imageFiles) {
                            await unlink(path.join(tempDir, f)).catch(() => {});
                        }
                    }

                    globalStore.jobs[jobId].progress = 100;
                    globalStore.jobs[jobId].status = 'done';
                    globalStore.jobs[jobId].outputPath = zipPath;
                } else {
                    globalStore.jobs[jobId].status = 'error';
                }
            } catch (err) {
                console.error('Erreur PDF:', err);
                globalStore.jobs[jobId].status = 'error';
            } finally {
                await unlink(inputPath).catch(() => {});
            }
        })();

        const targetFormat = action === 'to-images' ? 'zip' : 'pdf';
        return NextResponse.json({ jobId, targetFormat });
    } catch (error) {
        console.error('Erreur PDF route:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
