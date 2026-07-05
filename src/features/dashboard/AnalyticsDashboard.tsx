/**
 * AnalyticsDashboard — In-app analytics overlay (no separate route).
 * Accepts precomputed analytics for instant open.
 */

import React from 'react';
import {
  BarChart2,
  ChevronLeft,
  FileText,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from 'lucide-react';

import type { LogEntry } from '../../services/logService';
import { cn } from '../../lib/utils';
import SummaryCard from './SummaryCard';
import LogVolumeChart from './LogVolumeChart';
import LogLevelDonutChart from './LogLevelDonutChart';
import TopErrorsList from './TopErrorsList';
import TopModulesChart from './TopModulesChart';
import RecentCriticalFeed from './RecentCriticalFeed';
import ErrorHeatmap from './ErrorHeatmap';
import { CHART_COLORS } from './config/chartConfig';
import type { DashboardAnalytics } from './utils/analyticsFromLogs';

export interface AnalyticsDashboardProps {
  logs: LogEntry[];
  selectedDate: string;
  analytics: DashboardAnalytics | null;
  computing?: boolean;
  onBack: () => void;
  onFilterByError: (message: string) => void;
  onJumpToLogIndex: (index: number) => void;
}

const formatTimeRange = (first: string, last: string): string => {
  const toTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${toTime(first)} – ${toTime(last)}`;
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  logs,
  selectedDate,
  analytics,
  computing = false,
  onBack,
  onFilterByError,
  onJumpToLogIndex,
}) => {
  const dateLabel = selectedDate || 'No date selected';

  if (logs.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-brand-bg flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-gray-400 font-sans">Load logs for a date first, then open analytics.</p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700 text-cyan-300 hover:border-cyan-500/40"
        >
          <ChevronLeft size={16} /> Back to Logs
        </button>
      </div>
    );
  }

  const summary = analytics?.summary;

  return (
    <div className="fixed inset-0 z-[60] bg-brand-bg text-gray-100 font-sans theme-scrollbar overflow-y-auto">
      <header className="sticky top-0 z-30 bg-brand-bg/90 backdrop-blur-md border-b border-gray-800 shadow-md shadow-black/20">
        <div className="flex flex-wrap items-center gap-3 px-6 h-[60px]">
          <button
            onClick={onBack}
            className={cn(
              'flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl',
              'border border-gray-700/60 bg-gray-900/60 text-cyan-300',
              'hover:border-cyan-500/40 hover:text-cyan-200 transition-all'
            )}
          >
            <ChevronLeft size={15} />
            <span>Back to Logs</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-primary/15 border border-brand-primary/25">
              <BarChart2 size={16} className="text-brand-secondary" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-100 tracking-tight leading-tight">
                Log <span className="text-brand-secondary">Analytics</span>
              </h1>
              <p className="text-[11px] text-gray-500 font-sans">
                {dateLabel}
                {summary ? ` · ${summary.totalLines.toLocaleString()} logs` : computing ? ' · computing…' : ''}
              </p>
            </div>
          </div>

          {computing && !analytics && (
            <Loader2 size={16} className="ml-auto animate-spin text-cyan-400" />
          )}
        </div>
      </header>

      {!analytics ? (
        <div className="flex flex-col items-center justify-center gap-3 py-32 text-gray-500">
          <Loader2 size={32} className="animate-spin text-cyan-400" />
          <p className="text-sm font-sans">Building analytics…</p>
        </div>
      ) : (
        <main className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto">
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard title="Total Log Lines" value={summary!.totalLines} icon={<FileText size={16} />} color={CHART_COLORS.primary} instant />
            <SummaryCard title="Total Errors" value={summary!.totalErrors} icon={<XCircle size={16} />} color={CHART_COLORS.error} instant />
            <SummaryCard title="Total Warnings" value={summary!.totalWarnings} icon={<AlertTriangle size={16} />} color={CHART_COLORS.warning} instant />
            <SummaryCard
              title="Time Range Covered"
              value={formatTimeRange(summary!.firstLogTime, summary!.lastLogTime)}
              icon={<Clock size={16} />}
              color={CHART_COLORS.secondary}
              subtitle={`${new Date(summary!.firstLogTime).toLocaleDateString()} — ${new Date(summary!.lastLogTime).toLocaleDateString()}`}
              isText
              instant
            />
          </section>

          <section className="flex flex-col xl:flex-row gap-4">
            <div className="xl:w-[60%]">
              <LogVolumeChart data={analytics.logVolumeByHour} />
            </div>
            <div className="xl:w-[40%]">
              <LogLevelDonutChart data={analytics.logLevelDistribution} />
            </div>
          </section>

          <section className="flex flex-col xl:flex-row gap-4">
            <div className="xl:w-[40%]">
              <TopErrorsList
                data={analytics.topErrors}
                onErrorFilter={onFilterByError}
              />
            </div>
            <div className="xl:w-[30%]">
              <TopModulesChart data={analytics.topModules} />
            </div>
            <div className="xl:w-[30%]">
              <RecentCriticalFeed
                data={analytics.recentCriticalErrors}
                onJumpToLine={(lineNumber) => onJumpToLogIndex(lineNumber - 1)}
              />
            </div>
          </section>

          <section>
            <ErrorHeatmap
              data={analytics.heatmapData}
              selectedDate={selectedDate}
              logs={logs}
            />
          </section>
        </main>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
