import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getExpiryInfo } from '../utils/expiry';

export default function AssetDetailPage() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projects, setProjects] = useState([]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this asset?')) return;
    try {
      await api.delete(`/assets/${id}`);
      navigate('/assets');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete asset');
    }
  };

  const loadData = async () => {
    try {
      const [assetRes, histRes, projRes] = await Promise.all([
        api.get(`/assets/${id}`),
        api.get(`/assets/${id}/history`),
        api.get('/projects').catch(() => ({ data: { data: [] } })),
      ]);
      setAsset(assetRes.data.data);
      setHistory(histRes.data.data || []);
      setProjects(projRes.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusUpdate = async (newStatus, note) => {
    try {
      await api.patch(`/assets/${id}`, { status: newStatus, note });
      setShowStatusModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const handleProjectAssign = async (projectId) => {
    try {
      await api.patch(`/assets/${id}`, { project: projectId || null });
      setShowProjectModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update project assignment');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!asset) return (
    <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
      Asset not found
    </div>
  );

  const tabs = ['overview', 'timeline', 'qr'];
  if (asset.childCount > 0) tabs.splice(2, 0, 'children');

  const expiry = asset.warranty?.end || asset.warranty?.endDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link to="/assets" className="text-xs font-semibold text-orange-600 hover:text-orange-700 mb-2 inline-flex items-center gap-1">
            <span>← Back to Assets</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{asset.name}</h1>
            {asset.project ? (
              <Link to={`/projects/${asset.project._id || asset.project}`} className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-semibold hover:bg-orange-100">
                📁 Project: {asset.project.name || 'Assigned'}
              </Link>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                ✨ Common Pool (Free)
              </span>
            )}
          </div>
          <div className="flex gap-2.5 mt-2.5 flex-wrap items-center">
            <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/60">
              {asset.assetTag}
            </span>
            <span className="text-xs capitalize bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
              {asset.status?.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              {asset.assetType?.name}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowStatusModal(true)} 
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition text-sm font-semibold shadow-md shadow-orange-500/20 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Edit Status
          </button>
          <button 
            onClick={handleDelete} 
            className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-100 transition text-sm font-semibold"
          >
            Delete Asset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200 w-fit shadow-2xs">
        {tabs.map((t) => (
          <button 
            key={t} 
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project & Pool Assignment */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 lg:col-span-2 shadow-xs">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Project & Pool Allocation</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage which project utilizes this asset or return it to the organization-wide common free pool</p>
              </div>
              <button 
                onClick={() => setShowProjectModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold hover:bg-orange-100 transition"
              >
                Change Assignment
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center flex-wrap gap-4">
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold">Current Allocation</div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {asset.project ? (
                    <Link to={`/projects/${asset.project._id || asset.project}`} className="text-orange-600 hover:underline">
                      📁 {asset.project.name || 'Project Assigned'}
                    </Link>
                  ) : (
                    <span className="text-emerald-700">✨ Common Asset Pool (Free for any project to claim)</span>
                  )}
                </div>
              </div>
              {asset.project && (
                <button 
                  onClick={() => handleProjectAssign(null)} 
                  className="px-3.5 py-1.5 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 text-xs font-semibold transition shadow-2xs"
                >
                  Release to Common Free Pool
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Asset Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail label="Assigned User" value={asset.assignment?.user?.name} />
              <Detail label="Created By" value={asset.createdBy?.name} />
              {asset.parent && <Detail label="Parent Container" value={asset.parent.assetTag} />}
              {asset.childCount > 0 && <Detail label="Nested Children" value={asset.childCount} />}
            </div>
          </div>

          {/* Deadline & Validity Duration Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Deadline & Validity Horizon</h2>
              {(() => {
                const exp = getExpiryInfo(asset);
                return (
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${exp.badgeClass}`}>
                    {exp.label}
                  </span>
                );
              })()}
            </div>
            {expiry ? (
              <div className="grid grid-cols-2 gap-4 pt-1">
                <Detail label="Start Date" value={asset.warranty?.start ? new Date(asset.warranty.start).toLocaleDateString() : '—'} />
                <Detail label="Expiry / Deadline Date" value={new Date(expiry).toLocaleDateString()} />
                <div className="col-span-2 p-3 rounded-xl bg-orange-50/60 border border-orange-200">
                  <p className="text-xs text-orange-800 font-semibold uppercase">Duration Status</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {(() => {
                      const exp = getExpiryInfo(asset);
                      if (exp.isExpired) return `⚠️ Asset deadline expired ${Math.abs(exp.days)} day(s) ago. Immediate renewal needed.`;
                      if (exp.days === 0) return '🚨 Asset reaches deadline today!';
                      if (exp.days <= 10) return `⚠️ Approaching deadline in ${exp.days} day(s). Prepare replacement.`;
                      return `✅ Valid and operational (${exp.days} day(s) remaining until deadline).`;
                    })()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No deadline or warranty expiry configured for this asset.</p>
            )}
          </div>

          {/* Attributes */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Custom Attributes</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(asset.attributes || {}).map(([key, val]) => (
                <Detail key={key} label={key.replace(/_/g, ' ')} value={String(val)} />
              ))}
            </div>
          </div>

          {/* Purchase Info */}
          {asset.purchase && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">Purchase & Financials</h2>
              <div className="grid grid-cols-2 gap-4">
                <Detail label="Purchase Cost" value={asset.purchase.cost ? `₹${asset.purchase.cost.toLocaleString()}` : '—'} />
                <Detail label="Vendor / Supplier" value={asset.purchase.vendor} />
                <Detail label="Purchase Date" value={asset.purchase.date ? new Date(asset.purchase.date).toLocaleDateString() : '—'} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Status Modal */}
      {showStatusModal && (
        <AssetStatusModal 
          currentStatus={asset.status}
          assetType={asset.assetType}
          onClose={() => setShowStatusModal(false)}
          onSave={handleStatusUpdate}
        />
      )}

      {/* Project Assign Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setShowProjectModal(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-slate-900">Assign to Project</h2>
              <button onClick={() => setShowProjectModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Select a target project or release this asset to the shared free common pool</p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <button 
                onClick={() => handleProjectAssign(null)}
                className="w-full text-left p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-sm text-emerald-800 font-semibold transition"
              >
                ✨ Release to Common Free Pool (No Project)
              </button>
              {projects.map(p => (
                <button 
                  key={p._id}
                  onClick={() => handleProjectAssign(p._id)}
                  className={`w-full text-left p-3 rounded-xl border transition text-sm ${asset.project?._id === p._id ? 'bg-orange-50 border-orange-300 text-orange-800 font-bold' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'}`}
                >
                  📁 {p.name} <span className="text-xs text-slate-400 font-normal ml-1">({p.type || 'project'})</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setShowProjectModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Lifecycle Timeline Tab */}
      {tab === 'timeline' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Lifecycle Audit Timeline</h2>
          {history.length === 0 ? (
            <p className="text-slate-400 text-sm">No lifecycle events recorded yet</p>
          ) : (
            <div className="space-y-4">
              {history.map((evt, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500 ring-4 ring-orange-100" />
                    {i < history.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-bold text-slate-800 capitalize">{evt.kind?.replace(/_/g, ' ')}</p>
                    {evt.fromStatus && <p className="text-xs font-semibold text-orange-600">{evt.fromStatus} → {evt.toStatus}</p>}
                    {evt.note && <p className="text-xs text-slate-500 mt-0.5">{evt.note}</p>}
                    <p className="text-xs text-slate-400 mt-1">{evt.actor?.name} · {new Date(evt.at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QR Tab */}
      {tab === 'qr' && <QRTab assetId={id} />}

      {/* Children Tab */}
      {tab === 'children' && <ChildrenTab assetId={id} />}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase font-semibold">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || '—'}</p>
    </div>
  );
}

function QRTab({ assetId }) {
  const [qr, setQr] = useState(null);
  useEffect(() => { api.get(`/assets/${assetId}/qr`).then((r) => setQr(r.data.data)).catch(() => {}); }, [assetId]);
  if (!qr) return <div className="text-slate-400">Loading QR...</div>;
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center shadow-xs">
      <img src={qr.qrCode} alt="QR Code" className="mx-auto w-56 h-56 rounded-xl border border-slate-200 p-2 shadow-sm" />
      <p className="text-lg font-mono font-bold text-orange-600 mt-4">{qr.assetTag}</p>
      <p className="text-sm font-medium text-slate-700">{qr.name}</p>
    </div>
  );
}

function ChildrenTab({ assetId }) {
  const [children, setChildren] = useState([]);
  useEffect(() => { 
    api.get(`/assets/${assetId}/children`).then((r) => {
      const arr = Array.isArray(r.data?.data) ? r.data.data : (r.data?.data?.data || []);
      setChildren(arr);
    }).catch(() => {}); 
  }, [assetId]);
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
      <h2 className="text-base font-bold text-slate-900 mb-4">Nested Child Equipment</h2>
      {children.length === 0 ? <p className="text-slate-400 text-sm">No child assets</p> : (
        <div className="space-y-2">
          {children.map((c) => (
            <Link key={c._id} to={`/assets/${c._id}`} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-orange-50/50 border border-slate-200 transition">
              <div>
                <span className="text-sm font-mono font-bold text-orange-600 mr-3">{c.assetTag}</span>
                <span className="text-sm font-semibold text-slate-800">{c.name}</span>
              </div>
              <span className="text-xs capitalize bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">{c.status?.replace(/_/g, ' ')}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AssetStatusModal({ currentStatus, assetType, onClose, onSave }) {
  const typeStates = assetType?.states || [];
  const defaultStates = [
    { key: 'available', label: 'Available (Free for any project)' },
    { key: 'in_use', label: 'In Use (Working in project)' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_stock', label: 'In Stock' },
    { key: 'in_repair', label: 'In Repair / Maintenance' },
    { key: 'retired', label: 'Retired' },
  ];

  const stateOptions = typeStates.length > 0 ? typeStates : defaultStates;
  const existingKeys = new Set(stateOptions.map(s => s.key));
  const fullStates = [...stateOptions];
  if (!existingKeys.has('available')) fullStates.push({ key: 'available', label: 'Available (Free)' });
  if (!existingKeys.has('in_use')) fullStates.push({ key: 'in_use', label: 'In Use' });
  if (!existingKeys.has('in_repair')) fullStates.push({ key: 'in_repair', label: 'In Repair' });

  const [selectedStatus, setSelectedStatus] = useState(currentStatus || 'available');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(selectedStatus, note);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-slate-900">Edit Asset Status</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Select Status</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 capitalize"
            >
              {fullStates.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label || s.key.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Reason / Note (Optional)</label>
            <input 
              type="text" 
              value={note} 
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Returned from project, repaired, etc."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" 
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold shadow-md shadow-orange-500/20 disabled:opacity-50">
              {saving ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
