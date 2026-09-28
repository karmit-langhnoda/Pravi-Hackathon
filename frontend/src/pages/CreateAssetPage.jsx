import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function CreateAssetPage() {
  const [types, setTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [schema, setSchema] = useState(null);
  const [params] = useSearchParams();
  const parentId = params.get('parent');
  const initialProjectId = params.get('project') || '';
  const [selectedProject, setSelectedProject] = useState(initialProjectId);

  const [formData, setFormData] = useState({ 
    name: '', 
    attributes: {}, 
    purchase: { cost: '', vendor: '', date: '' }, 
    warranty: { start: '', end: '' } 
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/asset-types?active=true').then((r) => setTypes(r.data.data || [])).catch(console.error);
    api.get('/projects').then((r) => setProjects(r.data.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialProjectId) setSelectedProject(initialProjectId);
  }, [initialProjectId]);

  useEffect(() => {
    if (!selectedType) { setSchema(null); return; }
    api.get(`/asset-types/${selectedType}/form-schema`).then((r) => {
      setSchema(r.data.data);
      const defaults = {};
      (r.data.data.fields || []).forEach((f) => {
        if (f.defaultValue !== undefined && f.defaultValue !== null) defaults[f.key] = f.defaultValue;
      });
      setFormData((prev) => ({ ...prev, attributes: defaults }));
    });
  }, [selectedType]);

  const setAttr = (key, value) => {
    setFormData((prev) => ({ ...prev, attributes: { ...prev.attributes, [key]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
        assetType: selectedType,
        name: formData.name,
        attributes: formData.attributes,
        project: selectedProject || undefined,
        purchase: {
          cost: formData.purchase.cost ? Number(formData.purchase.cost) : undefined,
          vendor: formData.purchase.vendor || undefined,
          date: formData.purchase.date || undefined,
        },
        warranty: {
          start: formData.warranty.start || undefined,
          end: formData.warranty.end || undefined,
        },
        parent: parentId || undefined,
      };
      const { data } = await api.post('/assets', body);
      if (selectedProject) {
        navigate(`/projects/${selectedProject}`);
      } else {
        navigate(`/assets/${data.data._id}`);
      }
    } catch (err) {
      const e = err.response?.data?.error;
      setError(e?.details ? (Array.isArray(e.details) ? e.details.join(', ') : e.message) : e?.message || 'Failed to create asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Asset</h1>
        <p className="text-slate-500 text-sm mt-1">Register new equipment into a project or the organization-wide common free pool</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type selector */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">1. Asset Classification</h2>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Asset Type *</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)} 
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            >
              <option value="">Select a category / equipment type...</option>
              {types.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.code})</option>)}
            </select>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">2. Basic Information</h2>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Asset Name *</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              required
              placeholder="e.g. Dell Latitude 7420, Survey Drone, Caterpillar Excavator"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" 
            />
          </div>
        </div>

        {/* Project Assignment */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">3. Project Allocation</h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${selectedProject ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {selectedProject ? 'Assigned to Project' : 'Common Free Pool'}
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Assign to Project / Contract</label>
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            >
              <option value="">None (Free / Common Asset Pool - Can be used by any project)</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  📁 {p.name} ({p.type || 'project'})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1.5">
              If left unassigned, this asset is immediately placed into the Common Free Pool for any project to claim.
            </p>
          </div>
        </div>

        {/* Dynamic custom fields */}
        {schema && schema.fields.length > 0 && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">4. Custom Specifications ({schema.fields.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schema.fields.map((field) => (
                <DynamicField key={field.key} field={field} value={formData.attributes[field.key] ?? ''} onChange={(v) => setAttr(field.key, v)} />
              ))}
            </div>
          </div>
        )}

        {/* Validity Deadline & Purchase Info */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">5. Validity Deadline & Purchase Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">Used for real-time day-by-day deadline alerts, countdowns, and renewal schedules</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Contract / Warranty Start Date</label>
              <input 
                type="date" 
                value={formData.warranty.start} 
                onChange={(e) => setFormData({ ...formData, warranty: { ...formData.warranty, start: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-orange-700 mb-1.5">⏱️ Expiry / Deadline Date *</label>
              <input 
                type="date" 
                value={formData.warranty.end} 
                onChange={(e) => setFormData({ ...formData, warranty: { ...formData.warranty, end: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-xl bg-orange-50/50 border border-orange-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-medium" 
              />
              <p className="text-[11px] text-slate-500 mt-1">Live countdown tracks day-by-day remaining until this deadline.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Purchase Cost (INR)</label>
              <input 
                type="number" 
                value={formData.purchase.cost || ''} 
                onChange={(e) => setFormData({ ...formData, purchase: { ...formData.purchase, cost: e.target.value } })}
                placeholder="e.g. 75000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Vendor / Supplier</label>
              <input 
                type="text" 
                value={formData.purchase.vendor || ''} 
                onChange={(e) => setFormData({ ...formData, purchase: { ...formData.purchase, vendor: e.target.value } })}
                placeholder="Vendor or Supplier name"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" 
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving || !selectedType}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition-all shadow-md shadow-orange-500/20"
        >
          {saving ? 'Creating Asset...' : 'Create Asset & Place in Inventory'}
        </button>
      </form>
    </div>
  );
}

function DynamicField({ field, value, onChange }) {
  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500";

  switch (field.dataType) {
    case 'text':
    case 'user':
    case 'location':
      return (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">{field.label} {field.required && '*'}</label>
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} required={field.required} className={inputClass} />
        </div>
      );
    case 'number':
      return (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">{field.label} {field.required && '*'}</label>
          <input type="number" value={value} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            min={field.validation?.min} max={field.validation?.max} required={field.required} className={inputClass} />
        </div>
      );
    case 'date':
      return (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">{field.label} {field.required && '*'}</label>
          <input type="date" value={value ? value.split('T')[0] : ''} onChange={(e) => onChange(e.target.value)} required={field.required} className={inputClass} />
        </div>
      );
    case 'boolean':
      return (
        <div className="flex items-center gap-3 py-3">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300" />
          <label className="text-sm font-medium text-slate-700">{field.label}</label>
        </div>
      );
    case 'select':
      return (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">{field.label} {field.required && '*'}</label>
          <select value={value} onChange={(e) => onChange(e.target.value)} required={field.required} className={inputClass}>
            <option value="">Select...</option>
            {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    case 'multiselect':
      return (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">{field.label}</label>
          <select multiple value={Array.isArray(value) ? value : []} onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
            className={`${inputClass} h-24`}>
            {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    default:
      return (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">{field.label}</label>
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
        </div>
      );
  }
}
