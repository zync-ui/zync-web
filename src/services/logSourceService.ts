import { API_BASE_URL } from '../config/constants';
import type { LogEntry } from './logService';

export type LogSourceType = 'local' | 'server';

export interface LogSource {
    type: LogSourceType;
    path: string;
}

/**
 * Unified log source service for managing both Local and On-Premise log sources.
 * Provides consistent API for fetching dates, loading logs, and searching.
 */
export const logSourceService = {
    /**
     * Get the currently configured log source from localStorage
     */
    getCurrentSource(): LogSource {
        const type = (localStorage.getItem('logSourceType') as LogSourceType) || 'local';
        const path = type === 'local'
            ? localStorage.getItem('logSourceLocalPath') || localStorage.getItem('logSourcePath') || ''
            : localStorage.getItem('logSourceServerPath') || '';
        return { type, path };
    },

    /**
     * Save log source configuration to localStorage
     */
    saveSource(source: LogSource): void {
        localStorage.setItem('logSourceType', source.type);
        if (source.type === 'local') {
            localStorage.setItem('logSourceLocalPath', source.path);
        } else {
            localStorage.setItem('logSourceServerPath', source.path);
        }
        // Also save to legacy key for backward compatibility
        localStorage.setItem('logSourcePath', source.path);
    },

    /**
     * Build headers with source path
     */
    getHeaders(source: LogSource): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (source.path) {
            headers['X-Log-Source-Path'] = source.path;
        }
        return headers;
    },

    /**
     * Get available dates extracted from log filenames
     * Returns dates in yyyy-MM-dd format, sorted descending (newest first)
     */
    async getAvailableDates(source: LogSource): Promise<string[]> {
        const response = await fetch(`${API_BASE_URL}/logs/dates`, {
            headers: this.getHeaders(source),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 404) {
                throw new Error('Log folder not found. Please verify the path is correct.');
            }
            if (response.status === 403) {
                throw new Error('Access denied to log folder. Please check permissions.');
            }
            if (response.status === 503) {
                throw new Error('UNA connection error. Cannot reach on-premise server.');
            }
            throw new Error(errorText || 'Failed to fetch available dates');
        }

        return response.json();
    },

    /**
     * Load logs for a specific date.
     * @param source - The log source configuration
     * @param date - Date in yyyy-MM-dd format
     * @param limit - Max logs to fetch (default 2000)
     */
    async loadLogs({ source, date, limit = 2000 }: { source: LogSource; date: string; limit?: number }): Promise<LogEntry[]> {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const params = new URLSearchParams({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            limit: limit.toString()
        });

        // Use the correct API endpoint
        const response = await fetch(`${API_BASE_URL}/logs?${params}`, {
            headers: this.getHeaders(source),
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Log file not found for selected date.');
            }
            throw new Error('Failed to load logs for the selected date.');
        }

        const data = await response.json();
        return data.logs || [];
    },

    /**
     * Parse date from a log filename
     * Supports formats: yyyy-MM-dd and yyyyMMdd
     * @returns Date string in yyyy-MM-dd format or null if no date found
     */
    parseDateFromFilename(filename: string): string | null {
        // Match yyyy-MM-dd (e.g., 2025-12-26) or yyyyMMdd (e.g., 20251226)
        const match = filename.match(/(\d{4}-\d{2}-\d{2}|\d{8})/);
        if (!match) return null;

        const dateStr = match[1];

        // Already in yyyy-MM-dd format
        if (dateStr.includes('-')) {
            return dateStr;
        }

        // Convert yyyyMMdd to yyyy-MM-dd
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    },

    /**
     * Client-side search filter for logs
     * Searches across message, messageTemplate, raw content, and correlationId
     */
    searchLogs(logs: LogEntry[], query: string): LogEntry[] {
        if (!query.trim()) return logs;

        const lowerQuery = query.toLowerCase();
        return logs.filter(log =>
            log.message?.toLowerCase().includes(lowerQuery) ||
            log.messageTemplate?.toLowerCase().includes(lowerQuery) ||
            log.raw?.toLowerCase().includes(lowerQuery) ||
            log.correlationId?.toLowerCase().includes(lowerQuery) ||
            log.serviceName?.toLowerCase().includes(lowerQuery) ||
            log.sourceContext?.toLowerCase().includes(lowerQuery) ||
            (log.properties && JSON.stringify(log.properties).toLowerCase().includes(lowerQuery))
        );
    },

    /**
     * Format a date string for display
     */
    formatDateForDisplay(dateStr: string): string {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    }
};
