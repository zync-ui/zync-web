import React, { useMemo, useCallback } from 'react';
import { cn } from '../lib/utils';
import { LogEntry } from '../services/logService';
import { AlertCircle, Info, AlertTriangle, Bug, Skull, ChevronDown } from 'lucide-react';

interface LogStatsProps {
    logs: LogEntry[];
}

interface LogCounts {
    info: number;
    warning: number;
    error: number;
    debug: number;
    fatal: number;
    total: number;
}

// Utility to count logs by level
export const countLogsByLevel = (logs: LogEntry[]): LogCounts => {
    const counts: LogCounts = { info: 0, warning: 0, error: 0, debug: 0, fatal: 0, total: logs.length };

    logs.forEach(log => {
        const level = log.level.toUpperCase();
        switch (level) {
            case 'ERR':
            case 'ERROR':
                counts.error++;
                break;
            case 'WRN':
            case 'WARN':
            case 'WARNING':
                counts.warning++;
                break;
            case 'DBG':
            case 'DEBUG':
                counts.debug++;
                break;
            case 'FATAL':
            case 'FTL':
                counts.fatal++;
                break;
            default:
                counts.info++;
        }
    });

    return counts;
};

// Determine dominant log type for badge color
const getDominantLevel = (counts: LogCounts): 'error' | 'warning' | 'info' => {
    if (counts.error > 0 || counts.fatal > 0) return 'error';
    if (counts.warning > 0) return 'warning';
    return 'info';
};

// Smart Log Count Badge with breakdown
export const LogStatsBadge: React.FC<{ counts: LogCounts }> = ({ counts }) => {
    if (counts.total === 0) return null;

    const dominant = getDominantLevel(counts);

    const badgeStyles = {
        error: 'from-red-500/20 to-orange-500/20 border-red-400/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
        warning: 'from-amber-500/20 to-yellow-500/20 border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
        info: 'from-emerald-500/20 to-cyan-500/20 border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
    };

    return (
        <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r backdrop-blur-xl border animate-in fade-in zoom-in-95 duration-300",
            "bg-gray-950/80",
            badgeStyles[dominant]
        )}>
            {/* Total Count */}
            <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white tabular-nums">{counts.total.toLocaleString()}</span>
                <span className="text-xs text-gray-400 font-medium">Logs</span>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-700" />

            {/* Breakdown Pills */}
            <div className="flex items-center gap-2">
                {counts.info > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30">
                        <Info size={10} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-300 tabular-nums">{counts.info.toLocaleString()}</span>
                    </div>
                )}
                {counts.warning > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30">
                        <AlertTriangle size={10} className="text-amber-400" />
                        <span className="text-[10px] font-bold text-amber-300 tabular-nums">{counts.warning.toLocaleString()}</span>
                    </div>
                )}
                {counts.error > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30">
                        <AlertCircle size={10} className="text-red-400" />
                        <span className="text-[10px] font-bold text-red-300 tabular-nums">{counts.error.toLocaleString()}</span>
                    </div>
                )}
                {counts.fatal > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/30 border border-red-600/40">
                        <Skull size={10} className="text-red-500" />
                        <span className="text-[10px] font-bold text-red-400 tabular-nums">{counts.fatal.toLocaleString()}</span>
                    </div>
                )}
                {counts.debug > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30">
                        <Bug size={10} className="text-purple-400" />
                        <span className="text-[10px] font-bold text-purple-300 tabular-nums">{counts.debug.toLocaleString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Error Heatmap Bar
export const LogHeatmapBar: React.FC<{ counts: LogCounts }> = ({ counts }) => {
    if (counts.total === 0) return null;

    const getPercentage = (count: number) => (count / counts.total) * 100;

    return (
        <div className="w-full h-2 rounded-full overflow-hidden bg-gray-800/50 flex shadow-inner">
            {/* Info - Blue */}
            {counts.info > 0 && (
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 hover:brightness-125"
                    style={{ width: `${getPercentage(counts.info)}%` }}
                    title={`Info: ${counts.info}`}
                />
            )}
            {/* Debug - Purple */}
            {counts.debug > 0 && (
                <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500 hover:brightness-125"
                    style={{ width: `${getPercentage(counts.debug)}%` }}
                    title={`Debug: ${counts.debug}`}
                />
            )}
            {/* Warning - Amber */}
            {counts.warning > 0 && (
                <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 hover:brightness-125"
                    style={{ width: `${getPercentage(counts.warning)}%` }}
                    title={`Warning: ${counts.warning}`}
                />
            )}
            {/* Error - Red */}
            {counts.error > 0 && (
                <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500 hover:brightness-125"
                    style={{ width: `${getPercentage(counts.error)}%` }}
                    title={`Error: ${counts.error}`}
                />
            )}
            {/* Fatal - Dark Red */}
            {counts.fatal > 0 && (
                <div
                    className="h-full bg-gradient-to-r from-red-700 to-red-600 transition-all duration-500 hover:brightness-125"
                    style={{ width: `${getPercentage(counts.fatal)}%` }}
                    title={`Fatal: ${counts.fatal}`}
                />
            )}
        </div>
    );
};

// Jump to Next Error Button (Floating)
export const JumpToNextErrorButton: React.FC<{
    logs: LogEntry[];
    currentIndex: number;
    onJump: (index: number) => void;
}> = ({ logs, currentIndex, onJump }) => {
    const findNextError = useCallback(() => {
        for (let i = currentIndex + 1; i < logs.length; i++) {
            const level = logs[i].level.toUpperCase();
            if (level === 'ERR' || level === 'ERROR' || level === 'FATAL' || level === 'FTL') {
                return i;
            }
        }
        // Wrap around to start
        for (let i = 0; i <= currentIndex; i++) {
            const level = logs[i].level.toUpperCase();
            if (level === 'ERR' || level === 'ERROR' || level === 'FATAL' || level === 'FTL') {
                return i;
            }
        }
        return -1;
    }, [logs, currentIndex]);

    const hasErrors = useMemo(() => {
        return logs.some(log => {
            const level = log.level.toUpperCase();
            return level === 'ERR' || level === 'ERROR' || level === 'FATAL' || level === 'FTL';
        });
    }, [logs]);

    if (!hasErrors) return null;

    const handleClick = () => {
        const nextIndex = findNextError();
        if (nextIndex !== -1) {
            onJump(nextIndex);
        }
    };

    return (
        <button
            onClick={handleClick}
            className="fixed right-6 bottom-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold text-sm shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 transition-all duration-200 border border-red-400/30"
            title="Jump to Next Error"
        >
            <ChevronDown size={16} className="rotate-[-90deg]" />
            <span>Next Error</span>
            <AlertCircle size={14} />
        </button>
    );
};

// Full Stats Panel combining badge and heatmap
export const LogStatsPanel: React.FC<LogStatsProps> = ({ logs }) => {
    const counts = useMemo(() => countLogsByLevel(logs), [logs]);

    if (logs.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 px-6 py-3 bg-gray-900/30 border-b border-gray-800">
            {/* Heatmap Bar */}
            <LogHeatmapBar counts={counts} />
        </div>
    );
};

export default LogStatsPanel;
