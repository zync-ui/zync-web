/**
 * TopErrorsList.tsx — Ranked leaderboard of the 10 most frequent error messages.
 *
 * Features:
 *   - Rank badge (1–10), truncated message, occurrence count in red
 *   - Proportional progress bar (max = top error count = 100%)
 *   - Hover: purple left-border highlight + subtle background tint
 *   - Click fires onErrorFilter(message) so the log viewer can filter
 *   - Empty state with green CheckCircle icon when no errors exist
 *
 * Props:
 *   data          — Array of { rank, message, count }
 *   onErrorFilter — Callback receiving the clicked error message string
 *   loading       — Shows skeleton rows when true
 */

import React from 'react';
import { AlertOctagon, CheckCircle } from 'lucide-react';
import type { TopErrorItem } from './types/dashboardTypes';
import { CHART_COLORS, panelStyle } from './config/chartConfig';

/** Truncate a string to maxLength characters with an ellipsis suffix */
const truncate = (text: string, maxLength = 60): string =>
  text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface TopErrorsListProps {
  data?: TopErrorItem[];
  onErrorFilter?: (message: string) => void;
  loading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// TopErrorsList component
// ─────────────────────────────────────────────────────────────────────────────

const TopErrorsList: React.FC<TopErrorsListProps> = ({
  data = [],
  onErrorFilter,
  loading = false,
}) => {
  /** The top error's count becomes 100% of the progress bar scale */
  const maxCount = data[0]?.count ?? 1;

  if (loading) {
    return (
      <div className="rounded-xl p-5 h-full border border-gray-800" style={panelStyle}>
        <div className="h-4 w-32 rounded mb-5 bg-gray-800" />
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-8 rounded mb-2 animate-pulse bg-gray-900/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5 flex flex-col gap-3 h-full border border-gray-800/80" style={panelStyle}>
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/25">
          <AlertOctagon size={16} color={CHART_COLORS.error} />
        </div>
        <h3 className="text-sm font-semibold text-gray-100">Top Errors</h3>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium bg-red-500/15 border border-red-500/25 text-red-400">
          {data.length} types
        </span>
      </div>

      {data.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
          <CheckCircle size={36} className="text-emerald-400" />
          <p className="text-sm font-medium text-emerald-400">No errors found!</p>
          <p className="text-xs text-gray-500">This log file looks clean.</p>
        </div>
      )}

      <div className="flex flex-col gap-1 overflow-y-auto theme-scrollbar" style={{ maxHeight: '320px' }}>
        {data.map((errorItem) => {
          const progressWidth = Math.max(4, (errorItem.count / maxCount) * 100);

          return (
            <button
              key={errorItem.rank}
              onClick={() => onErrorFilter?.(errorItem.message)}
              title={errorItem.message}
              className="group w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150 focus:outline-none border-l-2 border-transparent hover:bg-brand-primary/10 hover:border-brand-secondary"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-xs font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0 font-sans"
                  style={{
                    background: errorItem.rank <= 3 ? `${CHART_COLORS.error}30` : CHART_COLORS.border,
                    color: errorItem.rank <= 3 ? CHART_COLORS.error : CHART_COLORS.textMuted,
                  }}
                >
                  {errorItem.rank}
                </span>
                <span className="text-xs flex-1 truncate text-gray-300" title={errorItem.message}>
                  {truncate(errorItem.message)}
                </span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 bg-red-500/15 text-red-400 font-sans">
                  {errorItem.count}
                </span>
              </div>
              <span className="text-[10px] text-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                View in logs →
              </span>
              <div className="h-0.5 rounded-full overflow-hidden bg-gray-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressWidth}%`,
                    background: `linear-gradient(90deg, ${CHART_COLORS.error}, ${CHART_COLORS.primary})`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TopErrorsList;
