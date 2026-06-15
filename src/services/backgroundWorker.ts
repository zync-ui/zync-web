// Background Worker for Parallel Log Processing
export class BackgroundWorker {
    private workers: Map<string, Worker> = new Map();
    private pendingTasks: Map<string, Promise<any>> = new Map();

    // Parallel log chunk processing
    async processLogChunks(chunks: string[], processor: (chunk: string) => any) {
        const promises = chunks.map(chunk => 
            new Promise((resolve) => {
                setTimeout(() => resolve(processor(chunk)), 0);
            })
        );
        
        return Promise.all(promises);
    }

    // Stream logs in batches
    async* streamLogs(logs: any[], batchSize = 1000) {
        for (let i = 0; i < logs.length; i += batchSize) {
            yield logs.slice(i, i + batchSize);
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    // Cancel ongoing operations
    cancelAll() {
        this.pendingTasks.clear();
        this.workers.forEach(worker => worker.terminate());
        this.workers.clear();
    }
}

export const backgroundWorker = new BackgroundWorker();
