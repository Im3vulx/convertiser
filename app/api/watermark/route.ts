import { processFfmpegJob } from '@/lib/job-runner';

export async function POST(request: Request) {
    return processFfmpegJob(request, (command, formData, originalExt) => {
        const text = formData.get('text') as string || 'Filigrane';
        
        if (['jpg', 'jpeg', 'png', 'webp'].includes(originalExt)) {
        command.frames(1);
        }

        const drawtextFilter = `drawtext=text='${text}':x=(w-text_w)/2:y=h-th-40:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=10`;
        
        command.videoFilters(drawtextFilter);
        
        return originalExt;
    });
}