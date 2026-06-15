import React, { useState, useMemo, useCallback, memo } from 'react';
import { LogEntry, ExceptionInfo } from '../../services/logService';
import { ChevronDown, ChevronRight, AlertCircle, Clock, Globe, Activity, Copy, Check, Code2, Link2, Unlink2, FileText, Layers, Zap, Database, Cpu, Server } from 'lucide-react';
import { cn } from '../../lib/utils';

// ============================================
// TYPES & INTERFACES
// ============================================

interface LogEntryRowProps {
    entry: LogEntry;
    onCorrelationClick?: (correlationId: string) => void;
}

// Log levels supported by the component
// INF/INFO, WRN/WARN/WARNING, ERR/ERROR, FTL/FATAL, DBG/DEBUG, VRB/VERBOSE

// ============================================
// STYLING HELPERS - GLASS-MORPHISM THEME
// ============================================

const LEVEL_STYLES: Record<string, {
    bar: string;
    badge: string;
    border: string;
    displayName: string;
}> = {
    // Information - Blue glass
    INF: {
        bar: 'bg-gradient-to-b from-blue-400 to-blue-600',
        badge: 'bg-blue-500/20 backdrop-blur-md text-blue-300 border-blue-400/30 shadow-[0_4px_20px_rgba(59,130,246,0.25)]',
        border: 'border-gray-700/50 hover:border-blue-500/40',
        displayName: 'Information',
    },
    INFO: {
        bar: 'bg-gradient-to-b from-blue-400 to-blue-600',
        badge: 'bg-blue-500/20 backdrop-blur-md text-blue-300 border-blue-400/30 shadow-[0_4px_20px_rgba(59,130,246,0.25)]',
        border: 'border-gray-700/50 hover:border-blue-500/40',
        displayName: 'Information',
    },
    INFORMATION: {
        bar: 'bg-gradient-to-b from-blue-400 to-blue-600',
        badge: 'bg-blue-500/20 backdrop-blur-md text-blue-300 border-blue-400/30 shadow-[0_4px_20px_rgba(59,130,246,0.25)]',
        border: 'border-gray-700/50 hover:border-blue-500/40',
        displayName: 'Information',
    },
    // Warning - Amber glass
    WRN: {
        bar: 'bg-gradient-to-b from-amber-400 to-amber-600',
        badge: 'bg-amber-500/20 backdrop-blur-md text-amber-300 border-amber-400/30 shadow-[0_4px_20px_rgba(245,158,11,0.25)]',
        border: 'border-gray-700/50 hover:border-amber-500/40',
        displayName: 'Warning',
    },
    WARN: {
        bar: 'bg-gradient-to-b from-amber-400 to-amber-600',
        badge: 'bg-amber-500/20 backdrop-blur-md text-amber-300 border-amber-400/30 shadow-[0_4px_20px_rgba(245,158,11,0.25)]',
        border: 'border-gray-700/50 hover:border-amber-500/40',
        displayName: 'Warning',
    },
    WARNING: {
        bar: 'bg-gradient-to-b from-amber-400 to-amber-600',
        badge: 'bg-amber-500/20 backdrop-blur-md text-amber-300 border-amber-400/30 shadow-[0_4px_20px_rgba(245,158,11,0.25)]',
        border: 'border-gray-700/50 hover:border-amber-500/40',
        displayName: 'Warning',
    },
    // Error - Red glass
    ERR: {
        bar: 'bg-gradient-to-b from-red-400 to-red-600',
        badge: 'bg-red-500/20 backdrop-blur-md text-red-300 border-red-400/30 shadow-[0_4px_20px_rgba(239,68,68,0.25)]',
        border: 'border-gray-700/50 hover:border-red-500/50',
        displayName: 'Error',
    },
    ERROR: {
        bar: 'bg-gradient-to-b from-red-400 to-red-600',
        badge: 'bg-red-500/20 backdrop-blur-md text-red-300 border-red-400/30 shadow-[0_4px_20px_rgba(239,68,68,0.25)]',
        border: 'border-gray-700/50 hover:border-red-500/50',
        displayName: 'Error',
    },
    // Fatal - Orange glass
    FTL: {
        bar: 'bg-gradient-to-b from-orange-400 to-orange-600',
        badge: 'bg-orange-500/20 backdrop-blur-md text-orange-300 border-orange-400/30 shadow-[0_4px_20px_rgba(249,115,22,0.25)]',
        border: 'border-gray-700/50 hover:border-orange-500/50',
        displayName: 'Fatal',
    },
    FATAL: {
        bar: 'bg-gradient-to-b from-orange-400 to-orange-600',
        badge: 'bg-orange-500/20 backdrop-blur-md text-orange-300 border-orange-400/30 shadow-[0_4px_20px_rgba(249,115,22,0.25)]',
        border: 'border-gray-700/50 hover:border-orange-500/50',
        displayName: 'Fatal',
    },
    // Debug - Purple glass
    DBG: {
        bar: 'bg-gradient-to-b from-purple-400 to-purple-600',
        badge: 'bg-purple-500/20 backdrop-blur-md text-purple-300 border-purple-400/30 shadow-[0_4px_20px_rgba(168,85,247,0.25)]',
        border: 'border-gray-700/50 hover:border-purple-500/40',
        displayName: 'Debug',
    },
    DEBUG: {
        bar: 'bg-gradient-to-b from-purple-400 to-purple-600',
        badge: 'bg-purple-500/20 backdrop-blur-md text-purple-300 border-purple-400/30 shadow-[0_4px_20px_rgba(168,85,247,0.25)]',
        border: 'border-gray-700/50 hover:border-purple-500/40',
        displayName: 'Debug',
    },
    // Verbose - Gray glass
    VRB: {
        bar: 'bg-gradient-to-b from-gray-400 to-gray-600',
        badge: 'bg-gray-500/20 backdrop-blur-md text-gray-300 border-gray-400/30 shadow-[0_4px_20px_rgba(107,114,128,0.2)]',
        border: 'border-gray-700/50 hover:border-gray-500/40',
        displayName: 'Verbose',
    },
    VERBOSE: {
        bar: 'bg-gradient-to-b from-gray-400 to-gray-600',
        badge: 'bg-gray-500/20 backdrop-blur-md text-gray-300 border-gray-400/30 shadow-[0_4px_20px_rgba(107,114,128,0.2)]',
        border: 'border-gray-700/50 hover:border-gray-500/40',
        displayName: 'Verbose',
    },
};

