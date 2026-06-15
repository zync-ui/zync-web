import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FilterPanelProps {
    level: string;
    onLevelChange: (value: string) => void;
    // Log count props
    totalLogs?: number;
    visibleLogs?: number;
    // Streaming props
    isStreaming?: boolean;
    streamProgress?: number;
}

const LEVEL_FILTERS = [
    { label: 'All', value: '' },
    { label: 'Info', value: 'INF' },
    { label: 'Warn', value: 'WRN' },
    { label: 'Error', value: 'ERR' },
    { label: 'Debug', value: 'DBG' },
    { label: 'Fatal', value: 'FATAL' }
];

// Premium Log Count Badge Component
interface LogCountBadgeProps {
    total: number;
    visible: number;
    level?: string;
}

const LogCountBadge: React.FC<LogCountBadgeProps> = ({ total, visible, level }) => {
    const isFiltered = visible !== total;

    if (total === 0) return null;

    // Determine dot color based on current level filter
    const getDotStyles = () => {
        switch (level) {
            case 'INF':
                return 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]';
            case 'WRN':
                return 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]';
            case 'ERR':
                return 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
            case 'DBG':
                return 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]';
            case 'FATAL':
                return 'bg-red-600 shadow-[0_0_8px_rgba(185,28,28,0.8)]';
            default:
                return 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]';
        }
    };

    // Determine badge border/glow color based on level
    const getBadgeStyles = () => {
        switch (level) {
            case 'INF':
                return 'border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
            case 'WRN':
                return 'border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
            case 'ERR':
                return 'border-red-400/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
            case 'DBG':
                return 'border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]';
            case 'FATAL':
                return 'border-red-600/40 shadow-[0_0_15px_rgba(185,28,28,0.2)]';
            default:
                return 'border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]';
        }
    };

    return (
        <div
            key={`${total}-${visible}-${level}`}
            className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 whitespace-nowrap shrink-0 border border-[2px]",
                "bg-gray-950/90",
                getBadgeStyles()
            )}
        >
            <div className={cn("w-2 h-2 rounded-full animate-pulse shrink-0", getDotStyles())} />
            <span className="text-xs font-bold tracking-wide">
                {isFiltered ? (
                    <>
                        <span className="text-white">{visible.toLocaleString()}</span>
                        <span className="text-gray-500 mx-1">/</span>
                        <span className="text-gray-400">{total.toLocaleString()}</span>
                    </>
                ) : (
                    <span className="text-white">{total.toLocaleString()}</span>
                )}
                <span className="text-gray-400 ml-1.5 font-medium">logs</span>
            </span>
        </div>
    );
};

export const FilterPanel: React.FC<FilterPanelProps> = ({
    level, onLevelChange,
    totalLogs = 0,
    visibleLogs = 0,
    isStreaming = false,
    streamProgress = 0,
}) => {
    return (
        <div className="flex flex-col gap-4 px-6 py-4 bg-brand-bg/95 backdrop-blur-md z-10 transition-all duration-300">
            {/* Bottom Row: Level Chips */}
            <div className='flex justify-between items-center'>
                <div className="flex items-center gap-2 overflow-x-auto p-2 scrollbar-hide">
                    {LEVEL_FILTERS.map((filter) => {
                        const isActive = level === filter.value;

                        let colorClass = "";
                        if (isActive) {
                            switch (filter.label) {
                                case 'All':
                                    colorClass = "bg-gray-500/20 border-gray-400 text-gray-300 shadow-[0_0_15px_rgba(156,163,175,0.2)]";
                                    break;
                                case 'Info':
                                    colorClass = "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]";
                                    break;
                                case 'Warn':
                                    colorClass = "bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
                                    break;
                                case 'Error':
                                    colorClass = "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                                    break;
                                case 'Debug':
                                    colorClass = "bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]";
                                    break;
                                case 'Fatal':
                                    colorClass = "bg-[#7F1D1D]/40 border-red-800 text-red-500 shadow-[0_0_15px_rgba(127,29,29,0.5)]";
                                    break;
                                default:
                                    colorClass = "bg-gray-800 border-gray-700 text-gray-300";
                            }
                        } else {
                            colorClass = "bg-gray-900/80 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300 transition-colors";
                        }

                        return (
                            <button
                                key={filter.label}
                                onClick={() => onLevelChange(filter.value)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black uppercase tracking-wide",
                                    colorClass,
                                    isActive && "scale-105"
                                )}
                            >
                                {filter.label}
                            </button>
                        );
                    })}
                </div>

                {/* Enhanced Log Count Badge */}
                <div className="flex items-center gap-2">
                    <LogCountBadge total={totalLogs} visible={visibleLogs} level={level} />
                    {isStreaming && (
                        <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
                            <Loader2 size={12} className="animate-spin" />
                            Streaming... ({streamProgress.toLocaleString()} logs)
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
