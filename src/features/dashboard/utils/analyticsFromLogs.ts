/**
 * Client-side analytics computed from already-loaded log entries.
 * Instant — no API round-trips; always reflects the selected date's logs.
 */

import type { LogEntry } from '../../../services/logService';
import { LEVEL_COLORS } from '../config/chartConfig';
import type {
  DashboardSummary,
  LogVolumePoint,
  LogLevelEntry,
  TopErrorItem,
  TopModuleItem,
  CriticalLogEntry,
  HeatmapCell,
} from '../types/dashboardTypes';

type CanonicalLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG' | 'FATAL';

const normalizeLevel = (raw: string): CanonicalLevel => {
  const u = raw.toUpperCase();
  if (u === 'ERR' || u === 'ERROR') return 'ERROR';
  if (u === 'WRN' || u === 'WARN' || u === 'WARNING') return 'WARNING';
  if (u === 'DBG' || u === 'DEBUG') return 'DEBUG';
  if (u === 'FTL' || u === 'FATAL') return 'FATAL';
  return 'INFO';
};

const parseTime = (ts: string): Date | null => {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toLocalDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatHour = (d: Date): string =>
  `${String(d.getHours()).padStart(2, '0')}:00`;

const formatDayLabel = (d: Date): string =>
  d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

const normalizeDateKey = (raw: string): string => {
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
};

export interface DashboardAnalytics {
  summary: DashboardSummary;
  logVolumeByHour: LogVolumePoint[];
  logLevelDistribution: LogLevelEntry[];
  topErrors: TopErrorItem[];
  topModules: TopModuleItem[];
  recentCriticalErrors: CriticalLogEntry[];
  heatmapData: HeatmapCell[];
}

export interface ComputeOptions {
  selectedDate?: string;
}

/** Build full dashboard dataset from in-memory logs (selected date only). */
export function computeAnalyticsFromLogs(
  logs: LogEntry[],
  options: ComputeOptions = {}
): DashboardAnalytics {
  const { selectedDate } = options;

  // Logs are already loaded for selectedDate via the log viewer stream.
  const filtered = logs;

  const total = filtered.length;
  const timestamps = filtered
    .map((l) => parseTime(l.timestamp))
    .filter((d): d is Date => d !== null);

  const firstTime = timestamps.length ? new Date(Math.min(...timestamps.map((d) => d.getTime()))) : new Date();
  const lastTime = timestamps.length ? new Date(Math.max(...timestamps.map((d) => d.getTime()))) : new Date();

  let errorCount = 0;
  let warningCount = 0;
  const levelCounts: Record<CanonicalLevel, number> = {
    INFO: 0, WARNING: 0, ERROR: 0, DEBUG: 0, FATAL: 0,
  };

  const hourBuckets = new Map<string, { total: number; errors: number; warnings: number }>();
  const heatmapMap = new Map<string, number>();
  const daysInLogs = new Map<string, string>();
  const errorMessages = new Map<string, number>();
  const moduleCounts = new Map<string, number>();
  const criticalEntries: CriticalLogEntry[] = [];

  filtered.forEach((log, index) => {
    const level = normalizeLevel(log.level);
    levelCounts[level]++;

    if (level === 'ERROR') errorCount++;
    if (level === 'WARNING') warningCount++;

    const d = parseTime(log.timestamp);
    if (d) {
      const dayKey = toLocalDateKey(d);
      daysInLogs.set(dayKey, formatDayLabel(d));

      const hourKey = formatHour(d);
      const bucket = hourBuckets.get(hourKey) ?? { total: 0, errors: 0, warnings: 0 };
      bucket.total++;
      if (level === 'ERROR' || level === 'FATAL') bucket.errors++;
      if (level === 'WARNING') bucket.warnings++;
      hourBuckets.set(hourKey, bucket);

      if (level === 'ERROR' || level === 'FATAL') {
        const heatKey = `${dayKey}|${d.getHours()}`;
        heatmapMap.set(heatKey, (heatmapMap.get(heatKey) ?? 0) + 1);
      }
    }

    if (level === 'ERROR' || level === 'FATAL') {
      const msg = log.message?.trim() || '(empty message)';
      errorMessages.set(msg, (errorMessages.get(msg) ?? 0) + 1);

      criticalEntries.push({
        lineNumber: index + 1,
        level,
        timestamp: d
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
          : '—',
        message: log.message,
      });
    }

    const module = log.sourceContext?.split('.').pop() || log.serviceName;
    if (module && module !== 'Unknown') {
      moduleCounts.set(module, (moduleCounts.get(module) ?? 0) + 1);
    }
  });

  const summary: DashboardSummary = {
    totalLines: total,
    totalErrors: errorCount,
    totalWarnings: warningCount,
    firstLogTime: firstTime.toISOString(),
    lastLogTime: lastTime.toISOString(),
    errorTrendPercent: 0,
    warningTrendPercent: 0,
    lineTrendPercent: 0,
  };

  // Always emit all 24 hours so the chart x-axis and peak marker are accurate
  const logVolumeByHour: LogVolumePoint[] = Array.from({ length: 24 }, (_, h) => {
    const hourKey = `${String(h).padStart(2, '0')}:00`;
    const b = hourBuckets.get(hourKey) ?? { total: 0, errors: 0, warnings: 0 };
    return { hour: hourKey, total: b.total, errors: b.errors, warnings: b.warnings };
  });

  const displayOrder: CanonicalLevel[] = ['INFO', 'WARNING', 'ERROR', 'DEBUG', 'FATAL'];
  const logLevelDistribution: LogLevelEntry[] = displayOrder
    .map((level) => ({
      level,
      count: levelCounts[level],
      percentage: total > 0 ? Math.round((levelCounts[level] / total) * 1000) / 10 : 0,
      color: LEVEL_COLORS[level],
    }))
    .filter((e) => e.count > 0);

  const topErrors: TopErrorItem[] = Array.from(errorMessages.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([message, count], idx) => ({ rank: idx + 1, message, count }));

  const topModules: TopModuleItem[] = Array.from(moduleCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([module, count]) => ({ module, count }));

  const recentCriticalErrors = criticalEntries
    .slice()
    .reverse()
    .slice(0, 10);

  // Ensure selected date appears even if no parseable timestamps
  if (selectedDate) {
    const normalized = normalizeDateKey(selectedDate);
    const parsed = parseTime(`${normalized}T12:00:00`);
    if (parsed) {
      daysInLogs.set(normalized, formatDayLabel(parsed));
    }
  }

  const sortedDayKeys = Array.from(daysInLogs.keys()).sort();
  const heatmapData: HeatmapCell[] = [];

  sortedDayKeys.forEach((dayKey) => {
    const day = daysInLogs.get(dayKey) ?? dayKey;
    for (let h = 0; h < 24; h++) {
      heatmapData.push({
        day,
        dayKey,
        hour: h,
        errorCount: heatmapMap.get(`${dayKey}|${h}`) ?? 0,
      });
    }
  });

  return {
    summary,
    logVolumeByHour,
    logLevelDistribution,
    topErrors,
    topModules,
    recentCriticalErrors,
    heatmapData,
  };
}

/** Find first log index matching an error message (for scroll-to from Top Errors). */
export function findLogIndexByMessage(logs: LogEntry[], message: string): number {
  const needle = message.toLowerCase();
  return logs.findIndex((log) => log.message?.toLowerCase().includes(needle));
}
