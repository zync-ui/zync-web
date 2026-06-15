import React, { useState } from 'react';
import { LogEntry, ExceptionInfo } from '../../services/logService';
import { ChevronDown, Server, Database, Globe, AlertCircle, Hash } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CorrelationTimelineProps {
    logs: LogEntry[];
    correlationId: string;
}

// Determine source color based on serviceName or message content
const getSourceColor = (entry: LogEntry): { bg: string; border: string; text: string; dot: string; label: string } => {
    const level = entry.level.toUpperCase();
    const service = entry.serviceName?.toLowerCase() || '';
    const message = entry.message?.toLowerCase() || '';
    const sourceContext = entry.sourceContext?.toLowerCase() || '';

    // Error takes priority
    if (level === 'ERROR' || level === 'ERR' || level === 'FATAL' || level === 'FTL') {
        return {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            text: 'text-red-400',
            dot: 'bg-red-500',
            label: 'Error'
        };
    }

    // Database operations
    if (service.includes('db') || service.includes('database') ||
        message.includes('sql') || message.includes('query') || message.includes('select') ||
        message.includes('insert') || message.includes('update') || message.includes('delete') ||
        sourceContext.includes('entityframework') || sourceContext.includes('repository')) {
        return {
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/30',
            text: 'text-purple-400',
            dot: 'bg-purple-500',
            label: 'Database'
        };
    }

    // API2 / Downstream services
    if (service.includes('api2') || service.includes('downstream') ||
        message.includes('calling') || message.includes('external') ||
        message.includes('httpclient') || sourceContext.includes('httpclient')) {
        return {
            bg: 'bg-green-500/10',
            border: 'border-green-500/30',
            text: 'text-green-400',
            dot: 'bg-green-500',
            label: 'API2'
        };
    }

    // Default: API1 / Main service
    return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        dot: 'bg-blue-500',
        label: 'API1'
    };
};

// Exception display component
const ExceptionDisplay = ({ exception }: { exception: ExceptionInfo }) => {
    const [showStack, setShowStack] = useState(false);

    return (
        <div className="space-y-2 mt-2">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-red-400 font-semibold text-xs">{exception.type}</span>
                <span className="text-red-200/70">:</span>
                <span className="text-red-200 text-xs">{exception.message}</span>
            </div>

            {exception.stackTrace && (
                <div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowStack(!showStack);
                        }}
                        className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1"
                    >
                        <ChevronDown
                            size={10}
                            className={showStack ? "rotate-180" : ""}
                        />
                        {showStack ? 'Hide' : 'Show'} Stack Trace
                    </button>

                    {showStack && (
                        <pre
                            className="text-[9px] text-red-200/60 font-mono overflow-x-auto whitespace-pre-wrap bg-red-950/20 p-2 rounded border border-red-900/20 mt-1"
                        >
                            {exception.stackTrace}
                        </pre>
                    )}
                </div>
            )}

            {exception.innerException && (
                <div className="ml-3 pl-2 border-l-2 border-red-800/30">
                    <h5 className="text-[9px] text-red-400/60 mb-1">Inner Exception</h5>
                    <ExceptionDisplay exception={exception.innerException} />
                </div>
            )}
        </div>
    );
};

