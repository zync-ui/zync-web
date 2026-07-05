import React, { useState, memo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { LogEntry, ExceptionInfo } from '../../services/logService';
import { ChevronDown, Server, Database, Globe, AlertCircle, Hash, Link2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CorrelationTimelineProps {
    logs: LogEntry[];
    correlationId: string;
}

export type SourceKind = 'API1' | 'API2' | 'Database' | 'Error';

export interface SourceStyle {
    bg: string;
    border: string;
    text: string;
    dot: string;
    label: SourceKind;
}

/** Classify log entry into API1 → API2 → Database flow (errors override). */
export const getSourceStyle = (entry: LogEntry): SourceStyle => {
    const level = entry.level.toUpperCase();
    const service = entry.serviceName?.toLowerCase() || '';
    const message = entry.message?.toLowerCase() || '';
    const sourceContext = entry.sourceContext?.toLowerCase() || '';
    const application = (entry.application || '').toLowerCase();
    const requestPath = (entry.requestPath || '').toLowerCase();

    if (level === 'ERROR' || level === 'ERR' || level === 'FATAL' || level === 'FTL') {
        return {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            text: 'text-red-400',
            dot: 'bg-red-500',
            label: 'Error',
        };
    }

    if (
        service.includes('db') || service.includes('database') ||
        application.includes('db') || application.includes('database') ||
        message.includes('sql') || message.includes('query') ||
        message.includes('select ') || message.includes('insert ') ||
        message.includes('update ') || message.includes('delete ') ||
        message.includes('executed dbcommand') ||
        sourceContext.includes('entityframework') ||
        sourceContext.includes('repository') ||
        sourceContext.includes('dbcontext') ||
        sourceContext.includes('sqlconnection')
    ) {
        return {
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/30',
            text: 'text-purple-400',
            dot: 'bg-purple-500',
            label: 'Database',
        };
    }

    if (
        service.includes('api2') || service.includes('downstream') ||
        service.includes('gateway') || service.includes('proxy') ||
        application.includes('api2') ||
        message.includes('calling external') || message.includes('downstream') ||
        message.includes('httpclient') || message.includes('forwarding request') ||
        sourceContext.includes('httpclient') ||
        sourceContext.includes('refit') ||
        requestPath.includes('/api2')
    ) {
        return {
            bg: 'bg-green-500/10',
            border: 'border-green-500/30',
            text: 'text-green-400',
            dot: 'bg-green-500',
            label: 'API2',
        };
    }

    return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        dot: 'bg-blue-500',
        label: 'API1',
    };
};

const ExceptionDisplay = ({ exception }: { exception: ExceptionInfo }) => {
    const [showStack, setShowStack] = useState(false);

    return (
        <div className="space-y-2 mt-2">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-red-400 font-semibold text-xs">{exception.type}</span>
                <span className="text-red-200/70">:</span>
                <span className="text-red-200 text-xs break-all">{exception.message}</span>
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
                        <ChevronDown size={10} className={showStack ? 'rotate-180' : ''} />
                        {showStack ? 'Hide' : 'Show'} Stack Trace
                    </button>
                    {showStack && (
                        <pre className="text-[10px] text-red-200/70 font-mono overflow-x-auto whitespace-pre-wrap bg-red-950/30 p-3 rounded-lg border border-red-900/30 mt-2 max-h-48 theme-scrollbar">
                            {exception.stackTrace}
                        </pre>
                    )}
                </div>
            )}

            {exception.innerException && (
                <div className="ml-3 pl-3 border-l-2 border-red-800/40">
                    <h5 className="text-[10px] text-red-400/70 mb-1">Inner Exception</h5>
                    <ExceptionDisplay exception={exception.innerException} />
                </div>
            )}
        </div>
    );
};

