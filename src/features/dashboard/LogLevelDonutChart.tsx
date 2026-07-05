/**
 * LogLevelDonutChart.tsx — Recharts PieChart (donut) for log level distribution.
 *
 * Features:
 *   - Donut: innerRadius 60, outerRadius 90
 *   - Slices: INFO / WARNING / ERROR / DEBUG / FATAL with spec colors
 *   - Animated entrance (startAngle → endAngle over 800ms)
 *   - SVG center label showing total log count
 *   - Custom legend below with count + percentage per level
 *
 * Props:
 *   data    — Array of { level, count, percentage, color }
 *   loading — Shows skeleton when true
 */

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ANIMATION_DURATION, TOOLTIP_CONTENT_STYLE, CHART_COLORS, panelStyle } from './config/chartConfig';
import type { LogLevelEntry } from './types/dashboardTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Center label
// ─────────────────────────────────────────────────────────────────────────────

interface DonutCenterProps {
  cx: number;
  cy: number;
  total: number;
}

/** SVG text rendered in the hollow centre of the donut ring */
const DonutCenterLabel: React.FC<DonutCenterProps> = ({ cx, cy, total }) => (
  <g>
    <text x={cx} y={cy - 8} textAnchor="middle" fill={CHART_COLORS.textPrimary} fontSize={22} fontWeight={700} fontFamily="system-ui, sans-serif">
      {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toLocaleString()}
    </text>
    <text x={cx} y={cy + 12} textAnchor="middle" fill={CHART_COLORS.textMuted} fontSize={11} fontFamily="system-ui, sans-serif">
      total logs
    </text>
  </g>
);

// ─────────────────────────────────────────────────────────────────────────────
// Custom tooltip
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Local tooltip prop type
// ─────────────────────────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: unknown; value?: number | string; dataKey?: string }>;
  label?: string;
}

/** Shows level, count, and percentage on hover */
const LevelTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as LogLevelEntry;
  return (
    <div style={TOOLTIP_CONTENT_STYLE}>
      <div className="font-bold text-xs mb-1" style={{ color: entry.color }}>{entry.level}</div>
      <div className="text-xs" style={{ color: CHART_COLORS.textPrimary }}>
        {entry.count.toLocaleString()} logs
        <span className="ml-2" style={{ color: CHART_COLORS.textMuted }}>({entry.percentage}%)</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface LogLevelDonutChartProps {
  data?: LogLevelEntry[];
  loading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// LogLevelDonutChart component
// ─────────────────────────────────────────────────────────────────────────────

const LogLevelDonutChart: React.FC<LogLevelDonutChartProps> = ({
  data = [],
  loading = false,
}) => {
  /** Track hovered slice index for the glow effect */
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalLogs = data.reduce((sum, entry) => sum + entry.count, 0);

  if (loading) {
    return (
      <div className="rounded-xl p-5 h-64 animate-pulse border border-gray-800" style={panelStyle}>
        <div className="h-4 w-44 rounded mb-6 bg-gray-800" />
        <div className="mx-auto h-40 w-40 rounded-full bg-gray-900/60" />
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5 flex flex-col gap-4 h-full border border-gray-800/80" style={panelStyle}>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-brand-primary/15 border border-brand-primary/25">
          <PieChartIcon size={16} className="text-brand-secondary" />
        </div>
        <h3 className="text-sm font-semibold text-gray-100">Log Level Distribution</h3>
      </div>

      {/* ── Donut chart ──────────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            startAngle={90}
            endAngle={-270}
            dataKey="count"
            animationBegin={0}
            animationDuration={ANIMATION_DURATION}
            animationEasing="ease-out"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            label={(props) => {
              // Render center label using the donut's computed cx/cy
              if (props.cx && props.cy && props.index === 0) {
                return (
                  <DonutCenterLabel
                    cx={Number(props.cx)}
                    cy={Number(props.cy)}
                    total={totalLogs}
                  />
                );
              }
              return null;
            }}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.level}
                fill={entry.color}
                stroke={activeIndex === index ? '#FFFFFF' : 'transparent'}
                strokeWidth={activeIndex === index ? 1.5 : 0}
                style={{
                  filter:     activeIndex === index ? `drop-shadow(0 0 8px ${entry.color})` : 'none',
                  transition: 'filter 0.2s',
                  cursor:     'pointer',
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<LevelTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-1.5">
        {data.map((entry) => (
          <div key={entry.level} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: entry.color }}
              />
              <span className="text-brand-secondary">{entry.level}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-100">
                {entry.count.toLocaleString()}
              </span>
              <span className="w-10 text-right text-gray-500">
                {entry.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogLevelDonutChart;
