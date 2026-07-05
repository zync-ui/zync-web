/**
 * TopModulesChart — Ranked list of the noisiest log sources (readable full names).
 */

import React from 'react';
import { Layers } from 'lucide-react';
import { CHART_COLORS, panelStyle } from './config/chartConfig';
import type { TopModuleItem } from './types/dashboardTypes';

interface TopModulesChartProps {
  data?: TopModuleItem[];
  loading?: boolean;
}

const TopModulesChart: React.FC<TopModulesChartProps> = ({ data = [], loading = false }) => {
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const maxCount = sortedData[0]?.count ?? 1;

  if (loading) {
    return (
      <div className="rounded-xl p-5 h-64 animate-pulse border border-gray-800" style={panelStyle}>
        <div className="h-4 w-40 rounded mb-6 bg-gray-800" />
        <div className="h-40 rounded bg-gray-900/60" />
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5 flex flex-col gap-4 h-full border border-gray-800/80" style={panelStyle}>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-brand-primary/15 border border-brand-primary/25">
          <Layers size={16} className="text-brand-secondary" />
        </div>
        <h3 className="text-sm font-semibold text-gray-100 font-sans">Noisiest Modules</h3>
      </div>

      {sortedData.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8 font-sans">No module data available.</p>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto theme-scrollbar" style={{ maxHeight: '260px' }}>
          {sortedData.map((item, index) => {
            const width = Math.max(4, (item.count / maxCount) * 100);
            return (
              <div key={item.module} className="group">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <span
                    className="text-xs text-gray-300 font-sans leading-snug break-all"
                    title={item.module}
                  >
                    {item.module}
                  </span>
                  <span className="text-xs font-medium text-cyan-400 font-sans whitespace-nowrap">
                    {item.count.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-gray-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${width}%`,
                      background: `linear-gradient(90deg, ${CHART_COLORS.primary}, ${CHART_COLORS.secondary})`,
                      opacity: 1 - index * 0.06,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopModulesChart;
