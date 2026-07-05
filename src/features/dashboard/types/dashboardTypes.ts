/**
 * dashboardTypes.ts — Shared TypeScript interfaces for the dashboard feature.
 *
 * All dashboard components and services reference these types so there
 * is a single source of truth for every data shape.
 */

// ─────────────────────────────────────────────────────────────────────────────
// API / Mock data shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalLines: number;
  totalErrors: number;
  totalWarnings: number;
  firstLogTime: string;   // ISO 8601
  lastLogTime: string;    // ISO 8601
  errorTrendPercent: number;
  warningTrendPercent: number;
  lineTrendPercent: number;
}

export interface LogVolumePoint {
  hour: string;      // "HH:mm" label
  total: number;
  errors: number;
  warnings: number;
}

export interface LogLevelEntry {
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG' | 'FATAL';
  count: number;
  percentage: number;
  color: string;     // Hex color for this level
}

export interface TopErrorItem {
  rank: number;
  message: string;
  count: number;
}

export interface TopModuleItem {
  module: string;
  count: number;
}

export interface CriticalLogEntry {
  lineNumber: number;
  level: 'ERROR' | 'FATAL';
  timestamp: string; // "HH:mm:ss"
  message: string;
}

export interface HeatmapCell {
  day: string;       // e.g. "Jun 20"
  dayKey?: string;   // YYYY-MM-DD for sorting
  hour: number;      // 0 – 23
  errorCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composite mock data shape
// ─────────────────────────────────────────────────────────────────────────────

export interface MockDashboardData {
  summary: DashboardSummary;
  logVolumeByHour: LogVolumePoint[];
  logLevelDistribution: LogLevelEntry[];
  topErrors: TopErrorItem[];
  topModules: TopModuleItem[];
  recentCriticalErrors: CriticalLogEntry[];
  heatmapData: HeatmapCell[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Time range option type
// ─────────────────────────────────────────────────────────────────────────────

export type TimeRange = '1h' | '6h' | '24h' | 'all';
