import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { logService, LogEntry } from '../../services/logService';
import { CorrelationTimeline } from './CorrelationTimeline';

interface CorrelationModalProps {
    correlationId: string | null;
    onClose: () => void;
    /** Already-loaded logs — shown instantly while full correlation fetch runs */
    cachedLogs?: LogEntry[];
}

const sortByTimestamp = (entries: LogEntry[]): LogEntry[] =>
    [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

export const CorrelationModal: React.FC<CorrelationModalProps> = ({
    correlationId,
    onClose,
    cachedLogs = [],
}) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingFull, setFetchingFull] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cachedMatches = useMemo(() => {
        if (!correlationId || !cachedLogs.length) return [];
        return sortByTimestamp(
            cachedLogs.filter((log) => log.correlationId === correlationId)
        );
    }, [correlationId, cachedLogs]);

    useEffect(() => {
        if (!correlationId) {
            setLogs([]);
            return;
        }
        if (cachedMatches.length > 0) {
            setLogs(cachedMatches);
            setLoading(false);
        } else {
            setLoading(true);
        }
    }, [correlationId, cachedMatches]);

    useEffect(() => {
        if (!correlationId) return;

        setError(null);
        setFetchingFull(true);
        let cancelled = false;

        logService.getLogsByCorrelationIdV2(correlationId)
            .then((data) => {
                if (cancelled) return;
                const sorted = sortByTimestamp(data);
                if (sorted.length > 0) {
                    setLogs(sorted);
                }
            })
            .catch((err) => {
                if (cancelled) return;
                if (cachedMatches.length === 0) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch correlated logs');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                    setFetchingFull(false);
                }
            });

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [correlationId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!correlationId) return null;

    return (
        <>
            <div
                onClick={onClose}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-3xl bg-brand-bg border-l border-gray-800 shadow-2xl flex flex-col overflow-hidden">
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80">
                    <h2 className="text-base font-semibold text-gray-100 font-sans">Correlation Timeline</h2>
                    <div className="flex items-center gap-2">
                        {fetchingFull && (
                            <span className="text-[11px] text-cyan-500/80 font-sans">Syncing…</span>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                    {loading && logs.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                                <span className="text-sm font-sans">Loading correlated logs…</span>
                            </div>
                        </div>
                    )}

                    {error && logs.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center p-4">
                                <p className="text-red-400 mb-2 font-sans">⚠️ {error}</p>
                                <button
                                    onClick={() => {
                                        setError(null);
                                        setLoading(true);
                                        logService.getLogsByCorrelationIdV2(correlationId)
                                            .then((data) => setLogs(sortByTimestamp(data)))
                                            .catch((err) => setError(err instanceof Error ? err.message : 'Failed'))
                                            .finally(() => setLoading(false));
                                    }}
                                    className="text-sm text-cyan-400 hover:text-cyan-300 font-sans"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}

                    {(logs.length > 0 || (!loading && !error)) && (
                        <CorrelationTimeline
                            logs={logs}
                            correlationId={correlationId}
                        />
                    )}
                </div>
            </div>
        </>
    );
};
