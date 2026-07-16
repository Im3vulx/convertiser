import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';

const execPromise = promisify(exec);

export async function POST(request: Request) {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    const paths: string[] = [];
    const outputPath = `/tmp/merged-${Date.now()}.pdf`;

    try {
        for (const f of files) {
        const p = `/tmp/${Date.now()}-${f.name}`;
        await fs.writeFile(p, Buffer.from(await f.arrayBuffer()));
        paths.push(p);
        }

        const safePaths = paths.map(p => `"${p}"`).join(' ');
        await execPromise(`gs -sDEVICE=pdfwrite -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" ${safePaths}`);

        const fileBuffer = await fs.readFile(outputPath);

        return new Response(fileBuffer, {
        headers: { 
            'Content-Type': 'application/pdf', 
            'Content-Disposition': 'attachment; filename=fusion-pdf.pdf' 
        }
        });

    } catch (error) {
        console.error("Erreur lors de la fusion:", error);
        return new Response("Erreur serveur", { status: 500 });
    } finally {
        for (const p of paths) {
        await fs.unlink(p).catch(() => {}); 
        }
        await fs.unlink(outputPath).catch(() => {});
    }
}