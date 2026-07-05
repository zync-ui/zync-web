import React, { useEffect, useRef, useState, ReactElement } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CHART_COLORS, panelStyle } from './config/chartConfig';

const useCountUp = (target: number, duration = 1200): number => {
  const [displayValue, setDisplayValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    startTimeRef.current = null;

    const easeOut = (progress: number) => 1 - Math.pow(1 - progress, 3);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayValue(Math.floor(easeOut(progress) * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return displayValue;
};

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: ReactElement;
  color: string;
  trendPercent?: number;
  trendLabel?: string;
  subtitle?: string;
  delay?: number;
  isText?: boolean;
  /** Skip count-up animation — show final value immediately */
  instant?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  color,
  trendPercent,
  trendLabel = 'vs previous period',
  subtitle,
  delay = 0,
  isText = false,
  instant = false,
}) => {
  const animatedNumber = useCountUp(isText || typeof value !== 'number' || instant ? 0 : value, instant ? 0 : 1200);

  const showTrend = trendPercent !== undefined && trendPercent !== 0;
  const trendIsUp = (trendPercent ?? 0) > 0;
  const trendAbsolute = Math.abs(trendPercent ?? 0).toFixed(1);

  const formattedValue: string =
    isText || typeof value === 'string'
      ? String(value)
      : instant
        ? (value as number).toLocaleString()
        : animatedNumber.toLocaleString();

  return (
    <div
      className={cn(
        'relative rounded-xl p-5 overflow-hidden flex flex-col gap-3 border border-gray-800/80',
        !instant && 'opacity-0 animate-fade-up'
      )}
      style={{
        ...panelStyle,
        borderLeft: `3px solid ${color}`,
        boxShadow: `0 0 24px ${color}18, 0 4px 16px rgba(0,0,0,0.35)`,
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
      }}
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)',
        }}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          {title}
        </span>
        <div
          className="p-2 rounded-lg border border-white/5"
          style={{ background: `${color}18` }}
        >
          {React.cloneElement(icon, { size: 16, color })}
        </div>
      </div>

      <div>
        <div className="text-3xl font-bold tracking-tight text-gray-100 font-sans">
          {formattedValue}
        </div>
        {subtitle && (
          <div className="text-xs mt-1 leading-tight text-gray-500">{subtitle}</div>
        )}
      </div>

      {showTrend && (
        <div className="flex items-center gap-1.5 text-xs">
          {trendIsUp
            ? <TrendingUp size={13} style={{ color: CHART_COLORS.error }} />
            : <TrendingDown size={13} style={{ color: CHART_COLORS.success }} />
          }
          <span className="font-semibold" style={{ color: trendIsUp ? CHART_COLORS.error : CHART_COLORS.success }}>
            {trendIsUp ? '+' : '-'}{trendAbsolute}%
          </span>
          <span className="text-gray-500">{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
