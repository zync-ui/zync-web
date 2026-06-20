import React, { useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Activity, Clock, Globe, Zap, Cpu, Layers, Database, FileText, Code2, AlertCircle, Link2, Server, Unlink2 } from 'lucide-react';
import { LogEntry } from '../../services/logService';
import { cn } from '../../lib/utils';
import { highlightMessage, ExceptionViewer, JsonTree, getLevelStyle } from './LogEntryRow';

interface LogDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: LogEntry;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ isOpen, onClose, entry }) => {
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

    const filteredProperties = useMemo(() => {
        if (!entry.properties) return [];
        const entries = Object.entries(entry.properties);
        return entries.filter(([key]) =>
            !['SourceContext', 'CorrelationId', 'TraceId', 'ThreadId', 'Application', 'Environment'].includes(key)
        );
    }, [entry.properties]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />

            {/* Modal Container */}
            <div 
                className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#0B0F17] rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Top Line */}
                <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", levelStyle.bar)} />

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center bg-opacity-20 text-white",
                            levelStyle.bar.replace('bg-gradient-to-b', 'bg-gradient-to-br')
                        )}>
                            <Activity size={24} className="drop-shadow-md" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                Log Entry Details
                                <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wider">
                                    {entry.serviceName || 'App'}
                                </span>
                            </h2>
                            <div className="flex items-center gap-2 mt-1.5">
                                <Clock size={14} className="text-cyan-400" />
                                <span className="text-cyan-100/70 font-mono text-sm">
                                    {formattedTime} <span className="text-gray-600 mx-1">|</span> {formattedDate}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className={cn("px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5", levelStyle.badge)}>
                            <Activity size={12} />
                            {levelStyle.displayName}
                        </div>

                        {entry.sourceContext && (
                            <div className="px-3 py-1 rounded-full text-xs font-medium border border-blue-500/20 bg-blue-500/10 text-blue-200 flex items-center gap-1.5">
                                <Layers size={12} className="text-blue-400" />
                                <span className="opacity-70">Source:</span>
                                <span className="font-semibold text-blue-100">{entry.sourceContext}</span>
                            </div>
                        )}

                        {entry.correlationId ? (
                            <div className="px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 flex items-center gap-1.5">
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

                        {entry.environment && (
                            <div className="px-3 py-1 rounded-full text-xs font-medium border border-purple-500/20 bg-purple-500/10 text-purple-300 flex items-center gap-1.5">
                                <Server size={12} className="text-purple-400" />
                                {entry.environment}
                            </div>
                        )}
                    </div>

                    {/* Message Section */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <FileText size={12} />
                            Message
                        </h4>
                        <div className="p-5 rounded-xl bg-black/40 border border-white/5 text-gray-200 font-mono text-base leading-relaxed shadow-inner overflow-x-auto whitespace-pre-wrap break-words">
                            {highlightMessage(entry.message || entry.raw || '')}
                        </div>
                    </div>

                    {/* Exception Section */}
                    {entry.exception && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                                <AlertCircle size={12} />
                                Exception Details
                            </h4>
                            <div className="rounded-xl overflow-hidden border border-red-500/20 bg-red-950/10 shadow-lg shadow-red-900/10">
                                <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/10 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs font-medium text-red-300">Critical Error</span>
                                </div>
                                <div className="p-4">
                                    <ExceptionViewer exception={entry.exception} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {entry.requestPath && (
                            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                                    <Globe size={10} /> Request Path
                                </span>
                                <div className="text-blue-300 text-sm font-mono break-all leading-tight">
                                    <span className="font-bold text-blue-200 mr-2">{entry.requestMethod}</span>
                                    {entry.requestPath}
                                </div>
                            </div>
                        )}

                        {entry.statusCode && (
                            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                                    <Activity size={10} /> Status Code
                                </span>
                                <div className={cn(
                                    "text-2xl font-bold",
                                    entry.statusCode >= 200 && entry.statusCode < 300 && "text-green-400",
                                    entry.statusCode >= 300 && entry.statusCode < 400 && "text-yellow-400",
                                    entry.statusCode >= 400 && "text-red-400"
                                )}>
                                    {entry.statusCode}
                                </div>
                            </div>
                        )}

                        {entry.durationMs !== undefined && (
                            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                                    <Zap size={10} /> Duration
                                </span>
                                <div className="text-cyan-300 text-lg font-mono font-medium">
                                    {entry.durationMs}ms
                                </div>
                            </div>
                        )}

                        {entry.properties && entry.properties['ThreadId'] != null && (
                            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                                    <Cpu size={10} /> Thread ID
                                </span>
                                <div className="text-gray-300 text-lg font-mono">
                                    {String(entry.properties['ThreadId'])}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Properties Section */}
                    {filteredProperties.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Database size={12} />
                                Log Properties
                            </h4>
                            <div className="bg-gray-950/50 rounded-lg border border-gray-800/50 p-4 font-mono text-xs overflow-hidden">
                                <JsonTree data={Object.fromEntries(filteredProperties)} />
                            </div>
                        </div>
                    )}

                    {/* Raw Log */}
                    {entry.raw && (
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Code2 size={12} />
                                Raw Log Data
                            </h4>
                            <div className="bg-black/60 rounded-xl p-4 border border-white/5 font-mono text-xs text-gray-400 break-all whitespace-pre-wrap shadow-inner overflow-y-visible">
                                {entry.raw}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
