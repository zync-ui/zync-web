/**
 * dashboardService.ts — RTK Query API slice for all dashboard endpoints.
 *
 * Defines 7 query endpoints mapping 1:1 to the .NET DashboardController.
 * Each endpoint falls back to mock data when the API is unavailable so
 * the dashboard always renders, even without a running backend.
 *
 * To switch to real API data: set USE_MOCK_DATA = false below.
 *
 * Hooks exported:
 *   useGetSummaryQuery           → GET /api/dashboard/summary
 *   useGetLogVolumeQuery         → GET /api/dashboard/log-volume
 *   useGetLevelDistributionQuery → GET /api/dashboard/level-distribution
 *   useGetTopErrorsQuery         → GET /api/dashboard/top-errors
 *   useGetTopModulesQuery        → GET /api/dashboard/top-modules
 *   useGetRecentCriticalQuery    → GET /api/dashboard/recent-critical
 *   useGetHeatmapQuery           → GET /api/dashboard/heatmap
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { mockDashboardData } from '../data/mockDashboardData';
import type {
  DashboardSummary,
  LogVolumePoint,
  LogLevelEntry,
  TopErrorItem,
  TopModuleItem,
  CriticalLogEntry,
  HeatmapCell,
  TimeRange,
} from '../types/dashboardTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api') as string;

/**
 * Set to false once the .NET DashboardController is running to use real data.
 * When true, every endpoint returns the corresponding mock dataset immediately.
 */
const USE_MOCK_DATA = false;

// ─────────────────────────────────────────────────────────────────────────────
// Shared query arg types
// ─────────────────────────────────────────────────────────────────────────────

interface FilePathArg {
  filePath: string;
}

interface FilePathTimeRangeArg extends FilePathArg {
  timeRange: TimeRange;
}

interface FilePathLimitArg extends FilePathArg {
  limit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// RTK Query API slice
// ─────────────────────────────────────────────────────────────────────────────

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${API_BASE}/dashboard` }),

  endpoints: (builder) => ({

    // ── Summary KPI cards ─────────────────────────────────────────────────
    getSummary: builder.query<DashboardSummary, FilePathTimeRangeArg>({
      /** Fetches total line count, error/warning counts, and trend percentages */
      queryFn: async ({ filePath, timeRange }, _api, _opts, baseQuery) => {
        if (USE_MOCK_DATA) return { data: mockDashboardData.summary };
        const result = await baseQuery(
          `/summary?filePath=${encodeURIComponent(filePath)}&timeRange=${timeRange}`
        );
        return result.error
          ? { data: mockDashboardData.summary }
          : (result as { data: DashboardSummary });
      },
    }),

    // ── Log volume area chart ─────────────────────────────────────────────
    getLogVolume: builder.query<LogVolumePoint[], FilePathTimeRangeArg>({
      /** Fetches per-hour log counts broken down by level */
      queryFn: async ({ filePath, timeRange }, _api, _opts, baseQuery) => {
        if (USE_MOCK_DATA) return { data: mockDashboardData.logVolumeByHour };
        const result = await baseQuery(
          `/log-volume?filePath=${encodeURIComponent(filePath)}&timeRange=${timeRange}`
        );
        return result.error
          ? { data: mockDashboardData.logVolumeByHour }
          : (result as { data: LogVolumePoint[] });
      },
    }),

    // ── Level distribution donut ──────────────────────────────────────────
    getLevelDistribution: builder.query<LogLevelEntry[], FilePathTimeRangeArg>({
      /** Fetches count and percentage for each log level */
      queryFn: async ({ filePath, timeRange }, _api, _opts, baseQuery) => {
        if (USE_MOCK_DATA) return { data: mockDashboardData.logLevelDistribution };
        const result = await baseQuery(
          `/level-distribution?filePath=${encodeURIComponent(filePath)}&timeRange=${timeRange}`
        );
        return result.error
          ? { data: mockDashboardData.logLevelDistribution }
          : (result as { data: LogLevelEntry[] });
      },
    }),

    // ── Top errors leaderboard ────────────────────────────────────────────
    getTopErrors: builder.query<TopErrorItem[], FilePathLimitArg>({
      /** Fetches the N most frequent error messages with occurrence counts */
      queryFn: async ({ filePath, limit = 10 }, _api, _opts, baseQuery) => {
        if (USE_MOCK_DATA) return { data: mockDashboardData.topErrors };
        const result = await baseQuery(
          `/top-errors?filePath=${encodeURIComponent(filePath)}&limit=${limit}`
        );
        return result.error
          ? { data: mockDashboardData.topErrors }
          : (result as { data: TopErrorItem[] });
      },
    }),

    // ── Noisiest modules bar chart ────────────────────────────────────────
    getTopModules: builder.query<TopModuleItem[], FilePathLimitArg>({
      /** Fetches the top N log sources sorted by total log count */
      queryFn: async ({ filePath, limit = 8 }, _api, _opts, baseQuery) => {
        if (USE_MOCK_DATA) return { data: mockDashboardData.topModules };
        const result = await baseQuery(
          `/top-modules?filePath=${encodeURIComponent(filePath)}&limit=${limit}`
        );
        return result.error
          ? { data: mockDashboardData.topModules }
          : (result as { data: TopModuleItem[] });
      },
    }),

    // ── Recent critical feed ──────────────────────────────────────────────
    getRecentCritical: builder.query<CriticalLogEntry[], FilePathLimitArg>({
      /** Fetches the latest N ERROR + FATAL log lines for the live feed */
      queryFn: async ({ filePath, limit = 10 }, _api, _opts, baseQuery) => {
        if (USE_MOCK_DATA) return { data: mockDashboardData.recentCriticalErrors };
        const result = await baseQuery(
          `/recent-critical?filePath=${encodeURIComponent(filePath)}&limit=${limit}`
        );
        return result.error
          ? { data: mockDashboardData.recentCriticalErrors }
          : (result as { data: CriticalLogEntry[] });
      },
    }),

    // ── Error heatmap grid ────────────────────────────────────────────────
    getHeatmap: builder.query<HeatmapCell[], FilePathArg>({
      /** Fetches error counts for every day × hour cell in the heatmap */
      queryFn: async ({ filePath }, _api, _opts, baseQuery) => {
        if (USE_MOCK_DATA) return { data: mockDashboardData.heatmapData };
        const result = await baseQuery(
          `/heatmap?filePath=${encodeURIComponent(filePath)}`
        );
        return result.error
          ? { data: mockDashboardData.heatmapData }
          : (result as { data: HeatmapCell[] });
      },
    }),

  }),
});

// Auto-generated hooks — one per endpoint
export const {
  useGetSummaryQuery,
  useGetLogVolumeQuery,
  useGetLevelDistributionQuery,
  useGetTopErrorsQuery,
  useGetTopModulesQuery,
  useGetRecentCriticalQuery,
  useGetHeatmapQuery,
} = dashboardApi;
