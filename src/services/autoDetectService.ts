import { API_BASE_URL, LogEntry } from './logService';

/**
 * Auto-detect service for discovering and loading log files.
 * Uses the backend's configured LogFilePath from appsettings.json.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a discovered log file from the backend.
 */
export interface DiscoveredLogFile {
    date: string;         // "2025-12-28"
    fileName: string;     // "log-2025-12-28.txt"
    fullPath: string;     // "C:\\Logs\\log-2025-12-28.txt"
    sizeBytes: number;    // File size in bytes
    lastModified: string; // ISO date string
}

/**
 * Response from the /api/logs/discover endpoint.
 */
export interface DiscoverLogsResponse {
    configuredPath: string;   // The path from appsettings.json
    isUncPath: boolean;       // Whether it's a network path
    isAccessible: boolean;    // Whether the folder was accessible
    errorMessage?: string;    // Error message if not accessible
    files: DiscoveredLogFile[];
    totalFiles: number;
}

/**
 * Result from loading logs by file path.
 */
export interface LoadLogsByFileResult {
    logs: LogEntry[];
    filePath: string;
    date: string;
    count: number;
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

export interface DatePatterns {
    hyphenated: string;  // YYYY-MM-DD
    underscored: string; // YYYY_MM_DD
    compact: string;     // YYYYMMDD
}

/**
 * Get today's date in multiple formats for pattern matching.
 */
export function getTodayDatePatterns(): DatePatterns {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return {
        hyphenated: `${year}-${month}-${day}`,
        underscored: `${year}_${month}_${day}`,
        compact: `${year}${month}${day}`,
    };
}

/**
 * Get today's date in YYYY-MM-DD format.
 */
export function getTodayDateString(): string {
    return getTodayDatePatterns().hyphenated;
}

/**
 * Check if a date string matches today's date.
 */
export function isToday(dateString: string): boolean {
    const patterns = getTodayDatePatterns();
    return (
        dateString === patterns.hyphenated ||
        dateString === patterns.underscored ||
        dateString === patterns.compact ||
        dateString.includes(patterns.hyphenated) ||
        dateString.includes(patterns.underscored) ||
        dateString.includes(patterns.compact)
    );
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format date for display.
 */
export function formatDateForDisplay(dateStr: string): string {
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

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Discover log files from the backend's configured LogFilePath or custom path.
 * Calls GET /api/logs/discover
 */
export async function discoverLogFiles(customPath?: string): Promise<DiscoverLogsResponse> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    if (customPath) {
        headers['X-Log-Source-Path'] = customPath;
    }

    const response = await fetch(`${API_BASE_URL}/logs/discover`, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
    });

    if (!response.ok) {
        // Try to parse error response
        try {
            const errorData = await response.json();
            if (errorData.errorMessage) {
                throw new Error(errorData.errorMessage);
            }
        } catch {
            // Fall through to generic error
        }
        throw new Error(`Discovery failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Load logs from a specific file path.
 * Calls GET /api/logs/by-file?path=...
 */
export async function loadLogsByFilePath(fullPath: string): Promise<LogEntry[]> {
    const params = new URLSearchParams({ path: fullPath });

    const response = await fetch(`${API_BASE_URL}/logs/by-file?${params}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(`Failed to load logs from file: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Discover and load logs for today's date automatically.
 */
export async function autoDetectAndLoadTodaysLogs(): Promise<LoadLogsByFileResult> {
    // Step 1: Discover all log files
    const discovery = await discoverLogFiles();

    if (!discovery.isAccessible) {
        throw new Error(discovery.errorMessage || 'Cannot access log folder');
    }

    if (discovery.files.length === 0) {
        throw new Error('No log files found in the configured folder');
    }

    // Step 2: Find today's file
    const todayPattern = getTodayDatePatterns().hyphenated;
    const todaysFile = discovery.files.find(f => f.date === todayPattern);

    if (!todaysFile) {
        // If no file for today, return the most recent file instead
        const mostRecent = discovery.files[0];
        const logs = await loadLogsByFilePath(mostRecent.fullPath);

        return {
            logs,
            filePath: mostRecent.fullPath,
            date: mostRecent.date,
            count: logs.length
        };
    }

    // Step 3: Load logs from today's file
    const logs = await loadLogsByFilePath(todaysFile.fullPath);

    return {
        logs,
        filePath: todaysFile.fullPath,
        date: todaysFile.date,
        count: logs.length
    };
}

// ============================================================================
// SERVICE EXPORT
// ============================================================================

/**
 * Auto-detect service object for consistent API.
 */
export const autoDetectService = {
    // Discovery
    discoverLogFiles,
    loadLogsByFilePath,
    autoDetectAndLoadTodaysLogs,

    // Date utilities
    getTodayDatePatterns,
    getTodayDateString,
    isToday,

    // Formatting
    formatFileSize,
    formatDateForDisplay,
};

export default autoDetectService;
