import React, { useMemo } from 'react';
import { cn } from '../../lib/utils';
import { LogEntry } from '../../services/logService';
import { LogStatsBadge, countLogsByLevel } from '../LogStatsPanel';

interface FilterPanelProps {
    level: string;
    onLevelChange: (value: string) => void;
    logs: LogEntry[];
}

const LEVEL_FILTERS = [
    { label: 'All', value: '' },
    { label: 'Info', value: 'INF' },
    { label: 'Warn', value: 'WRN' },
    { label: 'Error', value: 'ERR' },
    { label: 'Debug', value: 'DBG' },
    { label: 'Fatal', value: 'FATAL' }
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
    level, onLevelChange,
    logs = [],
}) => {
    const counts = useMemo(() => countLogsByLevel(logs), [logs]);

    return (
        <div className="flex flex-col px-6 py-2 bg-brand-bg/95 backdrop-blur-md z-10 transition-all duration-300">
            <div className='flex justify-between items-center relative w-full min-h-[44px]'>
                {/* Left: Filters */}
                <div className="flex items-center gap-2 overflow-x-auto p-2 scrollbar-hide z-10">
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

                {/* Center: Badge */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-4 z-0">
                    <LogStatsBadge counts={counts} />
                </div>

                {/* Right: Legend */}
                <div className="hidden lg:flex items-center gap-4 text-[10px] text-gray-500 z-10 pr-2">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Info</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Debug</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Warning</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Error</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
