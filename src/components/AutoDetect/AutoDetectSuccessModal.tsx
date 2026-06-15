import React from 'react';
import { CheckCircle2, FolderSearch, Calendar, HardDrive, Server } from 'lucide-react';
import { DiscoveredLogFile } from '../../services/autoDetectService';

interface AutoDetectSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileCount: number;
    path: string;
    isUnc: boolean;
    latestFile?: DiscoveredLogFile;
}

export const AutoDetectSuccessModal: React.FC<AutoDetectSuccessModalProps> = ({
    isOpen,
    onClose,
    fileCount,
    path,
    isUnc,
    latestFile
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gray-900 border border-emerald-500/30 rounded-xl shadow-2xl max-w-[380px] w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative group scale-95 md:scale-100">

                {/* Decoration: Animated Gradient Line */}
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-pulse" />

                {/* Header */}
                <div className="pt-6 pb-2 pl-6 pr-6 flex flex-col items-center text-center relative">
                    {/* Background Glow */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] border border-emerald-500/20 animate-[bounce_1s_ease-out_1]">
                        <CheckCircle2 size={28} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                        <CheckCircle2 size={28} className="text-emerald-400 absolute inset-0 m-auto" />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
                        Logs <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">Localized</span>
                    </h2>
                    <p className="text-gray-400 text-xs">
                        Successfully locked onto log source.
                    </p>
                </div>

                {/* Content */}
                <div className="px-5 pb-2 space-y-2 relative z-10">
                    <div className="bg-gray-800/40 rounded-lg p-3 border border-emerald-500/10 space-y-2.5 backdrop-blur-md">
                        <div className="flex items-center gap-3 group/item">
                            <div className="p-1.5 rounded-md bg-gray-800 border border-gray-700 group-hover/item:border-emerald-500/30 transition-colors">
                                <FolderSearch size={14} className="text-emerald-400" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Source Path</p>
                                    {isUnc && (
                                        <span className="flex items-center gap-1 text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-px rounded-full border border-purple-500/30 font-medium">
                                            <Server size={8} /> SERVER
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-200 truncate font-mono bg-black/20 px-1.5 py-0.5 rounded border border-white/5" title={path}>
                                    {path}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 group/item">
                            <div className="p-1.5 rounded-md bg-gray-800 border border-gray-700 group-hover/item:border-emerald-500/30 transition-colors">
                                <Calendar size={14} className="text-cyan-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-px">Available Dates</p>
                                <p className="text-sm text-white font-semibold flex items-baseline gap-1">
                                    {fileCount} <span className="text-xs text-gray-400 font-normal">files found</span>
                                </p>
                            </div>
                        </div>

                        {latestFile && (
                            <div className="flex items-center gap-3 group/item">
                                <div className="p-1.5 rounded-md bg-gray-800 border border-gray-700 group-hover/item:border-emerald-500/30 transition-colors">
                                    <HardDrive size={14} className="text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-px">Latest Activity</p>
                                    <p className="text-sm text-green-300 font-medium">
                                        {latestFile.date}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-emerald-100/70 bg-emerald-900/10 px-3 py-2 rounded-lg border border-emerald-500/10">
                        <div className="w-0.5 h-6 bg-emerald-500/50 rounded-full" />
                        <p className="leading-tight">
                            Use the <strong className="text-emerald-400">Date Filter</strong> dropdown above to investigate.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-3">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white text-sm font-bold tracking-wide rounded-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] border border-emerald-400/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                    >
                        Start Exploring
                    </button>
                </div>
            </div>
        </div>
    );
};
