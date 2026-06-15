import React from 'react';
import { Zap } from 'lucide-react';
import styles from './NeonAutoDetectButton.module.css';

export interface NeonAutoDetectButtonProps {
    /** Click handler for auto-detect action */
    onClick: () => void;
    /** Whether the button is in loading state */
    isLoading?: boolean;
    /** Whether the button is disabled */
    disabled?: boolean;
    /** Optional className for additional styling */
    className?: string;
}

/**
 * Neon-styled animated button for auto-detecting today's logs.
 * Features:
 * - Rotating gradient border (purple/blue cyber theme)
 * - Outer glow effect
 * - Hover pulse animation
 * - Shimmer loading state
 * - Scale animations on interaction
 */
export const NeonAutoDetectButton: React.FC<NeonAutoDetectButtonProps> = ({
    onClick,
    isLoading = false,
    disabled = false,
    className = '',
}) => {
    const isDisabled = disabled || isLoading;

    return (
        <div className={`${styles['neon-button-wrapper']} ${className}`}>
            {/* Outer glow effect */}
            <div className={styles['neon-glow']} />

            {/* Pulse ring on hover */}
            {!isDisabled && <div className={styles['pulse-ring']} />}

            {/* Rotating border container */}
            <div className={styles['rotating-border-container']}>
                {/* Animated rotating gradient border */}
                {!isDisabled && (
                    <div className={styles['rotating-border']} />
                )}

                {/* Main button */}
                <button
                    onClick={onClick}
                    disabled={isDisabled}
                    className={styles['neon-button']}
                    type="button"
                    aria-label="Auto-detect today's logs"
                >
                    {/* Shimmer overlay when loading */}
                    {isLoading && <div className={styles['shimmer-overlay']} />}

                    {/* Shimmer hover effect */}
                    {!isLoading && !disabled && <div className={styles['hover-shimmer']} />}

                    {/* Icon */}
                    {isLoading ? (
                        <div className={styles['loading-spinner']} />
                    ) : (
                        <Zap size={18} className={styles['button-icon']} />
                    )}

                    {/* Text */}
                    <span className={styles['button-text']}>
                        {isLoading ? 'Detecting...' : "Auto Detect"}
                    </span>

                    {/* Inline pulse indicator (like Load Logs button) */}
                    {!isLoading && !disabled && (
                        <div className={styles['inline-pulse']}>
                            <div className={styles['pulse-dot-ping']} />
                            <div className={styles['pulse-dot-solid']} />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

export default NeonAutoDetectButton;
