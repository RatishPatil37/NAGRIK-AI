import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Flame,
  RefreshCw,
  FileQuestion,
  ShieldAlert,
  Activity,
  BarChart3,
  Layers,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAdminFAQs, fetchSLAStatus, fetchWardHeatmap } from '../../lib/api';
import type { SLAStatusData, WardHeatmapStat } from '../../types';

export const AdminDashboard: React.FC = () => {
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

  const totalGrievances = heatmap.reduce((acc, w) => acc + w.total_grievances, 0);
  const redAlertCount = heatmap.filter((w) => w.alert_level === 'red_alert').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header & Actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              Municipal Command & Decision Support
            </h1>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider font-mono">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Real-time spatial grievance heatmaps with 2-sigma anomaly detection, statutory SLA breach monitors, and automated policy knowledge-gap radars.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card hover:border-emerald-500/50 text-slate-200 text-xs font-semibold shadow-lg transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Telemetry</span>
        </motion.button>
      </motion.div>

      {/* Metric Highlights Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5 rounded-2xl glass-card border border-slate-800 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-display">Active Dockets</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-display">{totalGrievances}</div>
          <span className="text-[11px] text-emerald-400/90 font-medium mt-1 block">
            10 Municipal Wards Active
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl glass-card border border-red-500/30 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-display">Critical / Breached</span>
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-red-400 font-display">
            {(slaData?.summary.breached_count || 0) + (slaData?.summary.critical_count || 0)}
          </div>
          <span className="text-[11px] text-red-300/80 font-medium mt-1 block">
            Field Dispatch Action Required
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 rounded-2xl glass-card border border-amber-500/30 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-display">&gt;2σ Anomaly Wards</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-300 font-display">{redAlertCount}</div>
          <span className="text-[11px] text-amber-300/80 font-medium mt-1 block">
            Exceeds 2σ Citywide Baseline
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl glass-card border border-cyan-500/30 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-display">Knowledge Gaps</span>
            <FileQuestion className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-300 font-display">
            {faqData?.knowledge_gaps?.length || 2}
          </div>
          <span className="text-[11px] text-cyan-300/80 font-medium mt-1 block">
            Circular Update Advisories
          </span>
        </motion.div>
      </div>

      {/* Modern Liquid Glass Pill Tabs */}
      <div className="flex flex-wrap p-1.5 rounded-2xl liquid-glass mb-6 gap-1 max-w-2xl">
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'heatmap'
              ? 'bg-white text-zinc-950 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Spatial Ward Heatmap</span>
        </button>
        <button
          onClick={() => setActiveTab('sla')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sla'
              ? 'bg-white text-zinc-950 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>SLA Queue & Breaches</span>
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'faqs'
              ? 'bg-white text-zinc-950 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Trending FAQs & Gaps</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Tab 1: Spatial Ward Heatmap */}
        {activeTab === 'heatmap' && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {heatmap.map((w) => {
              const isAlert = w.alert_level === 'red_alert';
              return (
                <div
                  key={w.ward_id}
                  className={`p-5 rounded-2xl glass-card transition-all ${
                    isAlert
                      ? 'border-red-500/60 shadow-lg shadow-red-500/10 ring-1 ring-red-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-white font-display">{w.ward_name}</h3>
                      <p className="text-xs text-slate-400">{w.zone_name}</p>
                    </div>
                    {isAlert ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse font-mono">
                        <Flame className="w-3 h-3 text-red-400" />
                        &gt;2σ Alert
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700 font-mono">
                        Nominal
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 py-3 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Grievances:</span>
                      <span className="font-bold text-white font-mono">{w.total_grievances} dockets</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Rate per 1k Residents:</span>
                      <span className="font-bold text-emerald-400 font-mono">{w.rate_per_1000}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 pt-1">
                      <span className="text-slate-500">Ward Officer:</span>
                      <span className="font-medium text-slate-200">{w.officer_name || 'Assigned'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Tab 2: SLA Countdown Monitor */}
        {activeTab === 'sla' && slaData && (
          <motion.div
            key="sla"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300">
                <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Breached SLAs</span>
                <div className="text-2xl font-bold mt-1 text-red-400 font-display">{slaData.summary.breached_count}</div>
              </div>
              <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300">
                <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Critical (&lt;4h)</span>
                <div className="text-2xl font-bold mt-1 text-red-300 font-display">{slaData.summary.critical_count}</div>
              </div>
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300">
                <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Warning (4-12h)</span>
                <div className="text-2xl font-bold mt-1 text-amber-300 font-display">{slaData.summary.warning_count}</div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                <span className="text-[10px] uppercase font-bold tracking-wider font-mono">On Schedule</span>
                <div className="text-2xl font-bold mt-1 text-emerald-300 font-display">{slaData.summary.normal_count}</div>
              </div>
            </div>

            {/* Active Tickets List */}
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-slate-800 font-bold text-xs text-white uppercase tracking-wider font-display">
                Active Grievance Redressal Dispatch Queue
              </div>
              <div className="divide-y divide-slate-800/80 max-h-96 overflow-y-auto">
                {[
                  ...slaData.details.breached,
                  ...slaData.details.critical,
                  ...slaData.details.warning,
                  ...slaData.details.normal,
                ].map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center font-mono">
                        {item.dept_code}
                      </span>
                      <div>
                        <div className="font-mono font-bold text-white text-sm">{item.ticket_id}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.category}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
                          item.remaining_hours <= 0
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                            : item.remaining_hours <= 4
                            ? 'bg-red-500/15 text-red-300 border border-red-500/25'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                        }`}
                      >
                        {item.remaining_hours <= 0
                          ? 'SLA BREACHED'
                          : `${item.remaining_hours}h Remaining`}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        Target: {new Date(item.deadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Trending FAQs & Knowledge Gaps */}
        {activeTab === 'faqs' && faqData && (
          <motion.div
            key="faqs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl">
              <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2 font-display">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Trending Citizen Inquiry Clusters</span>
              </h3>
              <div className="space-y-2.5">
                {faqData.trending_topics?.map((topic: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white block">{topic.topic}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">{topic.department} Department</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-emerald-400">{topic.trend}</span>
                      <span className="text-[10px] text-slate-500 block">{topic.inquiry_count} queries</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-amber-500/30 shadow-xl">
              <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2 font-display">
                <FileQuestion className="w-4 h-4 text-amber-400" />
                <span>Automated Knowledge Gap Alerts (RRF &lt; 0.45)</span>
              </h3>
              <div className="space-y-3">
                {faqData.knowledge_gaps?.map((gap: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs">
                    <div className="font-bold text-amber-300 flex items-center justify-between">
                      <span>"{gap.query_pattern}"</span>
                      <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded-md text-amber-200 border border-amber-500/30">
                        Confidence: {gap.max_confidence}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{gap.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
