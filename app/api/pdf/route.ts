import { processFfmpegJob } from '@/lib/job-runner';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const execPromise = promisify(exec);

export async function POST(request: Request) {
    return processFfmpegJob(request, async (command, formData) => {
        const action = formData.get('action') as string;
        const inputPath = command.inputPath;
        const outputPath = inputPath.replace('.pdf', '-processed.pdf');

        if (action === 'compress') {
        await execPromise(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`);
        } 
        else if (action === 'to-images') {
        const imageOutput = inputPath.replace('.pdf', '-page%d.jpg');
        await execPromise(`gs -sDEVICE=jpeg -r300 -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${imageOutput}" "${inputPath}"`);
        return 'zip';
        }
        return 'pdf';
    });
}