import { processFfmpegJob } from '@/lib/job-runner';

export async function POST(request: Request) {
    return processFfmpegJob(request, (command, formData, originalExt) => {
        const w = formData.get('width') as string || 'iw/2'; 
        const h = formData.get('height') as string || 'ih/2';
        const x = formData.get('x') as string || '(iw-ow)/2';
        const y = formData.get('y') as string || '(ih-oh)/2';

        if (['jpg', 'jpeg', 'png', 'webp'].includes(originalExt)) command.frames(1);

        command.videoFilters(`crop=${w}:${h}:${x}:${y}`);
        return originalExt;
    });
}