// Single timeline event - styled like LogEntryRow
const TimelineEvent = ({ entry, isLast }: { entry: LogEntry; isLast: boolean }) => {
    const [expanded, setExpanded] = useState(false);
    const colors = getSourceColor(entry);
    const timestamp = new Date(entry.timestamp);
    const timeStr = timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Level badge color (matching LogEntryRow)
    const getLevelBadgeColor = (level: string) => {
        switch (level.toUpperCase()) {
            case 'ERR':
            case 'ERROR':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'FATAL':
            case 'FTL':
                return 'bg-red-600/20 text-red-400 border-red-600/30';
            case 'WRN':
            case 'WARN':
            case 'WARNING':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'DBG':
            case 'DEBUG':
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            default:
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    // Left bar color
    const getBarColor = (level: string) => {
        switch (level.toUpperCase()) {
            case 'ERR':
            case 'ERROR':
                return 'bg-red-500';
            case 'FATAL':
            case 'FTL':
                return 'bg-red-600';
            case 'WRN':
            case 'WARN':
            case 'WARNING':
                return 'bg-yellow-500';
            case 'DBG':
            case 'DEBUG':
                return 'bg-gray-500';
            default:
                return 'bg-blue-500';
        }
    };

    return (
        <div className="flex w-full mb-4">
            {/* Timeline column - fixed width */}
            <div className="shrink-0 w-8 relative">
                {/* Timeline line with subtle glow */}
                {!isLast && (
                    <div className="absolute left-[15px] top-6 bottom-0 w-0.5 bg-gray-600 shadow-[0_0_8px_rgba(100,116,139,0.4)]" />
                )}
                {/* Timeline dot */}
                <div
                    className={cn(
                        "absolute left-1.5 top-1.5 w-4 h-4 rounded-full border-2 border-gray-900 z-10",
                        colors.dot
                    )}
                />
            </div>

            {/* Event card - matching LogEntryRow styling */}
            <div
                className="group flex-1 min-w-0 relative rounded-xl border border-gray-700 bg-gray-900/40 hover:bg-gray-900/60 overflow-hidden font-mono text-sm cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                }}
            >
                {/* Left color bar - like LogEntryRow */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1", getBarColor(entry.level))} />

                {/* Header */}
                <div className="flex items-center gap-3 p-3 pl-4 flex-wrap">
                    <div className={`text-gray-500 group-hover:text-white ${expanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} />
                    </div>

                    <span className="text-gray-500 text-xs tabular-nums">
                        {timeStr}
                    </span>

                    {/* Level badge - pill style like LogEntryRow (px-3) */}
                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", getLevelBadgeColor(entry.level))}>
                        {entry.level}
                    </span>

                    {/* Source type badge */}
                    <span className={cn("text-xs px-2 py-0.5 rounded", colors.bg, colors.text)}>
                        {colors.label}
                    </span>


                </div>

                {/* Message preview */}
                <div className="px-4 pb-3 pl-4">
                    <p className={cn(
                        "text-sm text-gray-300 break-all",
                        !expanded && "truncate"
                    )}>
                        {entry.message}
                    </p>
                </div>

                {/* Expanded details - matching LogEntryRow styling */}
                {expanded && (
                    <div className="bg-gray-900 border-t border-gray-700 rounded-b-xl">
                        <div className="p-4 pl-8 space-y-4 text-xs overflow-auto max-h-[400px]">

                            {/* Properties grid - Seq-like layout */}
                            <div className="grid grid-cols-2 gap-3">
                                {entry.serviceName && (
                                    <div className="flex flex-col bg-gray-900/50 p-2 rounded border border-gray-800/50">
                                        <span className="text-gray-500 mb-0.5 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                            <Server size={10} /> Service
                                        </span>
                                        <span className="text-purple-400">{entry.serviceName}</span>
                                    </div>
                                )}
                                {entry.sourceContext && entry.sourceContext !== 'Unknown' && (
                                    <div className="flex flex-col bg-gray-900/50 p-2 rounded border border-gray-800/50">
                                        <span className="text-gray-500 mb-0.5 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                            <Globe size={10} /> Source
                                        </span>
                                        <span className="text-amber-400 truncate" title={entry.sourceContext}>
                                            {entry.sourceContext.split('.').pop()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Exception */}
                            {entry.exception && (
                                <div>
                                    <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                                        <AlertCircle size={12} /> Exception
                                    </h4>
                                    <div className="p-3 rounded bg-red-900/30 border-l-4 border-red-500">
                                        <ExceptionDisplay exception={entry.exception!} />
                                    </div>
                                </div>
                            )}

                            {/* Additional properties */}
                            {Object.keys(entry.properties || {}).length > 0 && (
                                <div>
                                    <h4 className="text-[10px] text-gray-500 uppercase mb-1">Properties</h4>
                                    <div className="text-[10px] font-mono bg-black/40 p-2 rounded border border-gray-800 max-h-32 overflow-auto">
                                        {Object.entries(entry.properties).map(([key, value]) => (
                                            <div key={key} className="flex gap-2 min-w-0">
                                                <span className="text-blue-400 shrink-0">{key}:</span>
                                                <span className="text-gray-400 truncate">
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Raw log */}
                            {entry.raw && (
                                <div>
                                    <h4 className="text-gray-500 font-semibold mb-1">Raw Log Line</h4>
                                    <div className="text-[10px] text-gray-400 font-mono bg-black/40 p-2 rounded border border-gray-800 break-all whitespace-pre-wrap max-h-24 overflow-auto">
                                        {entry.raw}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const CorrelationTimeline: React.FC<CorrelationTimelineProps> = ({ logs, correlationId }) => {
    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Database size={48} className="mb-4 opacity-30" />
                <p>No correlated logs found</p>
                <p className="text-xs mt-1">Correlation ID: {correlationId}</p>
            </div>
        );
    }

    // Calculate duration
    const firstTimestamp = new Date(logs[0].timestamp);
    const lastTimestamp = new Date(logs[logs.length - 1].timestamp);
    const durationMs = lastTimestamp.getTime() - firstTimestamp.getTime();
    const durationStr = durationMs < 1000
        ? `${durationMs}ms`
        : durationMs < 60000
            ? `${(durationMs / 1000).toFixed(2)}s`
            : `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;

    return (
        <div className="h-full flex flex-col overflow-hidden min-h-0">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-md border-b border-gray-700 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <Hash className="w-5 h-5 text-cyan-400" />
                        <span className="text-cyan-400 font-mono font-bold">{correlationId}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{logs.length} events</span>
                        <span>Duration: {durationStr}</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 text-[10px]">
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-gray-400">API1</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-gray-400">API2</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span className="text-gray-400">Database</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-gray-400">Error</span>
                    </div>
                </div>
            </div>

            {/* Scrollable Timeline */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0">
                {logs.map((log, index) => (
                    <TimelineEvent
                        key={`${log.timestamp}-${index}`}
                        entry={log}
                        isLast={index === logs.length - 1}
                    />
                ))}
            </div>
        </div>
    );
};
