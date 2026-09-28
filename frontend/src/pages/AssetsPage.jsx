import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getExpiryInfo } from '../utils/expiry';

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [types, setTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [poolFilter, setPoolFilter] = useState('all'); // 'all', 'free', 'project'
  const [deadlineFilter, setDeadlineFilter] = useState('all'); // 'all', 'expired', 'urgent', 'month'
  const [filters, setFilters] = useState({ q: '', type: '', status: '', project: '' });

  useEffect(() => {
    api.get('/asset-types').then((r) => setTypes(r.data.data || [])).catch(() => {});
    api.get('/projects').then((r) => setProjects(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.q) params.q = filters.q;
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;
        
        if (poolFilter === 'free') {
          params.project = 'null';
        } else if (filters.project) {
          params.project = filters.project;
        }

        const { data } = await api.get('/assets', { params });
        let resData = Array.isArray(data.data) ? data.data : (data.data?.data || data || []);
        if (poolFilter === 'project') {
          resData = resData.filter(a => !!a.project);
        }
        setAssets(resData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters, poolFilter]);

  const statusColors = {
    procured: 'bg-slate-100 text-slate-700 border-slate-200',
    in_stock: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    assigned: 'bg-blue-50 text-blue-700 border-blue-200',
    in_repair: 'bg-amber-50 text-amber-700 border-amber-200',
    retired: 'bg-purple-50 text-purple-700 border-purple-200',
    disposed: 'bg-red-50 text-red-700 border-red-200',
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    free: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    in_use: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
    in_service: 'bg-blue-50 text-blue-700 border-blue-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    operational: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    under_maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
    under_repair: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  // Filter assets by deadline duration
  const displayedAssets = assets.filter((asset) => {
    if (deadlineFilter === 'all') return true;
    const exp = getExpiryInfo(asset);
    if (!exp.hasExpiry) return false;
    if (deadlineFilter === 'expired') return exp.isExpired;
    if (deadlineFilter === 'urgent') return exp.days !== null && exp.days >= 0 && exp.days <= 10;
    if (deadlineFilter === 'month') return exp.days !== null && exp.days >= 0 && exp.days <= 30;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assets Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage project-assigned equipment, common free pool, and expiry deadlines</p>
        </div>
        <Link to="/assets/new"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2">
          <span>+ Add Asset</span>
        </Link>
      </div>

      {/* Pool Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {[
          { key: 'all', label: 'All Assets' },
          { key: 'free', label: '✨ Common Pool (Free Assets)' },
          { key: 'project', label: '📁 Assigned to Projects' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPoolFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              poolFilter === tab.key
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/20 font-semibold'
                : 'bg-white text-slate-600 hover:bg-orange-50/50 hover:text-orange-600 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex gap-3 flex-wrap items-center">
        <input 
          type="text" 
          placeholder="Search by name or tag..."
          value={filters.q} 
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 w-64 shadow-2xs" 
        />
        
        <select 
          value={filters.type} 
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 shadow-2xs"
        >
          <option value="">All Types</option>
          {types.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>

        {poolFilter === 'all' && (
          <select 
            value={filters.project} 
            onChange={(e) => setFilters({ ...filters, project: e.target.value })}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 shadow-2xs"
          >
            <option value="">All Projects / Pools</option>
            <option value="null">✨ Common Free Pool Only</option>
            {projects.map((p) => <option key={p._id} value={p._id}>📁 {p.name}</option>)}
          </select>
        )}

        {/* Deadline Filter */}
        <select 
          value={deadlineFilter} 
          onChange={(e) => setDeadlineFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white border border-orange-200 text-sm text-orange-700 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/30 shadow-2xs"
        >
          <option value="all">⏱️ All Deadlines</option>
          <option value="urgent">⚠️ Expiring Soon (≤ 10 Days)</option>
          <option value="month">⏳ Within 30 Days</option>
          <option value="expired">🚫 Expired Deadlines</option>
        </select>

        <input 
          type="text" 
          placeholder="Filter by status..."
          value={filters.status} 
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 w-44 shadow-2xs" 
        />
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedAssets.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-base text-slate-600 font-semibold">No assets match your criteria</p>
            {poolFilter === 'free' && <p className="text-xs text-slate-500 mt-1">All assets are currently allocated to projects.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Tag</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Project / Pool</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Duration / Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {displayedAssets.map((asset) => {
                  const expiry = getExpiryInfo(asset);
                  return (
                    <tr 
                      key={asset._id} 
                      className="hover:bg-orange-50/30 transition-colors cursor-pointer" 
                      onClick={() => window.location.href = `/assets/${asset._id}`}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
                          {asset.assetTag}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800 hover:text-orange-600">{asset.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                          {asset.assetType?.name || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium border ${statusColors[asset.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {asset.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {asset.project ? (
                          <span 
                            onClick={(e) => { e.stopPropagation(); window.location.href = `/projects/${asset.project._id || asset.project}`; }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 font-medium hover:underline inline-block"
                          >
                            📁 {asset.project.name || 'Assigned Project'}
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            ✨ Common Pool (Free)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs font-medium">
                        {expiry.hasExpiry ? expiry.dateFormatted : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${expiry.badgeClass}`}>
                          {expiry.isExpired && <span>🚫</span>}
                          {expiry.isUrgent && <span>⚠️</span>}
                          {expiry.label}
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
    </div>
  );
}
