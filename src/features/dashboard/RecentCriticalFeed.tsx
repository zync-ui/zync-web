/**
 * RecentCriticalFeed.tsx — Scrollable live feed of the latest ERROR/FATAL log lines.
 *
 * Features:
 *   - Pulsing red dot indicator next to the title to suggest "live"
 *   - Color-coded level badges: ERROR (red) / FATAL (dark red)
 *   - Timestamp in small muted text; message truncated with title tooltip
 *   - "Jump to line →" clickable text fires onJumpToLine(lineNumber)
 *   - Newest entries shown at the top
 *
 * Props:
 *   data          — Array of { lineNumber, level, timestamp, message }
 *   onJumpToLine  — Callback called with the line number to scroll to in the viewer
 *   loading       — Shows skeleton when true
 */

import React from 'react';
import { Zap } from 'lucide-react';
import type { CriticalLogEntry } from './types/dashboardTypes';
import { CHART_COLORS, panelStyle } from './config/chartConfig';

// ─────────────────────────────────────────────────────────────────────────────
// Level badge helper
// ─────────────────────────────────────────────────────────────────────────────

/** Returns background and text color for a given log level badge */
const levelStyle = (level: 'ERROR' | 'FATAL'): React.CSSProperties => ({
  background: level === 'FATAL' ? `${CHART_COLORS.fatal}30` : `${CHART_COLORS.error}20`,
  color: level === 'FATAL' ? CHART_COLORS.fatal : CHART_COLORS.error,
  borderColor: level === 'FATAL' ? `${CHART_COLORS.fatal}50` : `${CHART_COLORS.error}40`,
});

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface RecentCriticalFeedProps {
  data?: CriticalLogEntry[];
  onJumpToLine?: (lineNumber: number) => void;
  loading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// RecentCriticalFeed component
// ─────────────────────────────────────────────────────────────────────────────

const RecentCriticalFeed: React.FC<RecentCriticalFeedProps> = ({
  data = [],
  onJumpToLine,
  loading = false,
}) => {
  if (loading) {
    return (
      <div
        className="rounded-xl p-5 h-full"
        style={{ background: '#1C1628', border: '1px solid #2D2D5E' }}
      >
        <div className="h-4 w-40 rounded mb-5" style={{ background: '#2D2D5E' }} />
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-12 rounded mb-2 animate-pulse" style={{ background: '#15101F' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5 flex flex-col gap-3 h-full border border-gray-800/80" style={panelStyle}>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/25">
          <Zap size={16} color={CHART_COLORS.error} />
        </div>
        <h3 className="text-sm font-semibold text-gray-100">Recent Critical Errors</h3>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full animate-pulse-dot bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
          <span className="text-xs text-red-400">live</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto theme-scrollbar" style={{ maxHeight: '340px' }}>
        {data.map((entry) => (
          <div key={entry.lineNumber} className="rounded-lg p-3 bg-gray-950/50 border border-gray-800/80">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border" style={levelStyle(entry.level)}>
                {entry.level}
              </span>
              <span className="text-xs text-gray-500 font-sans">{entry.timestamp}</span>
              <span className="text-xs ml-auto text-gray-600">#{entry.lineNumber.toLocaleString()}</span>
            </div>
            <p className="text-xs leading-relaxed line-clamp-2 text-gray-300 font-mono" title={entry.message}>
              {entry.message}
            </p>
            {onJumpToLine && (
              <button
                onClick={() => onJumpToLine(entry.lineNumber)}
                className="mt-1.5 text-xs text-brand-secondary hover:text-cyan-300 transition-colors hover:underline flex items-center gap-1"
              >
                Jump to line →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentCriticalFeed;
