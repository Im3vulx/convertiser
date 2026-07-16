import { NextResponse } from 'next/server';

const globalStore = global as any;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId || !globalStore.jobs || !globalStore.jobs[jobId]) {
        return new NextResponse('Job non trouvé', { status: 404 });
    }

    // Création d'un flux de données continu (Stream)
    const stream = new ReadableStream({
        start(controller) {
        const sendEvent = (data: any) => {
            // Le format SSE exige que le message commence par "data: " et finisse par "\n\n"
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // On vérifie le store toutes les 500 millisecondes
        const interval = setInterval(() => {
            const job = globalStore.jobs[jobId];
            
            if (!job) {
            clearInterval(interval);
            controller.close();
            return;
            }

            sendEvent({ progress: job.progress, status: job.status });

            // Si le job est terminé ou en erreur, on coupe la connexion
            if (job.status === 'done' || job.status === 'error') {
            clearInterval(interval);
            controller.close();
            }
        }, 500);
        }
    });

    return new NextResponse(stream, {
        headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        },
    });
}