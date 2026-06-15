import React from 'react';
import { DiscoveredLogFile } from '../../services/autoDetectService';
import { Calendar, FileText, HardDrive, Clock } from 'lucide-react';
import { autoDetectService } from '../../services/autoDetectService';

interface DateListProps {
    files: DiscoveredLogFile[];
    onSelect: (file: DiscoveredLogFile) => void;
    selectedFile: DiscoveredLogFile | null;
}

export const DateList: React.FC<DateListProps> = ({ files, onSelect, selectedFile }) => {
    return (
        <div className="flex flex-col h-full bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-800 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-800 bg-gray-900/80 sticky top-0 z-10">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} className="text-blue-400" />
                    Available Log Dates
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {files.map((file) => {
                    const isSelected = selectedFile?.fullPath === file.fullPath;
                    const isToday = autoDetectService.isToday(file.date);

                    return (
                        <button
                            key={file.fullPath}
                            onClick={() => onSelect(file)}
                            className={`
                                group w-full text-left p-3 rounded-lg transition-all duration-300 relative overflow-hidden
                                flex items-center gap-3
                                ${isSelected
                                    ? 'bg-blue-900/20 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                    : 'bg-gray-800/30 border border-gray-800 hover:border-gray-600 hover:bg-gray-800/60'
                                }
                            `}
                        >
                            {/* Active Indicator Line */}
                            {isSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                            )}

                            {/* Date Icon */}
                            <div className={`
                                p-2 rounded-md flex-shrink-0 transition-colors
                                ${isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-700/50 text-gray-400 group-hover:text-gray-200'}
                            `}>
                                <FileText size={18} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className={`font-medium truncate ${isSelected ? 'text-blue-100' : 'text-gray-300 group-hover:text-white'}`}>
                                        {file.date}
                                    </span>
                                    {isToday && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                                            TODAY
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                                    <span className="flex items-center gap-1" title="File Size">
                                        <HardDrive size={10} />
                                        {autoDetectService.formatFileSize(file.sizeBytes)}
                                    </span>
                                    <span className="flex items-center gap-1" title="Last Modified">
                                        <Clock size={10} />
                                        {new Date(file.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}

                {files.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No log files found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