const getLevelBadgeColor = (level: string) => {
    switch (level.toUpperCase()) {
        case 'ERR':
        case 'ERROR':
            return 'bg-red-500/15 text-red-400 border-red-500/30';
        case 'FATAL':
        case 'FTL':
            return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
        case 'WRN':
        case 'WARN':
        case 'WARNING':
            return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        case 'DBG':
        case 'DEBUG':
            return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
        default:
            return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
};

const getBarColor = (level: string) => {
    switch (level.toUpperCase()) {
        case 'ERR':
        case 'ERROR':
            return 'bg-gradient-to-b from-red-400 to-red-600';
        case 'FATAL':
        case 'FTL':
            return 'bg-gradient-to-b from-orange-400 to-orange-600';
        case 'WRN':
        case 'WARN':
        case 'WARNING':
            return 'bg-gradient-to-b from-amber-400 to-amber-600';
        case 'DBG':
        case 'DEBUG':
            return 'bg-gradient-to-b from-purple-400 to-purple-600';
        default:
            return 'bg-gradient-to-b from-blue-400 to-blue-600';
    }
};

const TimelineEvent = memo(({ entry, isLast, step }: { entry: LogEntry; isLast: boolean; step: number }) => {
    const [expanded, setExpanded] = useState(false);
    const colors = getSourceStyle(entry);
    const timestamp = new Date(entry.timestamp);
    const timeStr = timestamp.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
    } as Intl.DateTimeFormatOptions);

    return (
        <div className="flex w-full pb-6 px-4">
            {/* Timeline rail — vertical line centered through dot */}
            <div className="relative flex flex-col items-center w-6 shrink-0 mr-3 self-stretch">
                {!isLast && (
                    <div
                        className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gray-600"
                        style={{ top: '1.125rem', bottom: '-0.5rem' }}
                        aria-hidden
                    />
                )}
                <span className="text-[9px] text-gray-500 font-sans leading-none mb-1 shrink-0 select-none relative z-10">
                    {step}
                </span>
                <div
                    className={cn(
                        'w-3.5 h-3.5 rounded-full shrink-0 relative z-10',
                        'ring-[2.5px] ring-brand-bg',
                        colors.dot
                    )}
                />
            </div>

            <div
                className="group flex-1 min-w-0 relative rounded-xl border border-gray-700/80 bg-gray-900/50 hover:bg-gray-900/70 overflow-hidden cursor-pointer transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className={cn('absolute left-0 top-0 bottom-0 w-1', getBarColor(entry.level))} />

                <div className="flex items-center gap-2 p-3 pl-4 flex-wrap">
                    <ChevronDown
                        size={14}
                        className={cn('text-gray-500 transition-transform flex-shrink-0', expanded && 'rotate-180')}
                    />
                    <span className="text-gray-500 text-xs font-sans">{timeStr}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border', getLevelBadgeColor(entry.level))}>
                        {entry.level}
                    </span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded border font-semibold', colors.bg, colors.text, colors.border)}>
                        {colors.label}
                    </span>
                    {entry.durationMs != null && (
                        <span className="text-[10px] text-gray-500 font-sans ml-auto">{entry.durationMs}ms</span>
                    )}
                </div>

                <div className="px-4 pb-3 pl-4">
                    <p className={cn('text-sm text-gray-200 font-mono leading-relaxed break-words', !expanded && 'line-clamp-2')}>
                        {entry.message}
                    </p>
                </div>

                {expanded && (
                    <div className="border-t border-gray-800 bg-gray-950/60 p-4 pl-5 space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {entry.serviceName && (
                                <div className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-800">
                                    <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1 mb-1">
                                        <Server size={10} /> Service
                                    </span>
                                    <span className="text-purple-300 font-mono text-xs break-all">{entry.serviceName}</span>
                                </div>
                            )}
                            {entry.sourceContext && entry.sourceContext !== 'Unknown' && (
                                <div className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-800">
                                    <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1 mb-1">
                                        <Globe size={10} /> Source
                                    </span>
                                    <span className="text-amber-300 font-mono text-xs break-all">{entry.sourceContext}</span>
                                </div>
                            )}
                            {entry.requestMethod && entry.requestPath && (
                                <div className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-800 sm:col-span-2">
                                    <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1 mb-1">
                                        <Link2 size={10} /> Request
                                    </span>
                                    <span className="text-cyan-300 font-mono text-xs break-all">
                                        {entry.requestMethod} {entry.requestPath}
                                        {entry.statusCode != null && ` → ${entry.statusCode}`}
                                    </span>
                                </div>
                            )}
                            {entry.correlationId && (
                                <div className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-800 sm:col-span-2">
                                    <span className="text-[10px] text-gray-500 uppercase mb-1 block">Correlation ID</span>
                                    <span className="text-cyan-400 font-mono text-xs break-all">{entry.correlationId}</span>
                                </div>
                            )}
                        </div>

                        {entry.exception && (
                            <div>
                                <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2 text-xs">
                                    <AlertCircle size={12} /> Exception
                                </h4>
                                <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/40">
                                    <ExceptionDisplay exception={entry.exception} />
                                </div>
                            </div>
                        )}

                        {Object.keys(entry.properties || {}).length > 0 && (
                            <div>
                                <h4 className="text-[10px] text-gray-500 uppercase mb-2">Properties</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(entry.properties).slice(0, 20).map(([key, value]) => (
                                        <span
                                            key={key}
                                            className="text-[10px] px-2 py-1 rounded-md bg-gray-900 border border-gray-800 text-gray-400 font-mono"
                                            title={`${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`}
                                        >
                                            <span className="text-blue-400">{key}</span>
                                            <span className="text-gray-600 mx-1">=</span>
                                            <span className="text-gray-300">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {entry.raw && (
                            <div>
                                <h4 className="text-[10px] text-gray-500 uppercase mb-1">Raw</h4>
                                <pre className="text-[10px] text-gray-400 font-mono bg-black/40 p-2 rounded-lg border border-gray-800 break-all whitespace-pre-wrap max-h-32 overflow-auto theme-scrollbar">
                                    {entry.raw}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

TimelineEvent.displayName = 'TimelineEvent';

export const CorrelationTimeline: React.FC<CorrelationTimelineProps> = ({ logs, correlationId }) => {
    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 font-sans">
                <Database size={48} className="mb-4 opacity-30" />
                <p>No correlated logs found</p>
                <p className="text-xs mt-1 font-mono">{correlationId}</p>
            </div>
        );
    }

    const firstTimestamp = new Date(logs[0].timestamp);
    const lastTimestamp = new Date(logs[logs.length - 1].timestamp);
    const durationMs = lastTimestamp.getTime() - firstTimestamp.getTime();
    const durationStr = durationMs < 1000
        ? `${durationMs}ms`
        : durationMs < 60000
            ? `${(durationMs / 1000).toFixed(2)}s`
            : `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;

    const flowSummary = logs.reduce(
        (acc, log) => {
            const kind = getSourceStyle(log).label;
            acc[kind] = (acc[kind] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    return (
        <div className="h-full flex flex-col overflow-hidden min-h-0">
            <div className="flex-shrink-0 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Hash className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span className="text-cyan-300 font-mono text-xs break-all">{correlationId}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-sans">
                        <span>{logs.length} events</span>
                        <span>{durationStr}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap text-[10px] font-sans">
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-gray-400">API1{flowSummary.API1 ? ` (${flowSummary.API1})` : ''}</span>
                    </div>
                    <span className="text-gray-600">→</span>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-gray-400">API2{flowSummary.API2 ? ` (${flowSummary.API2})` : ''}</span>
                    </div>
                    <span className="text-gray-600">→</span>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span className="text-gray-400">Database{flowSummary.Database ? ` (${flowSummary.Database})` : ''}</span>
                    </div>
                    {flowSummary.Error ? (
                        <>
                            <span className="text-gray-600">|</span>
                            <div className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                <span className="text-gray-400">Error ({flowSummary.Error})</span>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>

            <Virtuoso
                style={{ height: '100%', flex: 1 }}
                data={logs}
                itemContent={(index, log) => (
                    <TimelineEvent
                        entry={log}
                        isLast={index === logs.length - 1}
                        step={index + 1}
                    />
                )}
            />
        </div>
    );
};
