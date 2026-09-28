import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/projects');
      setProjects(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects & Contracts</h1>
          <p className="text-slate-500 text-sm mt-1">Organize and allocate equipment across specific client contracts and sites</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2"
        >
          <span>+ New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <p className="font-semibold text-slate-700">No projects or contracts created yet.</p>
            <p className="text-xs text-slate-500 mt-1">Create your first project to start allocating assets from the common pool.</p>
          </div>
        ) : (
          projects.map((p) => (
            <Link 
              key={p._id} 
              to={`/projects/${p._id}`} 
              className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-orange-300 hover:shadow-md transition-all group block shadow-xs"
            >
              <div className="flex justify-between items-start mb-2.5">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                  {p.name}
                </h3>
                <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium border ${p.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {p.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2 h-10">{p.description || 'No description provided'}</p>
              <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="capitalize px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-medium">{p.type}</span>
                  <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 font-bold border border-orange-200/60">
                    {p.assetCount || 0} Assets
                  </span>
                </div>
                <span className="font-medium text-slate-600">{p.manager?.name ? `Mgr: ${p.manager.name}` : 'Unassigned'}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', type: 'contract' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); 
    setError('');
    try {
      await api.post('/projects', form);
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
          <h2 className="text-lg font-bold text-slate-900">New Project / Contract</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Project Name *</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              required
              placeholder="e.g. Highway 48 Construction, Site B"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Description</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Project goals, scope, and duration..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none h-24" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Type</label>
            <select 
              value={form.type} 
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            >
              <option value="contract">Client Contract</option>
              <option value="internal">Internal Project</option>
              <option value="client">Client Delivery</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition">
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
