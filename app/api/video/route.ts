import { processFfmpegJob } from '@/lib/job-runner';

export async function POST(request: Request) {
    return processFfmpegJob(request, (command, formData) => {
        const action = formData.get('action') as string;

        if (action === 'trim') {
            const start = formData.get('start') as string;
            const end = formData.get('end') as string;
            const s = start.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            const e = end.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            command.setStartTime(s).setDuration(e - s);
        } 
        else if (action === 'mute') {
            command.noAudio();
        } 
        else if (action === 'speed') {
            const factor = Number.parseFloat(formData.get('factor') as string || '1');
            command.videoFilters(`setpts=${1/factor}*PTS`).audioFilters(`atempo=${factor}`);
        }

        return action === 'extract-audio' ? 'mp3' : 'mp4';
    }, 'video');
}