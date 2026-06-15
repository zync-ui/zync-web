import { LogEntry } from './logService';

// Streaming service for real-time log delivery
export class StreamingService {
    private eventSource: EventSource | null = null;
    private subscribers: Map<string, (data: any) => void> = new Map();
    private buffer: LogEntry[] = [];
    private bufferSize = 10000;
    private isStreaming = false;

    // Subscribe to log stream
    subscribe(id: string, callback: (data: any) => void) {
        this.subscribers.set(id, callback);
        return () => this.subscribers.delete(id);
    }

    // Start streaming logs from backend
    startStream(url: string, options: {
        date?: string;
        level?: string;
        search?: string;
        startTime?: string;
        endTime?: string;
        customPath?: string;
    } = {}) {
        if (this.isStreaming) return;

        const params = new URLSearchParams();
        if (options.date) params.append('date', options.date);
        if (options.level) params.append('level', options.level);
        if (options.search) params.append('search', options.search);
        if (options.startTime) params.append('startTime', options.startTime);
        if (options.endTime) params.append('endTime', options.endTime);
        if (options.customPath) params.append('customPath', options.customPath);
        
        this.eventSource = new EventSource(`${url}?${params.toString()}`);

        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // Add to buffer
            this.buffer.push(...data.logs);
            
            // Maintain buffer size
            if (this.buffer.length > this.bufferSize) {
                this.buffer = this.buffer.slice(-this.bufferSize);
            }

            // Notify subscribers
            this.subscribers.forEach(callback => callback({
                logs: data.logs,
                total: this.buffer.length,
                hasMore: data.hasMore
            }));
        };

        this.eventSource.onerror = () => {
            this.stopStream();
        };

        this.isStreaming = true;
    }

    // Stop streaming
    stopStream() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isStreaming = false;
    }

    // Get buffered logs
    getBufferedLogs(): LogEntry[] {
        return [...this.buffer];
    }

    // Clear buffer
    clearBuffer() {
        this.buffer = [];
    }
}

export const streamingService = new StreamingService();
