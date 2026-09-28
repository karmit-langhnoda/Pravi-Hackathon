import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function LocationsPage() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [flatLocations, setFlatLocations] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        api.get('/locations/tree'),
        api.get('/locations'),
      ]);
      setTree(treeRes.data.data || []);
      setFlatLocations(flatRes.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const kindColors = {
    country: 'bg-purple-500/20 text-purple-400',
    city: 'bg-blue-500/20 text-blue-400',
    building: 'bg-amber-500/20 text-amber-400',
    floor: 'bg-emerald-500/20 text-emerald-400',
    room: 'bg-teal-500/20 text-teal-400',
    other: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Locations</h1>
          <p className="text-slate-400 mt-1">Manage your location hierarchy</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25">
          + Add Location
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : tree.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 text-center text-slate-500">No locations yet</div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          {tree.map((node) => (
            <TreeNode key={node._id} node={node} level={0} kindColors={kindColors} />
          ))}
        </div>
      )}

      {showCreate && <CreateLocationModal locations={flatLocations} onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}

function TreeNode({ node, level, kindColors }) {
  const [open, setOpen] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div className={`flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition cursor-pointer`}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => setOpen(!open)}>
        {hasChildren ? (
          <svg className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <div className="w-4" />
        )}
        <span className="text-sm font-medium text-slate-200">{node.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-lg capitalize ${kindColors[node.kind] || kindColors.other}`}>
          {node.kind}
        </span>
        {hasChildren && <span className="text-xs text-slate-500">({node.children.length})</span>}
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child._id} node={child} level={level + 1} kindColors={kindColors} />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateLocationModal({ locations, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', kind: 'other', parent: '', address: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const body = { ...form };
      if (!body.parent) delete body.parent;
      await api.post('/locations', body);
      onCreated(); onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create');
    } finally { setSaving(false); }
  };

  const kinds = ['country', 'city', 'building', 'floor', 'room', 'other'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">Add Location</h2>
        {error && <div className="p-3 rounded-lg bg-red-500/20 text-red-300 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Kind *</label>
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {kinds.map((k) => <option key={k} value={k} className="capitalize">{k}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Parent Location</label>
            <select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">None (top-level)</option>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.name} ({l.kind})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50 transition">
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
