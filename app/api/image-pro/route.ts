import { processFfmpegJob } from '@/lib/job-runner';
import { exec } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(exec);

export async function POST(request: Request) {
    return processFfmpegJob(request, (command, formData, originalExt) => {
        const action = formData.get('action') as string;
        
        if (action === 'gif') return 'gif';
        return 'png';
    }, 'image');
}