const DEFAULT_STYLE = {
    bar: 'bg-gradient-to-b from-gray-400 to-gray-600',
    badge: 'bg-gray-500/20 backdrop-blur-md text-gray-300 border-gray-400/30 shadow-[0_4px_20px_rgba(107,114,128,0.2)]',
    border: 'border-gray-700/50 hover:border-gray-500/40',
    displayName: 'Unknown',
};

const getLevelStyle = (level: string) => {
    const normalized = level?.toUpperCase() || '';
    return LEVEL_STYLES[normalized] || DEFAULT_STYLE;
};

// ============================================
// KEYWORD HIGHLIGHTING
// ============================================

const HIGHLIGHT_KEYWORDS = [
    'controller', 'executed', 'error', 'failed', 'exception',
    'get', 'post', 'put', 'delete', 'patch',
    'sql', 'query', 'timeout', 'success', 'completed',
    'request', 'response', 'status', 'http', 'api',
];

const highlightMessage = (message: string): React.ReactNode => {
    if (!message) return null;

    // Build regex from keywords
    const regex = new RegExp(`\\b(${HIGHLIGHT_KEYWORDS.join('|')})\\b`, 'gi');
    const parts = message.split(regex);

    return parts.map((part, i) => {
        const isKeyword = HIGHLIGHT_KEYWORDS.some(
            kw => kw.toLowerCase() === part.toLowerCase()
        );
        if (isKeyword) {
            return (
                <span
                    key={i}
                    className="text-cyan-400 font-semibold"
                >
                    {part}
                </span>
            );
        }
        return <span key={i}>{part}</span>;
    });
};

// ============================================
// JSON TREE COMPONENT
// ============================================

interface JsonTreeProps {
    data: unknown;
    level?: number;
    isLast?: boolean;
}

