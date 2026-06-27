import React, { useEffect, useState, useCallback, useRef } from 'react';
import { logService, LogEntry } from '../services/logService';
import { API_BASE_URL, LIVE_POLL_INTERVAL_MS, PAGE_SIZE } from '../config/constants';
import { logSourceService, LogSourceType, LogSource } from '../services/logSourceService';
import { DiscoveredLogFile } from '../services/autoDetectService';
import { backgroundWorker } from '../services/backgroundWorker';
import { streamingService } from '../services/streamingService';
import { AutoDetectSuccessModal } from '../components/AutoDetect/AutoDetectSuccessModal';
import { LogEntryRow } from '../components/LogEntry/LogEntryRow';
import { FilterPanel } from '../components/Filter/FilterPanel';
import { SettingsModal } from '../components/Settings/SettingsModal';
import { CorrelationModal } from '../components/Correlation/CorrelationModal';
import { CustomLoader } from '../components/Loader/CustomLoader';
import { Toast, ToastType } from '../components/Toast';
import { JumpToNextErrorButton, LogStatsPanel } from '../components/LogStatsPanel';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { ChevronDown, Loader2, Search, RotateCw, X, Play, FolderClosed, HardDrive, Server, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import zyncLogo from '../assets/zync-logo.png';
import noLogsFound from '../assets/Not_Found.svg';


export const LogDashboard: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingDates, setLoadingDates] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [level, setLevel] = useState('');

    // Source management
    const [sourceType, setSourceType] = useState<LogSourceType>('local');
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState('');

    // Legacy date range (kept for backward compatibility)
    const [startDate] = useState('');
    const [endDate] = useState('');

    const [isLive, setIsLive] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Correlation modal state
    const [selectedCorrelationId, setSelectedCorrelationId] = useState<string | null>(null);

    // Virtuoso ref for programmatic scrolling
    const virtuosoRef = useRef<VirtuosoHandle>(null);

    // Current scroll index for jump to error
    const [currentErrorIndex, setCurrentErrorIndex] = useState(-1);


    // Toast notification state
    const [toast, setToast] = useState<{ type: ToastType; message: string; title?: string } | null>(null);

    // Minimum time to show loader (in ms)
    // const MIN_LOADER_DURATION = 800;

    // Get current source configuration
    const getCurrentSource = useCallback((): LogSource => {
        return logSourceService.getCurrentSource();
    }, []);

    // Fetch available dates when source changes
    const fetchAvailableDates = useCallback(async (forceType?: LogSourceType) => {
        const source = getCurrentSource();
        const effectiveSource = forceType ? { ...source, type: forceType } : source;

        // Update path based on source type
        if (forceType) {
            effectiveSource.path = forceType === 'local'
                ? localStorage.getItem('logSourceLocalPath') || localStorage.getItem('logSourcePath') || ''
                : localStorage.getItem('logSourceServerPath') || '';
        }

        if (!effectiveSource.path) {
            setAvailableDates([]);
            return;
        }

        setLoadingDates(true);
        setError(null);

        try {
            const dates = await logSourceService.getAvailableDates(effectiveSource);
            setAvailableDates(dates);
            // Auto-select the most recent date if none selected
            if (dates.length > 0) {
                setSelectedDate(prev => prev || dates[0]);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch available dates';
            setError(errorMessage);
            setAvailableDates([]);
        } finally {
            setLoadingDates(false);
        }
    }, [getCurrentSource]);

    // Fast streaming log loading
    const loadLogsByDateStream = useCallback(async () => {
        if (!selectedDate) return;

        // Cancel any existing stream
        streamingService.stopStream();
        backgroundWorker.cancelAll();

        setLoading(true);
        setError(null);
        setLogs([]);
        setFilteredLogs([]);

        try {
            const source = getCurrentSource();

            // Start streaming connection
            streamingService.startStream(`${API_BASE_URL}/logs/stream`, {
                date: selectedDate,
                level: level || undefined,
                search: search || undefined,
                customPath: source.path || undefined
            });

            // Subscribe to stream updates
            const unsubscribe = streamingService.subscribe('dashboard', (data) => {
                setLogs(prev => {
                    const updated = [...prev, ...data.logs];
                    return updated;
                });
                setFilteredLogs(prev => [...prev, ...data.logs]);
                setHasMore(data.hasMore);

                // Hide loading overlay as soon as first logs arrive or stream finishes
                if (data.logs.length > 0 || !data.hasMore) {
                    setLoading(false);
                }

                if (!data.hasMore) {
                    streamingService.stopStream();
                }
            });

            // Cleanup on unmount
            return () => {
                unsubscribe();
                streamingService.stopStream();
            };

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start log streaming');
            setLoading(false);
        }
    }, [selectedDate, getCurrentSource, level, search]);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            if (end) {
                end.setHours(23, 59, 59, 999);
            }

            const currentOffset = logs.length;
            let response;

            if (start || end) {
                response = await logService.getLogs(start, end, currentOffset, PAGE_SIZE);
            } else {
                response = await logService.getLatestLogs(currentOffset, PAGE_SIZE);
            }

            setLogs(prev => [...prev, ...response.logs]);
            setFilteredLogs(prev => [...prev, ...response.logs]);
            setHasMore(response.hasMore);
        } catch (err) {
            console.error('Failed to load more logs:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, logs.length, startDate, endDate]);

    // Apply client-side search filter
    useEffect(() => {
        if (search) {
            const filtered = logSourceService.searchLogs(logs, search);
            setFilteredLogs(filtered);
        } else {
            setFilteredLogs(logs);
        }
    }, [search, logs]);

    // Apply level filter
    useEffect(() => {
        if (level) {
            const levelMap: Record<string, string[]> = {
                'INF': ['Information', 'INF', 'Info'],
                'WRN': ['Warning', 'WRN', 'Warn'],
                'ERR': ['Error', 'ERR'],
                'DBG': ['Debug', 'DBG'],
                'FATAL': ['Fatal', 'FTL', 'FATAL']
            };
            const matchLevels = levelMap[level] || [level];
            setFilteredLogs(logs.filter(log => matchLevels.some(l => log.level.toLowerCase() === l.toLowerCase())));
        } else if (!search) {
            setFilteredLogs(logs);
        }
    }, [level, logs, search]);

    const handleSettingsSave = () => {
        // Sync sourceType from localStorage (SettingsModal saved it)
        const savedType = (localStorage.getItem('logSourceType') as LogSourceType) || 'local';
        setSourceType(savedType);
        // Refresh available dates when settings change
        fetchAvailableDates(savedType);
    };


    // Auto-detect discovery state (feature not yet wired up — kept for future use)
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [discoveryDetails] = useState<{ count: number; path: string; isUnc: boolean; latestFile?: DiscoveredLogFile } | null>(null);


    // Initialize on mount
    useEffect(() => {
        const savedType = (localStorage.getItem('logSourceType') as LogSourceType) || 'local';
        setSourceType(savedType);
        fetchAvailableDates(savedType);
    }, []);

    // Auto-load logs whenever selectedDate changes
    useEffect(() => {
        if (selectedDate) {
            loadLogsByDateStream();
        }
    }, [selectedDate, loadLogsByDateStream]);

    // Live Polling Effect - full reload every 10 seconds
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isLive && selectedDate) {
            intervalId = setInterval(() => {
                loadLogsByDateStream();
            }, LIVE_POLL_INTERVAL_MS);
        }

        return () => clearInterval(intervalId);
    }, [isLive, selectedDate, loadLogsByDateStream]);

    // Keyboard Navigation
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (filteredLogs.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex(prev => Math.min(prev + 1, filteredLogs.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex(prev => Math.max(prev - 1, 0));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredLogs]);

    // Load More Footer Component
    const Footer = () => {
        if (!hasMore) return null;

        return (
            <div className="p-4 flex justify-center">
                <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-lg"
                >
                    {loadingMore ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Loading more...
                        </>
                    ) : (
                        <>
                            <ChevronDown size={18} />
                            Load More ({logs.length} loaded)
                        </>
                    )}
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-primary/30">
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSave={handleSettingsSave}
            />

            <CorrelationModal
                correlationId={selectedCorrelationId}
                onClose={() => setSelectedCorrelationId(null)}
            />

            <AutoDetectSuccessModal
                isOpen={successModalOpen}
                onClose={() => setSuccessModalOpen(false)}
                fileCount={discoveryDetails?.count || 0}
                path={discoveryDetails?.path || ''}
                isUnc={discoveryDetails?.isUnc || false}
                latestFile={discoveryDetails?.latestFile}
            />

            <header className="sticky top-4 z-40 bg-brand-bg/90 backdrop-blur-md border-b border-gray-800 shadow-md shadow-black/20">
                <div className="flex gap-3 px-6 h-[60px] items-center flex-wrap w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img src={zyncLogo} alt="Zync log" className="h-[50px] w-auto" />
                        <h1 className="font-michroma text-2xl font-normal text-gray-100 tracking-tight mr-4">
                            Zync <span className="text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">log</span>
                        </h1>
                    </div>

                    {/* Moved Controls (Top Row without Auto-detect) */}
                    {/* 2. Date Dropdown */}
                    <div className="relative min-w-[180px] group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-blue-300 w-4 h-4 pointer-events-none z-20 transition-colors duration-300" />
                        <select
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            disabled={loadingDates || availableDates.length === 0}
                            className={cn(
                                "relative z-10 w-full bg-gray-900 border border-blue-500/30 rounded-xl pl-10 pr-9 py-2.5 text-sm font-medium text-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]",
                                (loadingDates || availableDates.length === 0) && "opacity-60 cursor-not-allowed text-gray-400 hover:shadow-none hover:border-blue-500/30"
                            )}
                        >
                            {loadingDates ? (
                                <option value="">Loading dates...</option>
                            ) : availableDates.length === 0 ? (
                                <option value="">No dates available</option>
                            ) : (
                                <>
                                    <option value="">Select date...</option>
                                    {availableDates.map(date => (
                                        <option key={date} value={date}>{date}</option>
                                    ))}
                                </>
                            )}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400/70 group-hover:text-blue-300 z-20 transition-colors duration-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>


                    {/* 4. Search - Expands to fill available space */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 z-20" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search logs..."
                            className="w-full bg-gray-900 border border-blue-500/30 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-blue-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-500"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white z-20">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Source Component */}
                    <div className="group relative flex items-center gap-0 rounded-xl overflow-hidden border"
                        style={{
                            background: sourceType === 'local' ? 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(17,24,39,0.95) 50%, rgba(17,24,39,0.95) 100%)' : 'linear-gradient(135deg, rgba(147,51,234,0.08) 0%, rgba(17,24,39,0.95) 50%, rgba(17,24,39,0.95) 100%)',
                            borderColor: sourceType === 'local' ? 'rgba(59,130,246,0.25)' : 'rgba(147,51,234,0.25)'
                        }}
                    >
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                        <div className="flex items-center gap-2 px-3 py-2 cursor-default" title="Current log source">
                            <div className={cn("relative z-10 transition-all duration-300", sourceType === 'local' ? "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]" : "text-purple-400 drop-shadow-[0_0_8px_rgba(147,51,234,0.7)]")}>
                                {sourceType === 'local' ? <HardDrive size={15} /> : <Server size={15} />}
                            </div>
                            <span className={cn("relative z-10 text-xs font-bold tracking-wide uppercase", sourceType === 'local' ? "text-blue-300" : "text-purple-300")}>
                                {sourceType === 'local' ? 'Local' : 'On-Prem'}
                            </span>
                        </div>
                        <div className={cn("w-px h-6 opacity-30", sourceType === 'local' ? "bg-blue-400" : "bg-purple-400")} />
                        <button onClick={() => setIsSettingsOpen(true)} className={cn("relative z-10 p-2.5 transition-all duration-200 hover:bg-white/5", sourceType === 'local' ? "text-blue-400/70 hover:text-blue-300" : "text-purple-400/70 hover:text-purple-300")} title="Configure Log Source">
                            <FolderClosed size={16} className="transition-transform duration-200 hover:scale-110" />
                        </button>
                    </div>

                    {/* Live Button */}
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className={cn(
                            "relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden group flex items-center gap-2",
                            isLive
                                ? "bg-red-950/40 border border-red-500/50 text-red-400 hover:bg-red-900/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                : "bg-gradient-to-r from-cyan-950/80 via-gray-900 to-cyan-950/80 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                        )}
                        title={isLive ? "Stop Live Updates" : "Start Live Updates (10s)"}
                    >
                        {!isLive && <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />}
                        {isLive && <span className="absolute inset-0 bg-red-500/10 animate-pulse" />}
                        <div className="relative z-10 flex items-center gap-2">
                            {isLive ? (
                                <div className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Play size={14} className="text-cyan-400 group-hover:text-cyan-300 group-hover:scale-110 transition-all drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
                                </div>
                            )}
                            <span className={cn("hidden sm:inline uppercase tracking-wider text-[11px] font-bold", isLive ? "text-red-400" : "text-cyan-300 group-hover:text-cyan-200")}>
                                {isLive ? 'LIVE CAPTURE' : 'GO LIVE'}
                            </span>
                        </div>
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={loadLogsByDateStream}
                        disabled={loading || !selectedDate}
                        className={cn(
                            "relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden group flex items-center gap-2",
                            loading || !selectedDate
                                ? "bg-gray-800 border border-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-violet-950/80 via-purple-900/60 to-violet-950/80 border border-violet-500/30 text-violet-200 hover:border-violet-400/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        )}
                        title="Refresh Logs"
                    >
                        {(!loading && selectedDate) && <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-violet-400/15 to-transparent" />}
                        <RotateCw size={15} className={cn("relative z-10 transition-all", loading ? "animate-spin text-gray-400" : "text-violet-300 group-hover:text-violet-200 group-hover:rotate-180 duration-500 drop-shadow-[0_0_4px_rgba(139,92,246,0.5)]")} />
                    </button>
                </div>

                <FilterPanel
                    level={level}
                    onLevelChange={setLevel}
                    logs={logs}
                />
            </header>

            <main className="container mx-auto max-w-7xl p-4">
                {error && (
                    <div className="mb-4 p-4 rounded bg-red-950/30 border border-red-900/50 text-red-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Show loader overlay only when no logs are loaded yet */}
                {loading && logs.length === 0 && (
                    <div className="fixed inset-0 z-50 bg-brand-bg/50 backdrop-blur-sm">
                        <CustomLoader />
                    </div>
                )}

                {/* Log Stats Panel with Heatmap */}
                {filteredLogs.length > 0 && (
                    <LogStatsPanel logs={filteredLogs} />
                )}

                <div className="bg-gray-900/30 rounded-lg border border-gray-800 backdrop-blur-sm h-[calc(100vh-260px)] overflow-hidden shadow-2xl relative">
                    {filteredLogs.length === 0 && !loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <img src={noLogsFound} width={300} alt="No Logs Found" className="mb-4" />
                            <p>{availableDates.length === 0 ? 'Configure a log source in Settings' : 'Select a date and click "Load Logs"'}</p>
                        </div>
                    ) : (
                        <Virtuoso
                            ref={virtuosoRef}
                            style={{ height: '100%' }}
                            data={filteredLogs}
                            itemContent={(index, log) => (
                                <div className={`px-2 pt-1 ${focusedIndex === index ? 'bg-blue-900/20 -mx-2 px-4 shadow-lg ring-1 ring-blue-500/30' : ''}`}>
                                    <LogEntryRow
                                        key={`${log.timestamp}-${index}`}
                                        entry={log}
                                        onCorrelationClick={(id) => setSelectedCorrelationId(id)}
                                    />
                                </div>
                            )}
                            components={{ Footer }}
                        />
                    )}
                </div>

                {/* Jump to Next Error Button */}
                <JumpToNextErrorButton
                    logs={filteredLogs}
                    currentIndex={currentErrorIndex}
                    onJump={(index) => {
                        setCurrentErrorIndex(index);
                        virtuosoRef.current?.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
                    }}
                />
            </main>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    title={toast.title}
                    onClose={() => setToast(null)}
                    duration={4000}
                />
            )}
        </div>
    );
};
