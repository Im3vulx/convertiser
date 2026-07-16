import { processFfmpegJob } from '@/lib/job-runner';

export async function POST(request: Request) {
    return processFfmpegJob(request, (command, formData, originalExt) => {
        const compressionLevel = formData.get('compressionLevel') as string || 'standard';
        const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(originalExt);

        if (isImage) {
        command.frames(1);
        command.outputOptions([compressionLevel === 'high' ? '-q:v 5' : '-q:v 2']);
        } else {
        command.outputOptions([compressionLevel === 'high' ? '-crf 28' : '-crf 23']);
        }

        return originalExt;
    });
}