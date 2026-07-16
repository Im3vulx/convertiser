import { processFfmpegJob } from '@/lib/job-runner';

export async function POST(request: Request) {
    return processFfmpegJob(request, (command, formData, originalExt) => {
        const angle = formData.get('angle') as string || '90';
        if (['jpg', 'jpeg', 'png', 'webp'].includes(originalExt)) command.frames(1);

        if (angle === '90') command.videoFilters('transpose=1');
        else if (angle === '180') command.videoFilters('transpose=2,transpose=2');
        else if (angle === '270' || angle === '-90') command.videoFilters('transpose=2');

        return originalExt;
    });
}