/**
 * DashboardPage.tsx — Log Analytics Dashboard (theme matches LogDashboard / Zync log viewer).
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart2,
  ChevronLeft,
  RefreshCw,
  FileText,
  XCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';

import zyncLogo from '../../assets/zync-logo.png';
import { cn } from '../../lib/utils';
import SummaryCard from './SummaryCard';
import LogVolumeChart from './LogVolumeChart';
import LogLevelDonutChart from './LogLevelDonutChart';
import TopErrorsList from './TopErrorsList';
import TopModulesChart from './TopModulesChart';
import RecentCriticalFeed from './RecentCriticalFeed';
import ErrorHeatmap from './ErrorHeatmap';
import { CHART_COLORS } from './config/chartConfig';

import {
  useGetSummaryQuery,
  useGetLogVolumeQuery,
  useGetLevelDistributionQuery,
  useGetTopErrorsQuery,
  useGetTopModulesQuery,
  useGetRecentCriticalQuery,
  useGetHeatmapQuery,
} from './services/dashboardService';

import type { TimeRange } from './types/dashboardTypes';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '1h',  label: 'Last 1 Hour'   },
  { value: '6h',  label: 'Last 6 Hours'  },
  { value: '24h', label: 'Last 24 Hours' },
  { value: 'all', label: 'All Time'      },
];

const formatTimeRange = (first: string, last: string): string => {
  const toTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${toTime(first)} – ${toTime(last)}`;
};

interface LocationState {
  filePath?: string;
  sourceType?: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const routeState = (location.state ?? {}) as LocationState;
  const filePath =
    routeState.filePath ??
    localStorage.getItem('logSourceLocalPath') ??
    localStorage.getItem('logSourcePath') ??
    '';

  const [timeRange, setTimeRange]         = useState<TimeRange>('all');
  const [isRefreshing, setIsRefreshing]   = useState(false);
  const [lastUpdated, setLastUpdated]     = useState<Date>(new Date());

  const queryArgs = { filePath, timeRange };

  const summaryResult    = useGetSummaryQuery(queryArgs, { skip: !filePath });
  const volumeResult     = useGetLogVolumeQuery(queryArgs, { skip: !filePath });
  const levelResult      = useGetLevelDistributionQuery(queryArgs, { skip: !filePath });
  const topErrorsResult  = useGetTopErrorsQuery({ filePath }, { skip: !filePath });
  const topModulesResult = useGetTopModulesQuery({ filePath }, { skip: !filePath });
  const criticalResult   = useGetRecentCriticalQuery({ filePath }, { skip: !filePath });
  const heatmapResult    = useGetHeatmapQuery({ filePath }, { skip: !filePath });

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    summaryResult.refetch();
    volumeResult.refetch();
    levelResult.refetch();
    topErrorsResult.refetch();
    topModulesResult.refetch();
    criticalResult.refetch();
    heatmapResult.refetch();
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 650);
  }, [
    summaryResult, volumeResult, levelResult,
    topErrorsResult, topModulesResult, criticalResult, heatmapResult,
  ]);

  useEffect(() => {
    if (!filePath) return;
    summaryResult.refetch();
    volumeResult.refetch();
    levelResult.refetch();
  }, [timeRange, filePath]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = summaryResult.data;

  return (
    <div className="min-h-screen bg-brand-bg text-gray-100 font-sans theme-scrollbar">
      {/* ── Header (matches LogDashboard toolbar) ── */}
      <header className="sticky top-0 z-30 bg-brand-bg/90 backdrop-blur-md border-b border-gray-800 shadow-md shadow-black/20">
        <div className="flex flex-wrap items-center gap-3 px-6 h-[60px]">
          <button
            onClick={() => navigate('/')}
            className={cn(
              'flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl',
              'border border-gray-700/60 bg-gray-900/60 text-cyan-300',
              'hover:border-cyan-500/40 hover:text-cyan-200 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all'
            )}
          >
            <ChevronLeft size={15} />
            <span className="hidden sm:inline">Back to Logs</span>
          </button>

          <div className="flex items-center gap-3">
            <img src={zyncLogo} alt="Zync log" className="h-9 w-auto" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-primary/15 border border-brand-primary/25">
                <BarChart2 size={16} className="text-brand-secondary" />
              </div>
              <h1 className="font-michroma text-lg text-gray-100 tracking-tight">
                Log <span className="text-brand-secondary">Analytics</span>
              </h1>
            </div>
          </div>

          <div className="flex-1" />

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className={cn(
              'text-xs rounded-xl px-3 py-2 focus:outline-none transition-all cursor-pointer',
              'bg-gray-900 border border-blue-500/30 text-blue-200',
              'hover:border-blue-400/50 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30'
            )}
          >
            {TIME_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <span className="text-xs hidden md:block text-gray-500 tabular-nums">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>

          <button
            onClick={handleRefresh}
            disabled={!filePath}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
              'bg-gradient-to-r from-indigo-950/80 via-brand-primary/40 to-indigo-950/80',
              'border border-brand-primary/40 text-indigo-200',
              'hover:border-brand-secondary/50 hover:shadow-[0_0_20px_rgba(67,56,202,0.25)]',
              !filePath && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin-once' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <main className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto theme-scrollbar">
        {!filePath && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Configure a log source on the Log Viewer page, then open the dashboard again.
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Log Lines"
            value={summary?.totalLines ?? 0}
            icon={<FileText size={16} />}
            color={CHART_COLORS.primary}
            trendPercent={summary?.lineTrendPercent}
            delay={0}
          />
          <SummaryCard
            title="Total Errors"
            value={summary?.totalErrors ?? 0}
            icon={<XCircle size={16} />}
            color={CHART_COLORS.error}
            trendPercent={summary?.errorTrendPercent}
            delay={100}
          />
          <SummaryCard
            title="Total Warnings"
            value={summary?.totalWarnings ?? 0}
            icon={<AlertTriangle size={16} />}
            color={CHART_COLORS.warning}
            trendPercent={summary?.warningTrendPercent}
            delay={200}
          />
          <SummaryCard
            title="Time Range Covered"
            value={summary ? formatTimeRange(summary.firstLogTime, summary.lastLogTime) : '—'}
            icon={<Clock size={16} />}
            color={CHART_COLORS.secondary}
            subtitle={
              summary
                ? `${new Date(summary.firstLogTime).toLocaleDateString()} — ${new Date(summary.lastLogTime).toLocaleDateString()}`
                : undefined
            }
            delay={300}
            isText
          />
        </section>

        <section className="flex flex-col xl:flex-row gap-4">
          <div className="xl:w-[60%]">
            <LogVolumeChart data={volumeResult.data} loading={volumeResult.isLoading} />
          </div>
          <div className="xl:w-[40%]">
            <LogLevelDonutChart data={levelResult.data} loading={levelResult.isLoading} />
          </div>
        </section>

        <section className="flex flex-col xl:flex-row gap-4">
          <div className="xl:w-[40%]">
            <TopErrorsList
              data={topErrorsResult.data}
              loading={topErrorsResult.isLoading}
              onErrorFilter={(message) => navigate('/', { state: { filterMessage: message } })}
            />
          </div>
          <div className="xl:w-[30%]">
            <TopModulesChart data={topModulesResult.data} loading={topModulesResult.isLoading} />
          </div>
          <div className="xl:w-[30%]">
            <RecentCriticalFeed
              data={criticalResult.data}
              loading={criticalResult.isLoading}
              onJumpToLine={(lineNumber) => navigate('/', { state: { jumpToLine: lineNumber } })}
            />
          </div>
        </section>

        <section>
          <ErrorHeatmap data={heatmapResult.data} loading={heatmapResult.isLoading} />
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
