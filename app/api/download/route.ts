import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const format = searchParams.get('format');

    if (!jobId || !format) {
        return new Response('Paramètres manquants', { status: 400 });
    }

    const filePath = `/tmp/${jobId}.${format}`;

    try {
        const fileBuffer = await fs.readFile(filePath);
        
        fs.unlink(filePath).catch((err) => console.error("Erreur de nettoyage:", err));

        return new NextResponse(fileBuffer, {
        headers: {
            'Content-Disposition': `attachment; filename="resultat-${jobId}.${format}"`,
            'Content-Type': 'application/octet-stream',
        },
        });
    } catch (error) {
        return new Response('Fichier introuvable ou expiré', { status: 404 });
    }
}