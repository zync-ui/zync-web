/**
 * mockDashboardData.ts — Complete mock dataset for the ZYNC LOG Analytics Dashboard.
 *
 * Provides realistic sample data for every dashboard panel so the UI renders
 * fully without a running .NET backend. When the real API is connected, only
 * the USE_MOCK_DATA flag in dashboardService.ts needs to be set to false.
 */

import type {
  MockDashboardData,
  HeatmapCell,
  LogVolumePoint,
} from '../types/dashboardTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Helper — build heatmap grid (N days × 24 hours)
// ─────────────────────────────────────────────────────────────────────────────

/** Generates a realistic heatmap with error clusters during business hours */
const buildHeatmapData = (): HeatmapCell[] => {
  const days = ['Jun 20', 'Jun 21', 'Jun 22', 'Jun 23', 'Jun 24', 'Jun 25'];
  const cells: HeatmapCell[] = [];

  const peakHours = [9, 10, 11, 14, 15, 16];
  const errorSpikes: Record<string, number[]> = {
    'Jun 21': [10, 11],
    'Jun 24': [14, 15, 16],
  };

  days.forEach((day) => {
    for (let hour = 0; hour < 24; hour++) {
      let errorCount = 0;

      if (hour >= 6 && hour <= 22) {
        const isBusinessHour = peakHours.includes(hour);
        const isSpikeHour = errorSpikes[day]?.includes(hour) ?? false;

        if (isSpikeHour) {
          errorCount = Math.floor(Math.random() * 60) + 30;
        } else if (isBusinessHour) {
          errorCount = Math.floor(Math.random() * 20) + 2;
        } else {
          errorCount = Math.floor(Math.random() * 8);
        }
      } else {
        errorCount = Math.random() < 0.15 ? Math.floor(Math.random() * 3) : 0;
      }

      cells.push({ day, hour, errorCount });
    }
  });

  return cells;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper — build 24-hour log volume series
// ─────────────────────────────────────────────────────────────────────────────

/** Generates realistic hourly log volume across a full workday */
const buildLogVolumeByHour = (): LogVolumePoint[] => {
  const hours: LogVolumePoint[] = [];

  for (let hourIndex = 0; hourIndex < 24; hourIndex++) {
    const hourLabel = `${String(hourIndex).padStart(2, '0')}:00`;
    let total = 0;
    let errors = 0;
    let warnings = 0;

    if (hourIndex >= 9 && hourIndex <= 17) {
      total    = Math.floor(Math.random() * 800) + 300;
      errors   = Math.floor(Math.random() * 30)  + 5;
      warnings = Math.floor(Math.random() * 60)  + 20;
    } else if (hourIndex >= 6 && hourIndex < 9) {
      total    = Math.floor(Math.random() * 300) + 50;
      errors   = Math.floor(Math.random() * 10);
      warnings = Math.floor(Math.random() * 20);
    } else if (hourIndex > 17 && hourIndex <= 22) {
      total    = Math.floor(Math.random() * 200) + 30;
      errors   = Math.floor(Math.random() * 8);
      warnings = Math.floor(Math.random() * 15);
    } else {
      total    = Math.floor(Math.random() * 30) + 2;
      errors   = Math.random() < 0.2 ? Math.floor(Math.random() * 3) : 0;
      warnings = Math.random() < 0.3 ? Math.floor(Math.random() * 5) : 0;
    }

    hours.push({ hour: hourLabel, total, errors, warnings });
  }

  return hours;
};

// ─────────────────────────────────────────────────────────────────────────────
// Exported mock dataset
// ─────────────────────────────────────────────────────────────────────────────

export const mockDashboardData: MockDashboardData = {
  // ── Summary KPIs ──────────────────────────────────────────────────────────
  summary: {
    totalLines:          15420,
    totalErrors:         347,
    totalWarnings:       892,
    firstLogTime:        '2026-06-20T09:00:00',
    lastLogTime:         '2026-06-20T23:58:00',
    errorTrendPercent:   +12.4,
    warningTrendPercent: -3.2,
    lineTrendPercent:    +5.8,
  },

  // ── Hourly volume for AreaChart ───────────────────────────────────────────
  logVolumeByHour: buildLogVolumeByHour(),

  // ── Donut slices ──────────────────────────────────────────────────────────
  logLevelDistribution: [
    { level: 'INFO',    count: 12800, percentage: 83.0, color: '#4A9EFF' },
    { level: 'WARNING', count: 892,   percentage: 5.8,  color: '#F0A500' },
    { level: 'ERROR',   count: 347,   percentage: 2.2,  color: '#E5484D' },
    { level: 'DEBUG',   count: 1350,  percentage: 8.8,  color: '#555577' },
    { level: 'FATAL',   count: 31,    percentage: 0.2,  color: '#9B1C1C' },
  ],

  // ── Top 10 error messages ─────────────────────────────────────────────────
  topErrors: [
    { rank: 1,  message: 'NullReferenceException in UserService.GetUser()',                      count: 89 },
    { rank: 2,  message: 'Database connection timeout after 30s on primary pool',               count: 67 },
    { rank: 3,  message: 'Unhandled exception: Object reference not set to an instance',        count: 54 },
    { rank: 4,  message: 'HTTP 500 — PaymentController.ProcessPayment failed',                  count: 41 },
    { rank: 5,  message: 'Redis cache miss exceeded threshold: 85% miss rate',                  count: 38 },
    { rank: 6,  message: 'JWT token validation failed: signature mismatch',                     count: 29 },
    { rank: 7,  message: 'OrderService: Stock reservation deadlock detected',                   count: 22 },
    { rank: 8,  message: 'Email delivery failed: SMTP connection refused port 587',             count: 17 },
    { rank: 9,  message: 'Rate limit exceeded for /api/search endpoint',                        count: 14 },
    { rank: 10, message: 'FileNotFoundException: config/appsettings.prod.json',                 count: 9  },
  ],

  // ── Top 8 noisiest modules ────────────────────────────────────────────────
  topModules: [
    { module: 'UserController',   count: 3420 },
    { module: 'OrderService',     count: 2870 },
    { module: 'PaymentGateway',   count: 2240 },
    { module: 'AuthMiddleware',   count: 1890 },
    { module: 'ProductCatalog',   count: 1650 },
    { module: 'NotificationSvc',  count: 1120 },
    { module: 'ReportingEngine',  count: 890  },
    { module: 'BackgroundWorker', count: 680  },
  ],

  // ── Latest 10 critical log entries ────────────────────────────────────────
  recentCriticalErrors: [
    { lineNumber: 15410, level: 'ERROR', timestamp: '23:58:02', message: 'Database connection timeout after 30s on primary connection pool' },
    { lineNumber: 15389, level: 'FATAL', timestamp: '23:55:44', message: 'Unhandled exception caused worker process to crash — restarting' },
    { lineNumber: 15301, level: 'ERROR', timestamp: '23:47:12', message: 'NullReferenceException in UserService.GetUser() at line 142' },
    { lineNumber: 15280, level: 'ERROR', timestamp: '23:44:09', message: 'HTTP 500 returned for POST /api/payment/process (requestId: abc123)' },
    { lineNumber: 15142, level: 'ERROR', timestamp: '23:31:55', message: 'Redis SETEX failed: connection reset by peer (errno: ECONNRESET)' },
    { lineNumber: 14982, level: 'ERROR', timestamp: '23:20:30', message: 'JWT signature validation failed — possible token tampering detected' },
    { lineNumber: 14850, level: 'FATAL', timestamp: '23:11:18', message: 'Out of memory exception: heap allocation failed for 512MB request' },
    { lineNumber: 14701, level: 'ERROR', timestamp: '23:02:44', message: 'Order deadlock on table [dbo].[Reservations] — rolled back' },
    { lineNumber: 14590, level: 'ERROR', timestamp: '22:54:01', message: 'Email SMTP connection refused on port 587 (host: mail.example.com)' },
    { lineNumber: 14401, level: 'ERROR', timestamp: '22:40:17', message: 'Rate limit exceeded: /api/search called 1200x/min by IP 192.168.1.45' },
  ],

  // ── Heatmap grid ──────────────────────────────────────────────────────────
  heatmapData: buildHeatmapData(),
};
