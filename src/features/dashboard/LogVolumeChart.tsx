/**
 * LogVolumeChart — Recharts AreaChart showing log count per hour.
 * Peak marker reflects the hour with the highest total log volume (matches the chart line).
 */

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import {
  ANIMATION_DURATION,
  AXIS_TICK_STYLE,
  GRID_PROPS,
  TOOLTIP_CONTENT_STYLE,
  GRADIENT_IDS,
  CHART_COLORS,
  panelStyle,
} from './config/chartConfig';
import type { LogVolumePoint } from './types/dashboardTypes';

interface ChartPayloadEntry {
  dataKey?: string;
  value?: number | string;
  name?: string;
  color?: string;
  payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ChartPayloadEntry[];
  label?: string;
}

const VolumeTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const findVal = (key: string) =>
    (payload as ChartPayloadEntry[]).find((p) => p.dataKey === key)?.value ?? 0;

  const totalLogs  = findVal('total');
  const errorCount = findVal('errors');
  const warnCount  = findVal('warnings');

  return (
    <div style={TOOLTIP_CONTENT_STYLE}>
      <div className="text-xs font-bold mb-2 font-sans" style={{ color: CHART_COLORS.secondary }}>{label}</div>
      <div className="flex flex-col gap-1 text-xs font-sans">
        <div className="flex justify-between gap-6">
          <span style={{ color: CHART_COLORS.textMuted }}>Total Logs</span>
          <span className="font-bold" style={{ color: CHART_COLORS.textPrimary }}>
            {Number(totalLogs).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span style={{ color: CHART_COLORS.textMuted }}>Errors</span>
          <span className="font-bold" style={{ color: CHART_COLORS.error }}>{errorCount}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span style={{ color: CHART_COLORS.textMuted }}>Warnings</span>
          <span className="font-bold" style={{ color: CHART_COLORS.warning }}>{warnCount}</span>
        </div>
      </div>
    </div>
  );
};

interface LogVolumeChartProps {
  data?: LogVolumePoint[];
  loading?: boolean;
}

const LogVolumeChart: React.FC<LogVolumeChartProps> = ({ data = [], loading = false }) => {
  /** Peak = hour with the highest total log volume (what the area chart plots) */
  const peakVolume = useMemo(() => {
    if (!data.length) return null;
    const peak = data.reduce((max, point) =>
      point.total > max.total ? point : max, data[0]);
    if (peak.total <= 0) return null;
    return peak;
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-xl p-5 h-64 animate-pulse border border-gray-800" style={panelStyle}>
        <div className="h-4 w-48 rounded mb-6 bg-gray-800" />
        <div className="h-40 rounded bg-gray-900/60" />
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5 flex flex-col gap-4 h-full border border-gray-800/80" style={panelStyle}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="p-1.5 rounded-lg bg-brand-primary/15 border border-brand-primary/25">
          <TrendingUp size={16} className="text-brand-secondary" />
        </div>
        <h3 className="text-sm font-semibold text-gray-100 font-sans">Log Volume Over Time</h3>
        {peakVolume && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-sans">
            Peak volume: {peakVolume.hour} · {peakVolume.total.toLocaleString()} logs
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={GRADIENT_IDS.volumeArea} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={CHART_COLORS.primary} stopOpacity={0.45} />
              <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid {...GRID_PROPS} />

          <XAxis
            dataKey="hour"
            tick={AXIS_TICK_STYLE as any}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.border }}
            interval={2}
          />
          <YAxis tick={AXIS_TICK_STYLE as any} tickLine={false} axisLine={false} />

          <Tooltip content={<VolumeTooltip />} cursor={{ stroke: `${CHART_COLORS.secondary}50`, strokeWidth: 1 }} />

          {peakVolume && (
            <ReferenceLine
              x={peakVolume.hour}
              stroke={CHART_COLORS.secondary}
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: 'Peak',
                fill: CHART_COLORS.secondary,
                fontSize: 10,
                fontFamily: 'system-ui, sans-serif',
                position: 'insideTopRight',
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="total"
            stroke={CHART_COLORS.secondary}
            strokeWidth={2}
            fill={`url(#${GRADIENT_IDS.volumeArea})`}
            animationDuration={ANIMATION_DURATION}
            animationEasing="ease-out"
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS.primary, stroke: CHART_COLORS.secondary, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LogVolumeChart;
