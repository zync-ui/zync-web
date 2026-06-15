import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { logService, LogEntry } from '../../services/logService';
import { CorrelationTimeline } from '../Correlation/CorrelationTimeline';

interface CorrelationModalProps {
    correlationId: string | null;
    onClose: () => void;
}

export const CorrelationModal: React.FC<CorrelationModalProps> = ({ correlationId, onClose }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCorrelatedLogs = async () => {
            if (!correlationId) return;

            setLoading(true);
            setError(null);

            try {
                const data = await logService.getLogsByCorrelationIdV2(correlationId);
                setLogs(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch correlated logs');
            } finally {
                setLoading(false);
            }
        };

        fetchCorrelatedLogs();
    }, [correlationId]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!correlationId) return null;

    return (
        <>
            {/* Backdrop - NO ANIMATION */}
            <div
                onClick={onClose}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer - NO ANIMATION, instant display */}
            <div
                className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/95">
                    <h2 className="text-lg font-bold text-gray-100">Correlation Timeline</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden min-h-0">
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                                <span>Loading correlated logs...</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center p-4">
                                <p className="text-red-400 mb-2">⚠️ {error}</p>
                                <button
                                    onClick={() => {
                                        setError(null);
                                        setLoading(true);
                                        logService.getLogsByCorrelationIdV2(correlationId)
                                            .then(setLogs)
                                            .catch(err => setError(err.message))
                                            .finally(() => setLoading(false));
                                    }}
                                    className="text-sm text-cyan-400 hover:text-cyan-300"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}

                    {!loading && !error && (
                        <CorrelationTimeline logs={logs} correlationId={correlationId} />
                    )}
                </div>
            </div>
        </>
    );
};
