import { useState, useEffect, type FC } from 'react';
import {
  TrendingUp,
  Flame,
  RefreshCw,
  FileQuestion,
} from 'lucide-react';
import { fetchAdminFAQs, fetchSLAStatus, fetchWardHeatmap } from '../../lib/api';
import type { SLAStatusData, WardHeatmapStat } from '../../types';

export const AdminDashboard: FC = () => {
  const [heatmap, setHeatmap] = useState<WardHeatmapStat[]>([]);
  const [slaData, setSlaData] = useState<SLAStatusData | null>(null);
  const [faqData, setFaqData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'sla' | 'faqs'>('heatmap');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hRes, sRes, fRes] = await Promise.all([
        fetchWardHeatmap(),
        fetchSLAStatus(),
        fetchAdminFAQs(),
      ]);
      setHeatmap(hRes.wards || []);
      setSlaData(sRes);
      setFaqData(fRes);
    } catch (e) {
      console.error('Failed to load admin telemetry:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Executive Decision Support Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Ward Officer Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time spatial grievance heatmaps, SLA breach countdowns, and automated policy knowledge gap radar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Highlights Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Citywide Active Tickets
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {heatmap.reduce((acc, w) => acc + w.total_grievances, 0)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">10 Municipal Wards Active</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-red-200 shadow-xs">
          <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider block">
            Critical / Breached SLAs
          </span>
          <div className="text-2xl font-bold text-red-700 mt-1">
            {(slaData?.summary.breached_count || 0) + (slaData?.summary.critical_count || 0)}
          </div>
          <span className="text-[10px] text-red-500 font-medium">Immediate field intervention required</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            High Density Alert Wards
          </span>
          <div className="text-2xl font-bold text-amber-800 mt-1">
            {heatmap.filter((w) => w.alert_level === 'red_alert').length}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">Exceeds 2σ of municipal baseline</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Knowledge Gaps Detected
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {faqData?.knowledge_gaps?.length || 2}
          </div>
          <span className="text-[10px] text-blue-600 font-medium">Missing policy gazettes</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'heatmap'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Spatial Ward Heatmap (2σ Alerting)
        </button>
        <button
          onClick={() => setActiveTab('sla')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'sla'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          SLA Countdown & Breach Monitor
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'faqs'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Trending Citizen FAQs & Knowledge Gaps
        </button>
      </div>

      {/* Tab 1: Spatial Ward Heatmap */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {heatmap.map((w) => (
              <div
                key={w.ward_id}
                className={`p-4 rounded-xl border transition-all ${
                  w.alert_level === 'red_alert'
                    ? 'bg-red-50/70 border-red-300 shadow-md ring-1 ring-red-400'
                    : w.alert_level === 'warning'
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{w.ward_name}</h3>
                    <p className="text-[11px] text-slate-500">{w.zone_name}</p>
                  </div>
                  {w.alert_level === 'red_alert' ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">
                      <Flame className="w-3 h-3" />
                      &gt;2σ Alert
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                      Normal
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100">
                  <span className="text-slate-500">Grievance Rate:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {w.rate_per_1000} / 1k residents
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1 text-slate-600">
                  <span className="text-slate-500">Active Officer:</span>
                  <span className="font-medium text-slate-800">{w.officer_name || 'Assigned'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: SLA Countdown Monitor */}
      {activeTab === 'sla' && slaData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-red-100/70 border border-red-300 text-red-900">
              <span className="text-[10px] uppercase font-bold tracking-wider">Breached SLAs</span>
              <div className="text-xl font-bold mt-1">{slaData.summary.breached_count}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800">
              <span className="text-[10px] uppercase font-bold tracking-wider">Critical (&lt;4 Hours)</span>
              <div className="text-xl font-bold mt-1">{slaData.summary.critical_count}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <span className="text-[10px] uppercase font-bold tracking-wider">Warning (4-12 Hours)</span>
              <div className="text-xl font-bold mt-1">{slaData.summary.warning_count}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className="text-[10px] uppercase font-bold tracking-wider">On Schedule (&gt;12h)</span>
              <div className="text-xl font-bold mt-1">{slaData.summary.normal_count}</div>
            </div>
          </div>

          {/* Active Tickets List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 font-semibold text-xs text-slate-800">
              Live Grievance Dispatch Queue & Countdown Timers
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {[
                ...slaData.details.breached,
                ...slaData.details.critical,
                ...slaData.details.warning,
                ...slaData.details.normal,
              ].map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                      {item.dept_code}
                    </span>
                    <div>
                      <div className="font-mono font-bold text-slate-900">{item.ticket_id}</div>
                      <div className="text-[11px] text-slate-500">{item.category}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold font-mono ${
                          item.remaining_hours <= 0
                            ? 'text-red-700 animate-pulse'
                            : item.remaining_hours <= 4
                            ? 'text-red-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {item.remaining_hours <= 0
                          ? 'SLA BREACHED'
                          : `${item.remaining_hours}h Remaining`}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        Target: {new Date(item.deadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Trending FAQs & Knowledge Gaps */}
      {activeTab === 'faqs' && faqData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-xs text-slate-900 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Trending Citizen Inquiry Clusters</span>
            </h3>
            <div className="space-y-2">
              {faqData.trending_topics?.map((topic: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{topic.topic}</span>
                    <span className="text-[10px] text-slate-400 block">{topic.department} Department</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700">{topic.trend}</span>
                    <span className="text-[10px] text-slate-500 block">{topic.inquiry_count} queries</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-xs text-slate-900 mb-3 flex items-center gap-1.5">
              <FileQuestion className="w-4 h-4 text-amber-600" />
              <span>Automated Knowledge Gap Alerts (RRF &lt; 0.45)</span>
            </h3>
            <div className="space-y-2.5">
              {faqData.knowledge_gaps?.map((gap: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-xs">
                  <div className="font-bold text-amber-950 flex items-center justify-between">
                    <span>"{gap.query_pattern}"</span>
                    <span className="text-[10px] font-mono bg-amber-200 px-1.5 py-0.5 rounded text-amber-900">
                      Score: {gap.max_confidence}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{gap.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
