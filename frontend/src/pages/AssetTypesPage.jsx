import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AssetTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try { 
      const { data } = await api.get('/asset-types'); 
      setTypes(data.data || []); 
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Asset Types & Schemas</h1>
          <p className="text-slate-500 text-sm mt-1">Configure equipment types with dynamic specification fields and lifecycle states</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2"
        >
          <span>+ New Type</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {types.map((t) => (
            <div key={t._id} className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-orange-300 hover:shadow-md transition-all shadow-xs group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{t.name}</h3>
                  <p className="text-xs text-orange-600 font-mono font-bold mt-0.5">{t.code}</p>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${t.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {t.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {t.category && <p className="text-xs text-slate-500 mb-3">{t.category}</p>}
              <div className="flex gap-4 text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
                <span>{t.fields?.length || 0} custom fields</span>
                <span>{t.states?.length || 0} states</span>
                <span>{t.transitions?.length || 0} transitions</span>
              </div>
              {t.hierarchy?.isContainer && (
                <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-block font-semibold">
                  📦 Container ({t.hierarchy.allowedChildTypes?.length || 0} allowed child types)
                </div>
              )}
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {(t.states || []).slice(0, 5).map((s) => (
                  <span key={s.key} className="text-xs px-2 py-0.5 rounded-md font-medium border" style={{ backgroundColor: s.color + '15', color: s.color, borderColor: s.color + '40' }}>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateTypeModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}

function CreateTypeModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', code: '', category: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/asset-types', {
        ...form,
        tagFormat: { prefix: form.code, includeYear: true, padding: 5 },
        fields: [],
        states: [{ key: 'active', label: 'Active', color: '#10B981', isInitial: true }],
        transitions: [],
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-slate-900">New Asset Type</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Name *</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              required
              placeholder="e.g. Drone, Laptop, Excavator"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Tag Prefix Code (Uppercase) *</label>
            <input 
              type="text" 
              value={form.code} 
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} 
              required
              placeholder="e.g. DRN, LP, EXC"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-mono font-bold" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Category</label>
            <input 
              type="text" 
              value={form.category} 
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. IT Equipment, Heavy Machinery"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" 
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition">Cancel</button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition shadow-md shadow-orange-500/20"
            >
              {saving ? 'Creating...' : 'Create Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
