/**
 * ErrorHeatmap — GitHub contribution-graph style.
 * Rows = days, columns = hours (0–23), full-width purple intensity scale.
 */

import React, { useMemo, useState } from 'react';
import { CalendarDays, X, AlertCircle } from 'lucide-react';
import type { HeatmapCell } from './types/dashboardTypes';
import type { LogEntry } from '../../services/logService';
import { panelStyle } from './config/chartConfig';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** GitHub-style 5-step scale — purple/red theme on dark bg */
const HEAT_LEVELS = [
  { min: 0, color: '#21262d' },
  { min: 1, color: '#3b0764' },
  { min: 6, color: '#6d28d9' },
  { min: 21, color: '#9333ea' },
  { min: 50, color: '#ef4444' },
];

const getHeatColor = (errorCount: number): string => {
  if (errorCount === 0) return HEAT_LEVELS[0].color;
  for (let i = HEAT_LEVELS.length - 1; i >= 1; i--) {
    if (errorCount >= HEAT_LEVELS[i].min) return HEAT_LEVELS[i].color;
  }
  return HEAT_LEVELS[1].color;
};

interface ErrorHeatmapProps {
  data?: HeatmapCell[];
  selectedDate?: string;
  logs?: LogEntry[];
  loading?: boolean;
}

interface SelectedCell {
  day: string;
  dayKey?: string;
  hour: number;
  errorCount: number;
}

const normalizeLevel = (raw: string) => raw.toUpperCase();

const isErrorLevel = (level: string) => {
  const u = normalizeLevel(level);
  return u === 'ERR' || u === 'ERROR' || u === 'FTL' || u === 'FATAL';
};

const toLocalDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const ErrorHeatmap: React.FC<ErrorHeatmapProps> = ({
  data = [],
  selectedDate,
  logs = [],
  loading = false,
}) => {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const dayRows = useMemo(() => {
    const dayMap = new Map<string, { label: string; hours: Map<number, number> }>();

    data.forEach((cell) => {
      const key = cell.dayKey ?? cell.day;
      if (!dayMap.has(key)) {
        dayMap.set(key, { label: cell.day, hours: new Map() });
      }
      dayMap.get(key)!.hours.set(cell.hour, cell.errorCount);
    });

    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dayKey, { label, hours }]) => ({
        dayKey,
        day: label,
        hours: HOURS.map((h) => hours.get(h) ?? 0),
      }));
  }, [data]);

  const matchingLogs = useMemo(() => {
    if (!selectedCell || !logs.length) return [];
    return logs.filter((log) => {
      if (!isErrorLevel(log.level)) return false;
      const d = new Date(log.timestamp);
      if (Number.isNaN(d.getTime())) return false;
      if (d.getHours() !== selectedCell.hour) return false;
      if (selectedCell.dayKey) {
        return toLocalDateKey(d) === selectedCell.dayKey;
      }
      const day = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      return day === selectedCell.day;
    });
  }, [selectedCell, logs]);

  if (loading) {
    return (
      <div className="rounded-xl p-5 animate-pulse border border-gray-800" style={panelStyle}>
        <div className="h-4 w-56 rounded mb-6 bg-gray-800" />
        <div className="h-32 rounded bg-gray-900/60" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl p-5 flex flex-col gap-5 border border-gray-800/80" style={panelStyle}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-lg bg-brand-primary/15 border border-brand-primary/25">
            <CalendarDays size={16} className="text-brand-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100 font-sans">Error Heatmap (by Hour)</h3>
            <p className="text-[11px] text-gray-500 font-sans mt-0.5">
              {dayRows.length} day{dayRows.length !== 1 ? 's' : ''} × 24 hours
              {selectedDate ? ` · ${selectedDate}` : ''}
            </p>
          </div>
          <span className="ml-auto text-xs text-gray-500 font-sans">Click a cell for details</span>
        </div>

        {dayRows.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8 font-sans">No data for heatmap.</p>
        ) : (
          <div className="w-full">
            {/* GitHub-style layout: day labels | full-width hour grid */}
            <div
              className="w-full grid gap-y-[4px]"
              style={{ gridTemplateColumns: '52px 1fr' }}
            >
              {/* Hour labels row */}
              <div />
              <div
                className="grid w-full gap-[3px] mb-1"
                style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="text-[10px] text-gray-500 font-sans text-center truncate leading-none"
                    title={`${String(h).padStart(2, '0')}:00`}
                  >
                    {h % 2 === 0 ? h : ''}
                  </div>
                ))}
              </div>

              {/* Day rows */}
              {dayRows.map((row) => (
                <React.Fragment key={row.dayKey}>
                  <div
                    className="flex items-center justify-end pr-2 text-[11px] text-gray-400 font-sans truncate"
                    title={row.day}
                  >
                    {row.day}
                  </div>
                  <div
                    className="grid w-full gap-[3px]"
                    style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                  >
                    {row.hours.map((errorCount, hour) => {
                      const isSelected =
                        selectedCell?.dayKey === row.dayKey &&
                        selectedCell?.hour === hour;

                      return (
                        <button
                          key={hour}
                          type="button"
                          title={`${row.day} ${String(hour).padStart(2, '0')}:00 — ${errorCount} error${errorCount !== 1 ? 's' : ''}`}
                          onClick={() =>
                            setSelectedCell({
                              day: row.day,
                              dayKey: row.dayKey,
                              hour,
                              errorCount,
                            })
                          }
                          className="aspect-square w-full rounded-[3px] transition-all hover:ring-1 hover:ring-purple-400/80 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          style={{
                            background: getHeatColor(errorCount),
                            outline: isSelected ? '2px solid #c084fc' : undefined,
                            outlineOffset: 1,
                          }}
                        />
                      );
                    })}
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* GitHub-style legend — bottom right */}
            <div className="flex items-center justify-end gap-1.5 mt-5 text-[11px] text-gray-500 font-sans">
              <span>Less</span>
              {HEAT_LEVELS.map((level) => (
                <div
                  key={level.min}
                  className="rounded-[3px] border border-[#30363d]"
                  style={{
                    width: 14,
                    height: 14,
                    background: level.color,
                  }}
                  title={level.min === 0 ? '0 errors' : `${level.min}+ errors`}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        )}
      </div>

      {selectedCell && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedCell(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-gray-700 bg-gray-950 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/80">
              <div>
                <h4 className="text-sm font-semibold text-gray-100 flex items-center gap-2 font-sans">
                  <AlertCircle size={16} className="text-red-400" />
                  Errors at {selectedCell.hour.toString().padStart(2, '0')}:00
                </h4>
                <p className="text-xs text-gray-500 mt-0.5 font-sans">
                  {selectedCell.day} · {selectedCell.errorCount} error{selectedCell.errorCount !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 theme-scrollbar">
              {selectedCell.errorCount === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8 font-sans">No errors in this hour.</p>
              ) : matchingLogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8 font-sans">
                  {selectedCell.errorCount} error(s) recorded.
                </p>
              ) : (
                matchingLogs.slice(0, 50).map((log, i) => (
                  <div
                    key={`${log.timestamp}-${i}`}
                    className="rounded-lg border border-gray-800 bg-gray-900/60 p-3 text-left"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25 font-sans">
                        {normalizeLevel(log.level)}
                      </span>
                      <span className="text-[11px] text-gray-500 font-sans">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-mono leading-relaxed break-words">{log.message}</p>
                  </div>
                ))
              )}
              {matchingLogs.length > 50 && (
                <p className="text-xs text-gray-500 text-center font-sans">
                  Showing 50 of {matchingLogs.length} errors
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ErrorHeatmap;
