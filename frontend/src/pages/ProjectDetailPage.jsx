import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { getExpiryInfo } from '../utils/expiry';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [statusEditAsset, setStatusEditAsset] = useState(null);

  const loadProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProject(); }, [id]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!project) return (
    <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
      Project not found
    </div>
  );

  const now = new Date();
  const in10Days = new Date();
  in10Days.setDate(now.getDate() + 10);

  const assets = project.assets || [];
  const activeCount = assets.filter(a => ['available', 'in_use', 'deployed', 'assigned', 'in_stock', 'operational', 'active'].includes(a.status)).length;
  const inRepairCount = assets.filter(a => ['in_repair', 'repair', 'maintenance', 'under_maintenance', 'under_repair'].includes(a.status)).length;
  const inactiveCount = assets.length - activeCount;
  
  const expiringSoon = assets.filter(a => {
    const expiry = a.warranty?.end || a.warranty?.endDate;
    if (!expiry) return false;
    const end = new Date(expiry);
    return end >= now && end <= in10Days;
  }).length;

  const expired = assets.filter(a => {
    const expiry = a.warranty?.end || a.warranty?.endDate;
    if (!expiry) return false;
    return new Date(expiry) < now;
  }).length;

  const handleStatusChange = async (assetId, newStatus, note = 'Status changed from project view') => {
    if (!newStatus) return;
    try {
      await api.patch(`/assets/${assetId}`, { status: newStatus, note });
      loadProject();
      setStatusEditAsset(null);
    } catch(e) {
      alert(e.response?.data?.error?.message || "Failed to change status.");
    }
  };

  const handleReleaseToFreePool = async (assetId) => {
    if(!window.confirm("Release this asset back to the Common Free Pool? It will be immediately available for any other project to use.")) return;
    try {
      await api.patch(`/assets/${assetId}`, { project: null, status: 'available', note: 'Released back to Common Free Pool' });
      loadProject();
    } catch(e) {
      alert("Failed to release asset to free pool");
    }
  };

  const statusBadges = {
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    free: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    in_stock: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    in_use: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
    assigned: 'bg-blue-50 text-blue-700 border-blue-200',
    deployed: 'bg-blue-50 text-blue-700 border-blue-200',
    in_repair: 'bg-amber-50 text-amber-700 border-amber-200',
    under_maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
    retired: 'bg-purple-50 text-purple-700 border-purple-200',
    procured: 'bg-slate-100 text-slate-700 border-slate-200',
    disposed: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="text-xs font-semibold text-orange-600 hover:text-orange-700 mb-2 inline-flex items-center gap-1">
          <span>← Back to Projects</span>
        </Link>
        <div className="flex justify-between items-start flex-wrap gap-4 mt-1">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold border ${project.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {project.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">{project.description || 'No description provided'}</p>
            {project.manager && (
              <p className="text-xs text-slate-500 mt-2">
                Project Manager: <span className="font-semibold text-slate-800">{project.manager.name}</span> ({project.manager.email})
              </p>
            )}
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={() => setShowAssignModal(true)} 
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-orange-50 border border-orange-200 text-sm font-semibold text-orange-600 transition shadow-2xs flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              <span>Assign Free Asset</span>
            </button>
            <Link 
              to={`/assets/new?project=${project._id}`} 
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-sm font-semibold text-white transition shadow-md shadow-orange-500/20 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              <span>Create New Asset</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Project Dashboard KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Assets in Project</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{assets.length}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">{activeCount} Operational / In Use</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="text-xs text-slate-500 uppercase font-semibold">Under Repair / Maintenance</div>
          <div className="text-3xl font-bold text-amber-600 mt-1">{inRepairCount || inactiveCount}</div>
          <div className="text-xs text-slate-400 mt-1">Requires team attention</div>
        </div>
        <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs text-orange-700 uppercase font-semibold">Expiring in 10 Days</div>
          <div className="text-3xl font-bold text-orange-600 mt-1">{expiringSoon}</div>
          <div className="text-xs text-orange-600/80 mt-1 font-medium">Warranty deadline due soon</div>
        </div>
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs text-rose-700 uppercase font-semibold">Expired Deadlines</div>
          <div className="text-3xl font-bold text-rose-600 mt-1">{expired}</div>
          <div className="text-xs text-rose-600/80 mt-1 font-medium">Out of contract validity</div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60 flex-wrap gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Equipment in this Project ({assets.length})</h2>
            <p className="text-xs text-slate-500 mt-0.5">Managers can edit status or return assets to the organization-wide free pool</p>
          </div>
          <button 
            onClick={() => setShowAssignModal(true)} 
            className="px-3.5 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition"
          >
            + Claim from Free Pool
          </button>
        </div>
        
        {assets.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-3">
            <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <p className="text-base text-slate-700 font-semibold">No assets assigned to this project yet.</p>
            <p className="text-xs text-slate-500">You can assign free equipment from the common pool or create new ones.</p>
            <div className="flex justify-center gap-3 pt-2">
              <button 
                onClick={() => setShowAssignModal(true)} 
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-xs font-semibold text-white hover:from-orange-600 hover:to-amber-600 transition shadow-sm"
              >
                Assign Free Asset Now
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-5 py-3.5">Tag</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Duration / Deadline</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {assets.map((asset) => {
                  const exp = getExpiryInfo(asset);
                  const badgeClass = statusBadges[asset.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr key={asset._id} className="hover:bg-orange-50/30 transition">
                      <td className="px-5 py-3.5">
                        <Link to={`/assets/${asset._id}`} className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 hover:underline">
                          {asset.assetTag}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        <Link to={`/assets/${asset._id}`} className="hover:text-orange-600">{asset.name}</Link>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                        {asset.assetType?.name || 'Asset'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${badgeClass}`}>
                            {asset.status?.replace(/_/g, ' ')}
                          </span>
                          <button 
                            onClick={() => setStatusEditAsset(asset)}
                            title="Edit Asset Status"
                            className="p-1 rounded text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition text-xs flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            <span className="text-[11px] underline">Edit Status</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {exp.hasExpiry ? exp.dateFormatted : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${exp.badgeClass}`}>
                          {exp.isExpired && <span>🚫</span>}
                          {exp.isUrgent && <span>⚠️</span>}
                          {exp.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => setStatusEditAsset(asset)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition"
                          >
                            Edit Status
                          </button>
                          <button 
                            onClick={() => handleReleaseToFreePool(asset._id)} 
                            title="Release to Common Free Pool"
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
                          >
                            Release to Pool
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Status Modal */}
      {statusEditAsset && (
        <EditStatusModal 
          asset={statusEditAsset} 
          onClose={() => setStatusEditAsset(null)} 
          onSave={(newStatus, note) => handleStatusChange(statusEditAsset._id, newStatus, note)} 
        />
      )}

      {/* Assign Existing Asset Modal */}
      {showAssignModal && (
        <AssignAssetModal 
          projectId={project._id} 
          currentProjectAssetIds={assets.map(a => a._id)}
          onClose={() => setShowAssignModal(false)} 
          onAssigned={loadProject} 
        />
      )}
    </div>
  );
}

function EditStatusModal({ asset, onClose, onSave }) {
  const typeStates = asset.assetType?.states || [];
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

  const [selectedStatus, setSelectedStatus] = useState(asset.status || 'available');
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
          <div>
            <h2 className="text-base font-bold text-slate-900">Edit Asset Status</h2>
            <p className="text-xs text-orange-600 font-mono mt-0.5 font-bold">{asset.assetTag} • {asset.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Select New Operational Status</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
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
              placeholder="e.g. Completed maintenance, transferred to new team..."
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

function AssignAssetModal({ projectId, currentProjectAssetIds = [], onClose, onAssigned }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    api.get('/assets?limit=200&project=null').then(r => {
      const allAssets = Array.isArray(r.data?.data) ? r.data.data : (r.data?.data?.data || r.data || []);
      const unassigned = allAssets.filter(a => !currentProjectAssetIds.includes(a._id));
      setAssets(unassigned);
    }).catch(console.error).finally(() => setLoading(false));
  }, [projectId]);

  const handleAssign = async (assetId) => {
    setSavingId(assetId);
    try {
      await api.patch(`/assets/${assetId}`, { project: projectId, status: 'in_use', note: 'Assigned to project' });
      onAssigned();
      onClose();
    } catch(err) {
      alert(err.response?.data?.error?.message || "Failed to assign asset");
      setSavingId(null);
    }
  };

  const filteredAssets = assets.filter(a => 
    a.name?.toLowerCase().includes(search.toLowerCase()) || 
    a.assetTag?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Assign Equipment from Common Free Pool</h2>
            <p className="text-xs text-slate-500 mt-0.5">These assets are currently free and available for any project to claim</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* Search Input */}
        <div className="my-3">
          <input 
            type="text" 
            placeholder="Search by equipment name or tag..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
          />
        </div>
        
        <div className="overflow-y-auto flex-1 pr-1 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center text-slate-500 py-12 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-700">No free assets found in the common pool.</p>
              <p className="text-xs text-slate-500 mt-1">Create a new asset or release one from another project to make it available here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredAssets.map(a => (
                <div key={a._id} className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 transition">
                  <div>
                    <div className="text-slate-900 font-bold text-sm flex items-center gap-2">
                      {a.name}
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium capitalize">
                        {a.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-2">
                      <span className="text-orange-600 font-semibold">{a.assetTag}</span>
                      <span>•</span>
                      <span>{a.assetType?.name || 'General Asset'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAssign(a._id)} 
                    disabled={savingId === a._id} 
                    className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl disabled:opacity-50 transition shadow-sm"
                  >
                    {savingId === a._id ? 'Assigning...' : 'Assign to Project'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <span>{filteredAssets.length} free asset{filteredAssets.length === 1 ? '' : 's'} available</span>
          <button onClick={onClose} className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">Close</button>
        </div>
      </div>
    </div>
  );
}
