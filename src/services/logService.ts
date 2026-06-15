export const API_BASE_URL = 'http://localhost:5238/api';
// export const API_BASE_URL = 'https://gislog-api.onrender.com/api';
import { logSourceService } from './logSourceService';

// Exception information structure matching backend
export interface ExceptionInfo {
    type: string;
    message: string;
    stackTrace?: string;
    innerException?: ExceptionInfo;
}

// Log entry structure matching Serilog JSON format
export interface LogEntry {
    timestamp: string;
    level: string;
    messageTemplate: string;
    message: string;
    exception?: ExceptionInfo;
    raw?: string;
    properties: Record<string, unknown>;

    // Standard Properties (extracted for easy access)
    serviceName: string;
    environment: string;
    correlationId: string;
    sourceContext: string;

    // HTTP Request Properties
    requestPath?: string;
    requestMethod?: string;
    statusCode?: number;
    durationMs?: number;

    // Application Info
    application?: string;
}

// Paginated response from backend
export interface PaginatedLogsResponse {
    logs: LogEntry[];
    hasMore: boolean;
    offset: number;
    limit: number;
}

// V2 Optimized paginated response (includes timing info)
export interface V2PaginatedResponse {
    logs: LogEntry[];
    hasMore: boolean;
    offset: number;
    limit: number;
    totalCount: number;
    elapsedMs: number;
}

export const logService = {
    getHeaders() {
        const source = logSourceService.getCurrentSource();
        const path = source?.path;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (path) {
            headers['X-Log-Source-Path'] = path;
        }
        return headers;
    },

    async getLogs(from?: Date, to?: Date, offset = 0, limit = 100): Promise<PaginatedLogsResponse> {
        const params = new URLSearchParams();
        if (from) params.append('startDate', from.toISOString());
        if (to) params.append('endDate', to.toISOString());
        params.append('offset', offset.toString());
        params.append('limit', limit.toString());

        const response = await fetch(`${API_BASE_URL}/logs?${params.toString()}`, {
            headers: this.getHeaders(),
            credentials: 'include'  // Important for CORS with credentials
        });
        if (!response.ok) throw new Error('Failed to fetch logs');
        return response.json();
    },

    async getLatestLogs(offset = 0, limit = 100): Promise<PaginatedLogsResponse> {
        const params = new URLSearchParams();
        params.append('offset', offset.toString());
        params.append('limit', limit.toString());

        const response = await fetch(`${API_BASE_URL}/logs/latest?${params.toString()}`, {
            headers: this.getHeaders(),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch latest logs');
        return response.json();
    },

    async searchLogs(query: string, level?: string, from?: Date, to?: Date): Promise<LogEntry[]> {
        const response = await fetch(`${API_BASE_URL}/logs/search`, {
            method: 'POST',
            headers: this.getHeaders(),
            credentials: 'include',
            body: JSON.stringify({
                query,
                level,
                startDate: from?.toISOString(),
                endDate: to?.toISOString()
            })
        });
        if (!response.ok) throw new Error('Failed to search logs');
        return response.json();
    },

    async getLogFiles(): Promise<string[]> {
        const response = await fetch(`${API_BASE_URL}/logs/files`, {
            headers: this.getHeaders(),
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch log files');
        }
        return response.json();
    },

    async getNewLogs(since: string): Promise<LogEntry[]> {
        const response = await fetch(`${API_BASE_URL}/logs/new?since=${since}`, {
            headers: this.getHeaders(),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch new logs');
        return response.json();
    },

    async getLogsByCorrelationId(correlationId: string): Promise<LogEntry[]> {
        const response = await fetch(`${API_BASE_URL}/logs/correlation/${encodeURIComponent(correlationId)}`, {
            headers: this.getHeaders(),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch correlated logs');
        return response.json();
    },

    // =====================================================
    // V2 OPTIMIZED API METHODS (High-Performance)
    // =====================================================

    /**
     * V2: Get logs using optimized streaming reader with caching and indexing.
     * Significantly faster for large files (50-200MB).
     */
    async getLogsV2(options: {
        date?: string;
        offset?: number;
        limit?: number;
        level?: string;
        search?: string;
        correlationId?: string;
        latestFirst?: boolean;
    } = {}): Promise<V2PaginatedResponse> {
        const params = new URLSearchParams();
        if (options.date) params.append('date', options.date);
        if (options.offset !== undefined) params.append('offset', options.offset.toString());
        if (options.limit !== undefined) params.append('limit', options.limit.toString());
        if (options.level) params.append('level', options.level);
        if (options.search) params.append('search', options.search);
        if (options.correlationId) params.append('correlationId', options.correlationId);
        if (options.latestFirst) params.append('latestFirst', 'true');

        const response = await fetch(`${API_BASE_URL}/logs/v2?${params.toString()}`, {
            headers: this.getHeaders(),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch logs (V2)');
        return response.json();
    },

    /**
     * V2: Get latest logs using reverse file reading.
     * Optimized for "Load Latest" scenarios - typically <100ms.
     */
    async getLatestLogsV2(count = 50): Promise<LogEntry[]> {
        const response = await fetch(`${API_BASE_URL}/logs/v2/latest?count=${count}`, {
            headers: this.getHeaders(),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch latest logs (V2)');
        return response.json();
    },

    /**
     * V2: Get logs by CorrelationId using in-memory index.
     * Extremely fast for correlation lookups.
     */
    async getLogsByCorrelationIdV2(correlationId: string): Promise<LogEntry[]> {
        const response = await fetch(`${API_BASE_URL}/logs/v2/correlation/${encodeURIComponent(correlationId)}`, {
            headers: this.getHeaders(),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch correlated logs (V2)');
        return response.json();
    }
};
