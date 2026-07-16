import { processFfmpegJob } from '@/lib/job-runner';

export async function POST(request: Request) {
    return processFfmpegJob(request, (command, formData, originalExt) => {
        const targetFormat = formData.get('format') as string || 'webp';
        const isImage = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif', 'gif', 'ico', 'tga'].includes(targetFormat.toLowerCase());

        if (isImage) {
        command.frames(1);
        }

        return targetFormat;
    });
}