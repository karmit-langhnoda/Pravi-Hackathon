import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getExpiryInfo } from '../utils/expiry';

const COLORS = ['#f97316', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6'];

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [byType, setByType] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [warranties, setWarranties] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, typeRes, statusRes, warRes, projRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/by-type'),
          api.get('/dashboard/by-status'),
          api.get('/dashboard/expiring-warranties'),
          api.get('/projects').catch(() => ({ data: { data: [] } })),
        ]);
        setSummary(sumRes.data.data);
        setByType(typeRes.data.data);
        setByStatus(statusRes.data.data);
        setWarranties(warRes.data.data);
        setProjects(projRes.data.data || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const kpiCards = [
    { label: 'Total Assets', value: summary?.totalAssets || 0, color: 'from-orange-500 to-amber-500', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label: 'In Projects / Assigned', value: summary?.assignedCount || 0, color: 'from-blue-500 to-indigo-600', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: '✨ Common Pool (Free)', value: summary?.freeAssetsCount || 0, color: 'from-emerald-500 to-teal-600', icon: 'M5 13l4 4L19 7' },
    { label: 'Deadline Approaching (30d)', value: warranties?.in30Days || 0, color: 'from-rose-500 to-red-600', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  ];

  const totalByStatus = byStatus.reduce((s, b) => s + b.count, 0) || 1;
  const deadlineItems = warranties?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations & Deadlines Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time asset monitoring, project allocation, and expiration tracking</p>
        </div>
        <Link 
          to="/assets" 
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold shadow-md shadow-orange-500/20 transition flex items-center gap-2"
        >
          <span>⏱️</span>
          <span>View Expiry Countdown</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-orange-200 transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{kpi.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1.5">{kpi.value.toLocaleString()}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={kpi.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Day-by-Day Deadline & Expiry Tracker */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">⏱️ Day-by-Day Deadline & Expiry Tracker</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold border border-orange-200">
                Sorted by nearest deadline
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active equipment approaching maintenance deadlines, warranty expirations, or contract renewals
            </p>
          </div>
          <Link to="/assets" className="text-xs text-orange-600 hover:text-orange-700 font-semibold hover:underline">
            View All Assets →
          </Link>
        </div>

        {deadlineItems.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-slate-700">No assets with upcoming deadlines within 60 days</p>
            <p className="text-xs text-slate-500 mt-1">All equipment warranties and contract validity are in safe standing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/70">
                  <th className="py-3 px-4 rounded-l-lg">Asset</th>
                  <th className="py-3 px-4">Project / Common Pool</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">Duration Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {deadlineItems.map((item) => {
                  const exp = getExpiryInfo(item);
                  return (
                    <tr key={item._id} className="hover:bg-orange-50/30 transition">
                      <td className="py-3.5 px-4">
                        <Link to={`/assets/${item._id}`} className="font-semibold text-slate-900 hover:text-orange-600 flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">{item.assetTag}</span>
                          <span>{item.name}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.project ? (
                          <Link to={`/projects/${item.project._id || item.project}`} className="text-xs px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 font-medium hover:underline">
                            📁 {item.project.name || 'Project'}
                          </Link>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            ✨ Free Pool
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs px-2.5 py-1 rounded-full capitalize bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          {item.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                        {exp.dateFormatted}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${exp.badgeClass}`}>
                          {exp.isExpired && <span>🚫</span>}
                          {exp.isUrgent && <span>⚠️</span>}
                          {exp.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two columns: Assets by Type and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Type */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Assets by Type</h2>
          <div className="space-y-3">
            {byType.map((item, i) => (
              <div key={item._id} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm text-slate-700 font-medium flex-1">{item.name}</span>
                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{item.count}</span>
              </div>
            ))}
            {byType.length === 0 && <p className="text-slate-400 text-sm">No data available</p>}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Assets by Operational Status</h2>
          <div className="space-y-3">
            {byStatus.map((item, i) => (
              <div key={item._id}>
                <div className="flex justify-between text-sm mb-1.5 font-medium">
                  <span className="text-slate-700 capitalize">{item._id?.replace(/_/g, ' ')}</span>
                  <span className="text-slate-500 font-semibold">{item.count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.count / totalByStatus) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))}
            {byStatus.length === 0 && <p className="text-slate-400 text-sm">No data available</p>}
          </div>
        </div>
      </div>

      {/* Warranty Expiry Summary Cards */}
      {warranties && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Expiration Horizon Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Within 30 Days', value: warranties.in30Days, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
              { label: 'Within 60 Days', value: warranties.in60Days, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
              { label: 'Within 90 Days', value: warranties.in90Days, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
            ].map((w) => (
              <div key={w.label} className={`text-center p-4 rounded-xl border ${w.bg}`}>
                <p className={`text-3xl font-extrabold ${w.color}`}>{w.value}</p>
                <p className="text-xs font-semibold text-slate-600 mt-1">{w.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
