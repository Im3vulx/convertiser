import { processFfmpegJob } from '@/lib/job-runner';

export async function POST(request: Request) {
    return processFfmpegJob(request, (command, formData) => {
        const effect = formData.get('effect') as string;

        switch (effect) {
        case 'hflip': command.videoFilters('hflip'); break;
        case 'vflip': command.videoFilters('vflip'); break;
        case 'bnw':   command.videoFilters('hue=s=0'); break;
        case 'blur':  command.videoFilters('boxblur=10'); break;
        case 'negate':command.videoFilters('negate'); break;
        }

        return 'jpg';
    });
}