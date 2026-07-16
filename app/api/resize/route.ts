import { processFfmpegJob } from '@/lib/job-runner';

export async function POST(request: Request) {
    return processFfmpegJob(request, (command, formData, originalExt) => {
        const w = formData.get('width') as string || '800';
        const h = formData.get('height') as string || '-1';
        
        if (['jpg', 'jpeg', 'png', 'webp'].includes(originalExt)) command.frames(1);

        command.videoFilters(`scale=${w}:${h}`);
        return originalExt;
    });
}