const JsonTree: React.FC<JsonTreeProps> = memo(({ data, level = 0, isLast = true }) => {
    const [collapsed, setCollapsed] = useState(level > 1);

    const indent = level * 16;

    if (data === null) {
        return <span className="text-gray-500">null</span>;
    }

    if (data === undefined) {
        return <span className="text-gray-500">undefined</span>;
    }

    if (typeof data === 'boolean') {
        return <span className="text-purple-400">{data.toString()}</span>;
    }

    if (typeof data === 'number') {
        return <span className="text-amber-400">{data}</span>;
    }

    if (typeof data === 'string') {
        // Check if it's a parseable JSON string
        if (data.startsWith('{') || data.startsWith('[')) {
            try {
                const parsed = JSON.parse(data);
                return <JsonTree data={parsed} level={level} isLast={isLast} />;
            } catch {
                // Not valid JSON, display as string
            }
        }
        return <span className="text-green-400">"{data}"</span>;
    }

    if (Array.isArray(data)) {
        if (data.length === 0) {
            return <span className="text-gray-500">[]</span>;
        }

        return (
            <div style={{ marginLeft: level > 0 ? indent : 0 }}>
                <span
                    className="cursor-pointer text-gray-400 hover:text-white inline-flex items-center gap-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        setCollapsed(!collapsed);
                    }}
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    <span className="text-gray-500">[{data.length}]</span>
                </span>
                {!collapsed && (
                    <div className="ml-4 border-l border-gray-700 pl-2">
                        {data.map((item, index) => (
                            <div key={index} className="py-0.5">
                                <span className="text-gray-500 mr-2">{index}:</span>
                                <JsonTree data={item} level={level + 1} isLast={index === data.length - 1} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (typeof data === 'object') {
        const entries = Object.entries(data);
        if (entries.length === 0) {
            return <span className="text-gray-500">{'{}'}</span>;
        }

        return (
            <div style={{ marginLeft: level > 0 ? indent : 0 }}>
                <span
                    className="cursor-pointer text-gray-400 hover:text-white inline-flex items-center gap-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        setCollapsed(!collapsed);
                    }}
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    <span className="text-gray-500">{`{${entries.length}}`}</span>
                </span>
                {!collapsed && (
                    <div className="ml-4 border-l border-gray-700 pl-2">
                        {entries.map(([key, value], index) => (
                            <div key={key} className="py-0.5 flex items-start gap-1">
                                <span className="text-blue-400 shrink-0">{key}:</span>
                                <JsonTree data={value} level={level + 1} isLast={index === entries.length - 1} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return <span className="text-gray-400">{String(data)}</span>;
});

JsonTree.displayName = 'JsonTree';

// ============================================
// EXCEPTION VIEWER COMPONENT
// ============================================

interface ExceptionViewerProps {
    exception: ExceptionInfo;
}

const ExceptionViewer: React.FC<ExceptionViewerProps> = memo(({ exception }) => {
    const [showStack, setShowStack] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyStackTrace = useCallback(async () => {
        if (exception.stackTrace) {
            await navigator.clipboard.writeText(exception.stackTrace);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [exception.stackTrace]);

    return (
        <div className="space-y-2">
            {/* Exception Type & Message */}
            <div className="flex flex-wrap items-start gap-2">
                <span className="text-red-400 font-bold text-xs bg-red-500/10 px-2 py-0.5 rounded">
                    {exception.type}
                </span>
                <span className="text-red-200 text-xs break-all">{exception.message}</span>
            </div>

            {/* Stack Trace Toggle */}
            {exception.stackTrace && (
                <div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowStack(!showStack);
                        }}
                        className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                    >
                        <ChevronDown
                            size={10}
                            className={cn("transition-transform", showStack && "rotate-180")}
                        />
                        {showStack ? 'Hide' : 'Show'} Stack Trace
                    </button>

                    {showStack && (
                        <div className="relative mt-2">
                            {/* Copy button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyStackTrace();
                                }}
                                className="absolute top-2 right-2 p-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                                title="Copy stack trace"
                            >
                                {copied ? (
                                    <Check size={12} className="text-green-400" />
                                ) : (
                                    <Copy size={12} className="text-gray-400" />
                                )}
                            </button>
                            <pre className="text-[10px] text-red-200/70 font-mono overflow-x-auto whitespace-pre-wrap bg-red-950/30 p-3 pr-10 rounded-lg border border-red-900/30 max-h-48 overflow-y-auto">
                                {exception.stackTrace}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* Inner Exception */}
            {exception.innerException && (
                <div className="ml-3 pl-3 border-l-2 border-red-800/40">
                    <h5 className="text-[9px] text-red-400/60 mb-1 uppercase tracking-wider">Inner Exception</h5>
                    <ExceptionViewer exception={exception.innerException} />
                </div>
            )}
        </div>
    );
});

ExceptionViewer.displayName = 'ExceptionViewer';

// ============================================
// PROPERTIES SECTION
// ============================================

interface PropertiesSectionProps {
    properties: Record<string, unknown>;
}

const PropertiesSection: React.FC<PropertiesSectionProps> = memo(({ properties }) => {
    const [expanded, setExpanded] = useState(false);

    const entries = Object.entries(properties);
    if (entries.length === 0) return null;

    // Filter out standard properties that are displayed elsewhere
    const filteredEntries = entries.filter(([key]) =>
        !['SourceContext', 'CorrelationId', 'TraceId', 'ThreadId', 'Application', 'Environment'].includes(key)
    );

    if (filteredEntries.length === 0) return null;

    return (
        <div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                }}
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-wider mb-2"
            >
                <ChevronDown
                    size={10}
                    className={cn("transition-transform", expanded && "rotate-180")}
                />
                Properties ({filteredEntries.length})
            </button>

            {expanded && (
                <div className="bg-gray-950/50 rounded-lg border border-gray-800/50 p-3 font-mono text-[11px] max-h-48 overflow-auto">
                    <JsonTree data={Object.fromEntries(filteredEntries)} />
                </div>
            )}
        </div>
    );
});

PropertiesSection.displayName = 'PropertiesSection';

// ============================================
// MAIN LOG ENTRY ROW COMPONENT
// ============================================

export const LogEntryRow: React.FC<LogEntryRowProps> = memo(({ entry, onCorrelationClick }) => {
    const [expanded, setExpanded] = useState(false);

    const levelStyle = useMemo(() => getLevelStyle(entry.level), [entry.level]);

    // Format timestamp
    const formattedTime = useMemo(() => {
        try {
            const date = new Date(entry.timestamp);
            const time = date.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
            // Add milliseconds manually
            const ms = date.getMilliseconds().toString().padStart(3, '0');
            return `${time}.${ms}`;
        } catch {
            return entry.timestamp;
        }
    }, [entry.timestamp]);

    const formattedDate = useMemo(() => {
        try {
            const date = new Date(entry.timestamp);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            });
        } catch {
            return '';
        }
    }, [entry.timestamp]);

    // Simplified source context (last segment only)
    const simplifiedSource = useMemo(() => {
        if (!entry.sourceContext || entry.sourceContext === 'Unknown') return null;
        const parts = entry.sourceContext.split('.');
        return parts[parts.length - 1];
    }, [entry.sourceContext]);

    // Check for correlation/trace IDs
    const correlationId = entry.correlationId || (entry.properties?.CorrelationId as string);
    const traceId = entry.properties?.TraceId as string;
    const threadId = entry.properties?.ThreadId as string;

    const handleRowClick = useCallback(() => {
        setExpanded(prev => !prev);
    }, []);

    const handleCorrelationClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (correlationId && onCorrelationClick) {
            onCorrelationClick(correlationId);
        }
    }, [correlationId, onCorrelationClick]);

    return (
        <div
            className={cn(
                // Base card styles - clean modern effect
                "group relative rounded-xl overflow-hidden",
                "bg-gray-900/40",
                "border transition-all duration-300 ease-out",
                // Border based on level
                levelStyle.border,
                "cursor-pointer",
                // Animation for new entries
                "animate-in fade-in-0 slide-in-from-left-2 duration-300"
            )}
            onClick={handleRowClick}
        >
            {/* Left vertical color bar */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
                levelStyle.bar
            )} />

            {/* Main content wrapper */}
            <div className="pl-4">
                {/* HEADER SECTION */}
                <div className="flex items-center gap-2.5 py-2 px-3 flex-wrap">
                    {/* Expand/Collapse indicator */}
                    <div className={cn(
                        "text-gray-500 group-hover:text-white transition-all duration-200",
                        expanded && "rotate-90"
                    )}>
                        <ChevronRight size={16} />
                    </div>

                    {/* Timestamp - wow style display */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                            <Clock size={16} className="text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 font-bold text-sm tabular-nums leading-tight drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                                {formattedTime}
                            </span>
                            <span className="text-gray-400 text-[11px] font-medium leading-tight">
                                {formattedDate}
                            </span>
                        </div>
                    </div>

                    {/* Level badge - glass-morphism pill style */}
                    <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold border cursor-default",
                        levelStyle.badge
                    )}>
                        {levelStyle.displayName}
                    </span>

                    {/* Source context - glassy pill with code icon */}
                    {simplifiedSource && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/15 backdrop-blur-md border border-slate-400/20 shadow-[0_4px_20px_rgba(148,163,184,0.15)]">
                            <Code2 size={12} className="text-slate-300" />
                            <span className="text-slate-200 text-xs font-medium truncate max-w-[150px]" title={entry.sourceContext}>
                                {simplifiedSource}
                            </span>
                        </div>
                    )}

                    {/* Correlation ID - glassy pill with link icon */}
                    {correlationId ? (
                        <button
                            id={`correlation-btn-${correlationId}`}
                            data-testid="correlation-id-button"
                            data-correlation-id={correlationId}
                            onClick={handleCorrelationClick}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 backdrop-blur-md border border-emerald-400/25 shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] hover:scale-105 hover:bg-emerald-500/25 transition-all duration-200"
                            title={`Correlation ID: ${correlationId}`}
                        >
                            <Link2 size={12} className="text-emerald-300" />
                            <span className="text-emerald-200 text-xs font-medium truncate max-w-[100px]">
                                {correlationId.substring(0, 8)}...
                            </span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-500/15 backdrop-blur-md border border-gray-400/20 shadow-[0_4px_20px_rgba(107,114,128,0.15)]">
                            <Unlink2 size={12} className="text-gray-400" />
                            <span className="text-gray-300 text-xs font-medium">N/A</span>
                        </div>
                    )}

                    {/* Trace ID badge */}
                    {traceId && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-700/30 border border-gray-600/30">
                            <Activity size={10} className="text-gray-400" />
                            <span className="text-gray-400 text-[10px] font-mono truncate max-w-[60px]">
                                {traceId.substring(0, 8)}...
                            </span>
                        </div>
                    )}

                    {/* Thread ID badge */}
                    {threadId && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-700/20 border border-gray-600/20">
                            <span className="text-gray-500 text-[10px]">TID:</span>
                            <span className="text-gray-400 text-[10px] font-mono">
                                {threadId}
                            </span>
                        </div>
                    )}
                </div>

                {/* MESSAGE PREVIEW */}
                <div className="px-3 pb-2">
                    <p className={cn(
                        "text-sm text-gray-300 font-mono leading-relaxed",
                        !expanded && "line-clamp-1"
                    )}>
                        {highlightMessage(entry.message)}
                    </p>
                </div>

                {/* EXPANDED DETAILS */}
                {/* EXPANDED DETAILS */}
                {expanded && (
                    <div className="mt-4 mx-1 relative rounded-2xl border border-white/10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] bg-[#0B0F17]/90 backdrop-blur-xl animate-in fade-in-0 slide-in-from-top-4 duration-500 ease-out overflow-hidden">
                        {/* Decorative top glow bar */}
                        <div className={cn(
                            "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-60",
                            levelStyle.bar
                        )} />

                        {/* 1. Card Header Section */}
                        <div className="relative p-6 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Large Level Icon */}
                                    <div className={cn(
                                        "p-3 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center",
                                        levelStyle.bar.replace('bg-gradient-to-b', 'bg-gradient-to-br'),
                                        "bg-opacity-20 text-white"
                                    )}>
                                        <Activity size={24} className="drop-shadow-md" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                            Log Entry Details
                                            <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wider">
                                                {entry.serviceName || 'App'}
                                            </span>
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Clock size={14} className="text-cyan-400" />
                                            <span className="text-cyan-100/70 font-mono text-sm">
                                                {formattedTime} <span className="text-gray-600 mx-1">|</span> {formattedDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Metadata Badges Row */}
                            <div className="flex flex-wrap items-center gap-3 mt-5">
                                {/* Level Badge */}
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-transform hover:scale-105 duration-200",
                                    levelStyle.badge
                                )}>
                                    <Activity size={12} />
                                    {levelStyle.displayName}
                                </div>

                                {/* Source Context */}
                                {entry.sourceContext && (
                                    <div className="px-3 py-1 rounded-full text-xs font-medium border border-blue-500/20 bg-blue-500/10 text-blue-200 shadow-sm backdrop-blur-md flex items-center gap-1.5 transition-transform hover:scale-105 duration-200">
                                        <Layers size={12} className="text-blue-400" />
                                        <span className="opacity-70">Source:</span>
                                        <span className="font-semibold text-blue-100">{entry.sourceContext}</span>
                                    </div>
                                )}

                                {/* Correlation ID */}
                                {entry.correlationId ? (
                                    <div className="px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-sm backdrop-blur-md flex items-center gap-1.5 transition-transform hover:scale-105 duration-200 cursor-pointer"
                                        onClick={handleCorrelationClick}
                                        title="Click to filter by Correlation ID">
                                        <Link2 size={12} className="text-emerald-400" />
                                        <span className="opacity-70">Correlation:</span>
                                        <span className="font-mono font-semibold text-emerald-100">{entry.correlationId}</span>
                                    </div>
                                ) : (
                                    <div className="px-3 py-1 rounded-full text-xs text-gray-500 border border-gray-700/30 bg-gray-800/30 flex items-center gap-1.5">
                                        <Unlink2 size={12} />
                                        <span className="italic">No Correlation ID</span>
                                    </div>
                                )}

                                {/* Environment */}
                                {entry.environment && (
                                    <div className="px-3 py-1 rounded-full text-xs font-medium border border-purple-500/20 bg-purple-500/10 text-purple-300 shadow-sm backdrop-blur-md flex items-center gap-1.5">
                                        <Server size={12} className="text-purple-400" />
                                        {entry.environment}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Card Body */}
                        <div className="p-6 space-y-6">

                            {/* Message Section */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                    <FileText size={12} />
                                    Message
                                </h4>
                                <div className="p-5 rounded-xl bg-black/40 border border-white/5 text-gray-200 font-mono text-sm leading-relaxed shadow-inner overflow-x-auto">
                                    {highlightMessage(entry.message)}
                                </div>
                            </div>

                            {/* Exception Section */}
                            {entry.exception && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                                        <AlertCircle size={12} />
                                        Exception Details
                                    </h4>
                                    <div className="rounded-xl overflow-hidden border border-red-500/20 bg-red-950/10 shadow-lg shadow-red-900/10">
                                        <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/10 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-xs font-medium text-red-300">Critical Error</span>
                                        </div>
                                        <div className="p-1">
                                            <ExceptionViewer exception={entry.exception} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {entry.requestPath && (
                                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 hover:bg-white/[0.05] transition-colors">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                                            <Globe size={10} /> Request Path
                                        </span>
                                        <div className="text-blue-300 text-xs font-mono break-all leading-tight">
                                            <span className="font-bold text-blue-200 mr-2">{entry.requestMethod}</span>
                                            {entry.requestPath}
                                        </div>
                                    </div>
                                )}

                                {entry.statusCode && (
                                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 hover:bg-white/[0.05] transition-colors">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                                            <Activity size={10} /> Status Code
                                        </span>
                                        <div className={cn(
                                            "text-lg font-bold",
                                            entry.statusCode >= 200 && entry.statusCode < 300 && "text-green-400",
                                            entry.statusCode >= 300 && entry.statusCode < 400 && "text-yellow-400",
                                            entry.statusCode >= 400 && "text-red-400"
                                        )}>
                                            {entry.statusCode}
                                        </div>
                                    </div>
                                )}

                                {entry.durationMs !== undefined && (
                                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 hover:bg-white/[0.05] transition-colors">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                                            <Zap size={10} /> Duration
                                        </span>
                                        <div className="text-cyan-300 text-sm font-mono font-medium">
                                            {entry.durationMs}ms
                                        </div>
                                    </div>
                                )}

                                {entry.properties && entry.properties['ThreadId'] != null && (
                                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 hover:bg-white/[0.05] transition-colors">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                                            <Cpu size={10} /> Thread ID
                                        </span>
                                        <div className="text-gray-300 text-sm font-mono">
                                            {String(entry.properties['ThreadId'])}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Properties Section */}
                            {entry.properties && Object.keys(entry.properties).length > 0 && (
                                <div className="space-y-3 pt-2 border-t border-white/5">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <Database size={12} />
                                        Log Properties
                                    </h4>
                                    <PropertiesSection properties={entry.properties} />
                                </div>
                            )}

                            {/* Raw Log Toggle */}
                            {entry.raw && (
                                <details className="group pt-2 border-t border-white/5">
                                    <summary className="list-none flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors py-2 selection:bg-none">
                                        <div className="p-1 rounded bg-white/5 group-hover:bg-white/10 transition-colors">
                                            <ChevronRight size={12} className="transform group-open:rotate-90 transition-transform duration-200" />
                                        </div>
                                        <span>View Raw Log Data</span>
                                    </summary>
                                    <div className="mt-2 bg-black/60 rounded-xl p-3 border border-white/5 font-mono text-[10px] text-gray-400 break-all whitespace-pre-wrap max-h-40 overflow-auto shadow-inner text-pretty">
                                        {entry.raw}
                                    </div>
                                </details>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

LogEntryRow.displayName = 'LogEntryRow';

export default LogEntryRow;
