import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error';

export interface ToastProps {
    /** Type of toast: success or error */
    type: ToastType;
    /** Main message to display */
    message: string;
    /** Optional title for the toast */
    title?: string;
    /** Callback when toast is closed */
    onClose: () => void;
    /** Duration in ms before auto-dismiss (default: 4000) */
    duration?: number;
}

/**
 * Toast notification component with auto-dismiss and animations.
 * Features:
 * - Slide-in/out animations
 * - Success (green) and Error (red) variants
 * - Progress bar showing remaining time
 * - Manual close button
 */
export const Toast: React.FC<ToastProps> = ({
    type,
    message,
    title,
    onClose,
    duration = 4000,
}) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = useCallback(() => {
        setIsExiting(true);
        // Wait for exit animation before calling onClose
        setTimeout(onClose, 300);
    }, [onClose]);

    // Auto-dismiss after duration
    useEffect(() => {
        const timer = setTimeout(handleClose, duration);
        return () => clearTimeout(timer);
    }, [duration, handleClose]);

    const Icon = type === 'success' ? CheckCircle2 : XCircle;
    const defaultTitle = type === 'success' ? 'Success' : 'Error';

    return (
        <div className={styles['toast-container']}>
            <div
                className={`
                    ${styles.toast}
                    ${styles[`toast-${type}`]}
                    ${isExiting ? styles.exiting : ''}
                `}
                role="alert"
                aria-live="polite"
            >
                {/* Icon */}
                <div className={styles['toast-icon-wrapper']}>
                    <Icon size={22} className={styles['toast-icon']} />
                </div>

                {/* Content */}
                <div className={styles['toast-content']}>
                    <span className={styles['toast-title']}>
                        {title || defaultTitle}
                    </span>
                    <span className={styles['toast-message']}>
                        {message}
                    </span>
                </div>

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className={styles['toast-close']}
                    aria-label="Close notification"
                >
                    <X size={16} />
                </button>

                {/* Progress bar */}
                <div className={styles['toast-progress']}>
                    <div
                        className={styles['toast-progress-bar']}
                        style={{ animationDuration: `${duration}ms` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Toast;
