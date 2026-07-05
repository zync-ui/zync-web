/**
 * chartConfig.ts — Shared theme + Recharts config for the analytics dashboard.
 * Colors and typography match the Zync log viewer (LogDashboard).
 */

import type { CSSProperties } from 'react';

// ── Log viewer brand palette ────────────────────────────────────────────────

export const CHART_COLORS = {
  bg:           '#0B0F1A',
  surface:      '#0B0F1A',
  card:         'rgba(17, 24, 39, 0.55)',
  cardSolid:    '#111827',
  border:       '#1f2937',
  borderAccent: 'rgba(6, 182, 212, 0.25)',
  primary:      '#4338ca',
  secondary:    '#06b6d4',
  muted:        '#6b7280',
  textPrimary:  '#f3f4f6',
  textSecondary:'#06b6d4',
  textMuted:    '#9ca3af',
  error:        '#ef4444',
  warning:      '#f59e0b',
  success:      '#10b981',
  info:         '#3b82f6',
  debug:        '#a855f7',
  fatal:        '#f97316',
} as const;

/** Panel wrapper style used across all dashboard cards */
export const panelStyle: CSSProperties = {
  background:   CHART_COLORS.card,
  border:       `1px solid ${CHART_COLORS.border}`,
  backdropFilter: 'blur(8px)',
};

/** Maps log level strings to display colors (matches LogEntryRow) */
export const LEVEL_COLORS: Record<string, string> = {
  INFO:    CHART_COLORS.info,
  WARNING: CHART_COLORS.warning,
  ERROR:   CHART_COLORS.error,
  DEBUG:   CHART_COLORS.debug,
  FATAL:   CHART_COLORS.fatal,
};

export const ANIMATION_DURATION = 800;

export const AXIS_TICK_STYLE: CSSProperties = {
  fill: CHART_COLORS.textMuted,
  fontSize: 11,
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
};

export const GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: '#374151',
  vertical: false,
} as const;

export const TOOLTIP_CONTENT_STYLE: CSSProperties = {
  backgroundColor: CHART_COLORS.cardSolid,
  border: `1px solid ${CHART_COLORS.borderAccent}`,
  borderRadius: '12px',
  padding: '10px 14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

export const GRADIENT_IDS = {
  volumeArea: 'volumeAreaGradient',
  primaryBar: 'primaryBarGradient',
} as const;
