import React from 'react';
import { Calendar, FileText, FolderOpen, AlertCircle, HardDrive } from 'lucide-react';
import { DiscoveredLogFile, formatFileSize, formatDateForDisplay, isToday } from '../../services/autoDetectService';
import styles from './DiscoveredFilesList.module.css';

export interface DiscoveredFilesListProps {
    /** List of discovered log files */
    files: DiscoveredLogFile[];
    /** Currently selected file path */
    selectedPath?: string;
    /** Callback when a file is selected */
    onFileSelect: (file: DiscoveredLogFile) => void;
    /** Whether the list is loading */
    isLoading?: boolean;
    /** Error message if discovery failed */
    errorMessage?: string;
    /** The configured log folder path */
    configuredPath?: string;
    /** Whether the path is a UNC (network) path */
    isUncPath?: boolean;
}

/**
 * Loading shimmer placeholder for the file list.
 */
const LoadingShimmer: React.FC = () => (
    <div className={styles.shimmerContainer}>
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.shimmerItem}>
                <div className={styles.shimmerIcon} />
                <div className={styles.shimmerLines}>
                    <div className={styles.shimmerLine} />
                    <div className={styles.shimmerLine} />
                </div>
            </div>
        ))}
    </div>
);

/**
 * Empty state when no files are found.
 */
const EmptyState: React.FC = () => (
    <div className={styles.emptyState}>
        <FileText size={32} className={styles.emptyIcon} />
        <p className={styles.emptyText}>No log files found</p>
        <p className={styles.emptySubtext}>Check the configured path in appsettings.json</p>
    </div>
);

/**
 * Premium date-wise list of discovered log files.
 * Features hover effects, neon highlights, and today badge.
 */
export const DiscoveredFilesList: React.FC<DiscoveredFilesListProps> = ({
    files,
    selectedPath,
    onFileSelect,
    isLoading = false,
    errorMessage,
    configuredPath,
    isUncPath = false,
}) => {
    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.headerTitle}>
                        <Calendar size={16} className={styles.headerIcon} />
                        Discovering Log Files...
                    </span>
                </div>
                <LoadingShimmer />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <span className={styles.headerTitle}>
                    <Calendar size={16} className={styles.headerIcon} />
                    Available Log Files
                </span>
                {files.length > 0 && (
                    <span className={styles.headerCount}>
                        {files.length} {files.length === 1 ? 'file' : 'files'}
                    </span>
                )}
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className={styles.errorState}>
                    <AlertCircle size={16} className={styles.errorIcon} />
                    <span className={styles.errorText}>{errorMessage}</span>
                </div>
            )}

            {/* File List */}
            <div className={styles.listContainer}>
                {files.length === 0 && !errorMessage ? (
                    <EmptyState />
                ) : (
                    files.map((file) => {
                        const isSelected = file.fullPath === selectedPath;
                        const isTodayFile = isToday(file.date);

                        return (
                            <div
                                key={file.fullPath}
                                className={`${styles.fileItem} ${isSelected ? styles.fileItemActive : ''}`}
                                onClick={() => onFileSelect(file)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onFileSelect(file);
                                    }
                                }}
                            >
                                <div className={styles.fileInfo}>
                                    <Calendar size={18} className={styles.dateIcon} />
                                    <div className={styles.fileDetails}>
                                        <span className={styles.dateDisplay}>
                                            {formatDateForDisplay(file.date)}
                                            {isTodayFile && (
                                                <span className={styles.todayBadge}>Today</span>
                                            )}
                                        </span>
                                        <span className={styles.fileName}>{file.fileName}</span>
                                    </div>
                                </div>
                                <div className={styles.fileMeta}>
                                    <span className={styles.fileSize}>
                                        {formatFileSize(file.sizeBytes)}
                                    </span>
                                    <span className={styles.fileDate}>{file.date}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Path Display */}
            {configuredPath && (
                <div className={styles.pathDisplay}>
                    {isUncPath ? (
                        <HardDrive size={12} className={styles.pathIcon} />
                    ) : (
                        <FolderOpen size={12} className={styles.pathIcon} />
                    )}
                    <span className={styles.pathText} title={configuredPath}>
                        {configuredPath}
                    </span>
                </div>
            )}
        </div>
    );
};

export default DiscoveredFilesList;
