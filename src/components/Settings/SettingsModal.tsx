import React, { useState, useEffect } from 'react';
import { X, AlertCircle, FileText, Calendar, Info, CheckCircle, Folder, HardDrive, Server, FolderOpen, Loader, Save } from 'lucide-react';
import { z } from 'zod';
import { cn } from '../../lib/utils';
import { logSourceService, LogSource, LogSourceType } from '../../services/logSourceService';
import { CustomLoader } from '../Loader/CustomLoader';
import { DEFAULT_LOCAL_LOG_PATH } from '../../config/constants';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

// Default log path (pulled from shared constants)
const DEFAULT_LOCAL_PATH = DEFAULT_LOCAL_LOG_PATH;

// Zod schema for validating configuration settings
const settingsSchema = z.object({
    sourceType: z.enum(['local', 'server']),
    localPath: z.string().trim(),
    serverPath: z.string().trim(),
}).superRefine((data, ctx) => {
    if (data.sourceType === 'local') {
        if (!data.localPath) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Local folder path is required. Please select or enter a valid directory.",
                path: ['localPath']
            });
        } else if (!/^[a-zA-Z]:[\\/]/.test(data.localPath)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid drive path format. Path must start with a drive letter (e.g., D:\\Project\\Log or C:\\Logs).",
                path: ['localPath']
            });
        }
    } else {
        if (!data.serverPath) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "UNC network path is required for on-premise server source.",
                path: ['serverPath']
            });
        } else if (!/^\\\\[a-zA-Z0-9-._]+[\\/]/.test(data.serverPath)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid UNC path format (e.g., \\\\ServerName\\Share\\Logs).",
                path: ['serverPath']
            });
        }
    }
});

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
    const [sourceType, setSourceType] = useState<LogSourceType>('local');
    const [localPath, setLocalPath] = useState(DEFAULT_LOCAL_PATH);
    const [serverPath, setServerPath] = useState('');
    const [detectedDates, setDetectedDates] = useState<string[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isBrowsing, setIsBrowsing] = useState(false);
    const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Load saved settings
            const savedType = (localStorage.getItem('logSourceType') as LogSourceType) || 'local';
            const effectiveType: LogSourceType = savedType === 'server' ? 'local' : savedType;
            const savedLocalPath = localStorage.getItem('logSourceLocalPath') || localStorage.getItem('logSourcePath') || DEFAULT_LOCAL_PATH;
            const savedServerPath = localStorage.getItem('logSourceServerPath') || '';

            setSourceType(effectiveType);
            setLocalPath(savedLocalPath);
            setServerPath(savedServerPath);
            setValidationStatus('idle');
            setErrorMessage('');
            setDetectedDates([]);
        }
    }, [isOpen]);

    const currentPath = sourceType === 'local' ? localPath : serverPath;
    const setCurrentPath = (path: string) => {
        if (sourceType === 'local') {
            setLocalPath(path);
        } else {
            setServerPath(path);
        }
    };

    const handleTestConnection = async () => {
        // Run Zod validation
        const result = settingsSchema.safeParse({ sourceType, localPath, serverPath });
        if (!result.success) {
            const firstIssue = result.error.issues[0];
            setValidationStatus('error');
            setErrorMessage(firstIssue.message);
            return;
        }

        setIsValidating(true);
        setErrorMessage('');
        setValidationStatus('idle');
        setDetectedDates([]);
        
        try {
            let pathToSend = currentPath;
            if (pathToSend.toLowerCase().endsWith('.txt') || pathToSend.toLowerCase().endsWith('.log')) {
                const lastSlash = pathToSend.lastIndexOf('\\');
                if (lastSlash > -1) {
                    pathToSend = pathToSend.substring(0, lastSlash);
                }
            }

            const source: LogSource = { type: sourceType, path: pathToSend };
            const dates = await logSourceService.getAvailableDates(source);

            if (dates.length > 0) {
                setValidationStatus('success');
                setDetectedDates(dates);
            } else {
                setValidationStatus('error');
                setErrorMessage('No log files with date patterns found in this folder.');
            }
        } catch (error) {
            setValidationStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Failed to connect to the log source.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleSave = () => {
        // Run Zod validation
        const result = settingsSchema.safeParse({ sourceType, localPath, serverPath });
        if (!result.success) {
            const firstIssue = result.error.issues[0];
            setValidationStatus('error');
            setErrorMessage(firstIssue.message);
            return;
        }

        let finalPath = currentPath;
        if (finalPath.toLowerCase().endsWith('.txt') || finalPath.toLowerCase().endsWith('.log')) {
            const lastSlash = finalPath.lastIndexOf('\\');
            if (lastSlash > -1) {
                finalPath = finalPath.substring(0, lastSlash);
            }
        }

        const source: LogSource = { type: sourceType, path: finalPath };
        logSourceService.saveSource(source);

        onSave();
        onClose();
    };

    const handleBrowse = async () => {
        try {
            setIsBrowsing(true);
            const response = await fetch('/api/system/pick-folder');

            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: 'Unknown error' }));
                setValidationStatus('error');
                setErrorMessage(err.error ?? 'Failed to open folder picker.');
                return;
            }

            const result: { path: string | null; cancelled: boolean } = await response.json();

            if (!result.cancelled && result.path) {
                setCurrentPath(result.path);
                setValidationStatus('idle');
                setErrorMessage('');
            }
        } catch {
            setValidationStatus('error');
            setErrorMessage('Could not reach the backend to open the folder picker. Make sure the API is running.');
        } finally {
            setIsBrowsing(false);
        }
    };

    const handleSourceTypeChange = (type: LogSourceType) => {
        setSourceType(type);
        setValidationStatus('idle');
        setErrorMessage('');
        setDetectedDates([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {isValidating && (
                <div className="fixed inset-0 z-[60] bg-brand-bg/50 backdrop-blur-sm">
                    <CustomLoader />
                </div>
            )}
            <div className="bg-[#1e1e1e] border border-gray-700 rounded-tl-[30px] rounded-br-[30px] shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between rounded-tl-[30px] px-6 py-5 border-b border-gray-800 bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-primary/10 rounded-lg">
                            <Folder className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white tracking-tight">Configuration</h2>
                            <p className="text-xs text-gray-400">Manage log source connections</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 bg-gray-900/50 space-y-6 overflow-y-auto">
                    {/* Source Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Log Source Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Local Folder - Cyan Theme */}
                            <button
                                onClick={() => handleSourceTypeChange('local')}
                                className={cn(
                                    "relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border transition-all duration-300 group overflow-hidden min-h-[120px]",
                                    "backdrop-blur-md",
                                    sourceType === 'local'
                                        ? "bg-cyan-500/10 border-cyan-400/60 text-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.3)]"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-cyan-500/10 hover:border-cyan-400/40 hover:text-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                                )}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />

                                <HardDrive size={28} strokeWidth={1.5} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                                <div className="text-center relative z-10">
                                    <span className="block font-medium text-sm">Local Folder</span>
                                    <span className="text-[10px] opacity-70">File-based logs</span>
                                </div>
                                {sourceType === 'local' && (
                                    <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
                                )}
                            </button>

                            {/* On-Premise - Coming soon */}
                            <button
                                type="button"
                                disabled
                                className={cn(
                                    "relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border transition-all duration-300 overflow-hidden min-h-[120px]",
                                    "backdrop-blur-md cursor-not-allowed opacity-80",
                                    "bg-violet-500/5 border-violet-400/30 text-violet-300/70"
                                )}
                            >
                                <span className="absolute top-2 right-2 z-20 text-[8px] font-semibold uppercase tracking-wide text-violet-200 bg-violet-500/20 border border-violet-400/40 px-2 py-0.5 rounded-full leading-tight">
                                    Currently Developing
                                </span>

                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />

                                <Server size={28} strokeWidth={1.5} className="relative z-10" />
                                <div className="text-center relative z-10">
                                    <span className="block font-medium text-sm">On-Premise (UNA)</span>
                                    <span className="text-[10px] opacity-70">Network path — available soon</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Path Input */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                                {sourceType === 'local' ? 'Local Folder Path' : 'UNC Network Path'}
                            </label>
                            {validationStatus === 'success' && (
                                <span className="flex items-center gap-1.5 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                                    <CheckCircle size={12} /> Connected
                                </span>
                            )}
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-brand-primary transition-colors">
                                <FolderOpen size={18} />
                            </div>
                            <input
                                type="text"
                                value={currentPath}
                                onChange={(e) => { setCurrentPath(e.target.value); setValidationStatus('idle'); }}
                                placeholder={sourceType === 'local' ? "e.g., C:\\Logs" : "e.g., \\\\Server\\Share\\Logs"}
                                disabled={sourceType === 'server'}
                                className={cn(
                                    "w-full bg-gray-950 border-2 rounded-xl pl-11 pr-28 py-3 text-sm text-gray-200 focus:outline-none transition-all placeholder:text-gray-700 font-mono",
                                    sourceType === 'server' && "opacity-50 cursor-not-allowed",
                                    validationStatus === 'error'
                                        ? "border-red-900/50 focus:border-red-500 focus:ring-4 focus:ring-red-900/20"
                                        : validationStatus === 'success'
                                            ? "border-green-900/50 focus:border-green-500 focus:ring-4 focus:ring-green-900/20"
                                            : "border-gray-800 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                )}
                            />
                            {/* Browse button — opens native OS folder picker */}
                            {sourceType === 'local' && (
                                <button
                                    type="button"
                                    onClick={handleBrowse}
                                    disabled={isBrowsing}
                                    title="Browse for folder"
                                    className="absolute inset-y-0 right-0 flex items-center gap-1.5 px-3 mr-1 my-1 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isBrowsing ? (
                                        <>
                                            <Loader size={13} className="animate-spin text-cyan-300" />
                                            <span>Browsing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FolderOpen size={13} />
                                            <span>Browse</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Error Message */}
                        {validationStatus === 'error' && errorMessage && (
                            <div className="flex items-start gap-2 text-red-400 text-xs px-1 animate-in slide-in-from-top-1">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Detected Dates Display */}
                        {detectedDates.length > 0 && (
                            <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-800 flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-400 flex items-center gap-2">
                                        <Calendar size={12} className="text-brand-primary" />
                                        Available Dates ({detectedDates.length})
                                    </span>
                                    <span className="text-[10px] text-green-400">Ready to load</span>
                                </div>
                                <div className="max-h-28 overflow-y-auto px-2 py-1">
                                    {detectedDates.slice(0, 10).map((date, idx) => (
                                        <div key={idx} className="text-[11px] text-gray-400 py-1 px-1 border-b border-gray-800/50 last:border-0 flex items-center gap-2">
                                            <FileText size={10} className="text-brand-primary/50" />
                                            <span>{logSourceService.formatDateForDisplay(date)}</span>
                                            <span className="text-gray-600 ml-auto font-mono">{date}</span>
                                        </div>
                                    ))}
                                    {detectedDates.length > 10 && (
                                        <div className="text-[10px] text-gray-500 py-1 px-1 text-center">
                                            +{detectedDates.length - 10} more dates available
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Folder Selection Success Message */}
                        {validationStatus === 'success' && localPath && (
                            <div className="bg-green-900/20 border border-green-800/50 rounded-lg overflow-hidden">
                                <div className="px-3 py-2 flex items-center gap-2">
                                    <CheckCircle size={14} className="text-green-400" />
                                    <span className="text-xs font-medium text-green-400">
                                        Folder selected successfully
                                    </span>
                                </div>
                                <div className="px-3 py-2 border-t border-green-800/30">
                                    <span className="text-[11px] text-gray-300 font-mono break-all">
                                        {localPath}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <h4 className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-1">
                                <Info size={12} />
                                {sourceType === 'local' ? 'Local Log Files' : 'On-Premise (UNA) Server'}
                            </h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                {sourceType === 'local'
                                    ? "Enter the folder path containing log files. Files should be named with dates (e.g., 2025-12-26.txt or 20251226.txt)."
                                    : "Enter the UNC path to the shared folder (e.g., \\\\ServerName\\Logs). Ensure the server account has network access."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 rounded-br-[30px] bg-gray-900/50">
                    <button
                        onClick={handleTestConnection}
                        disabled={isValidating || !currentPath}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-lg transition-all border border-transparent flex items-center gap-2",
                            isValidating
                                ? "text-gray-500 bg-gray-800"
                                : "text-gray-300 hover:text-white hover:bg-gray-800 hover:border-gray-700"
                        )}
                    >
                        {isValidating ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        {isValidating ? 'Testing...' : 'Test Connection'}
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors hover:bg-gray-800/50 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isValidating}
                            className={cn(
                                "px-5 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2",
                                (isValidating) && "opacity-50 cursor-not-allowed shadow-none"
                            )}
                        >
                            <Save size={16} />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
