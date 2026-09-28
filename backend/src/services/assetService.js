import QRCode from 'qrcode';
import { Asset } from '../models/Asset.js';
import { LifecycleEvent } from '../models/LifecycleEvent.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../middleware/errorHandler.js';
import { getCachedAssetType } from './assetTypeService.js';
import {
  nextAssetTag,
  validateAttributes,
  buildAssetFilter,
  checkUniqueFields,
  assertCanAttach,
} from '../helpers/assetHelpers.js';

/**
 * List assets with cursor-based pagination and filters
 */
export const listAssets = async (query, user) => {
  const {
    cursor, limit = 20, sort = '-createdAt',
    q, type, status, location, department, assignee, warrantyBefore, parent, project,
    ...rest
  } = query;

  const baseFilter = buildAssetFilter(user);
  const conditions = [baseFilter];

  if (q) {
    conditions.push({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { assetTag: { $regex: q, $options: 'i' } },
      ],
    });
  }
  if (type) conditions.push({ assetType: type });
  if (status) conditions.push({ status });
  if (location) conditions.push({ location });
  if (department) conditions.push({ department });
  if (assignee) conditions.push({ 'assignment.user': assignee });
  if (parent === 'null') conditions.push({ parent: null });
  else if (parent) conditions.push({ parent });

  if (project === 'null' || project === 'none' || project === 'unassigned' || project === 'free') {
    conditions.push({
      $or: [{ project: null }, { project: { $exists: false } }],
    });
  } else if (project === 'assigned' || project === 'has_project') {
    conditions.push({ project: { $exists: true, $ne: null } });
  } else if (project) {
    conditions.push({ project });
  }

  if (warrantyBefore) conditions.push({ 'warranty.end': { $lte: new Date(warrantyBefore) } });

  // Attribute filters (attr[key]=value)
  for (const [key, value] of Object.entries(rest)) {
    const match = key.match(/^attr\[(.+)\]$/);
    if (match && !match[1].startsWith('$')) {
      conditions.push({ [`attributes.${match[1]}`]: value });
    }
  }

  const filter = conditions.length === 1 ? conditions[0] : { $and: conditions };

  const lim = Math.min(Number(limit), 100);

  const assets = await Asset.find(filter)
    .populate('assetType', 'name code icon states')
    .populate('location', 'name kind')
    .populate('department', 'name code')
    .populate('project', 'name code status')
    .populate('assignment.user', 'name email')
    .populate('parent', 'name assetTag')
    .sort(sort)
    .limit(lim + 1)
    .lean();

  const hasMore = assets.length > lim;
  const data = hasMore ? assets.slice(0, lim) : assets;
  const nextCursor = hasMore && data.length > 0
    ? `${data[data.length - 1].createdAt.toISOString()}_${data[data.length - 1]._id}`
    : null;

  return { data, nextCursor, hasMore };
};

export const getAssetById = async (id, user) => {
  const filter = buildAssetFilter(user);
  filter._id = id;

  const asset = await Asset.findOne(filter)
    .populate('assetType')
    .populate('location', 'name kind path')
    .populate('department', 'name code')
    .populate('project', 'name code status')
    .populate('assignment.user', 'name email')
    .populate('parent', 'name assetTag assetType')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .lean();

  if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset not found');
  return asset;
};

export const getAssetByTag = async (tag, user) => {
  const filter = buildAssetFilter(user);
  filter.assetTag = tag;

  const asset = await Asset.findOne(filter)
    .populate('assetType')
    .populate('location', 'name kind')
    .populate('department', 'name code')
    .populate('assignment.user', 'name email')
    .lean();

  if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset not found');
  return asset;
};

/**
 * Create a new asset (no transactions - single MongoDB instance)
 */
export const createAsset = async (data, user) => {
  const assetType = await getCachedAssetType(data.assetType);
  if (!assetType) throw new AppError(404, 'NOT_FOUND', 'Asset type not found');
  if (!assetType.isActive) throw new AppError(400, 'TYPE_INACTIVE', 'Asset type is inactive');

  const attrErrors = validateAttributes(assetType, data.attributes || {});
  if (attrErrors.length > 0) {
    throw new AppError(400, 'INVALID_ATTRIBUTES', 'Attribute validation failed', attrErrors);
  }

  const uniqueErrors = await checkUniqueFields(assetType, data.attributes || {});
  if (uniqueErrors.length > 0) {
    throw new AppError(409, 'UNIQUE_VIOLATION', 'Unique field constraint violated', uniqueErrors);
  }

  const initialState = assetType.states.find((s) => s.isInitial);
  if (!initialState) throw new AppError(500, 'NO_INITIAL_STATE', 'Asset type has no initial state');

  // Parent validation
  if (data.parent) {
    const parentAsset = await Asset.findById(data.parent).lean();
    if (!parentAsset) throw new AppError(404, 'NOT_FOUND', 'Parent asset not found');

    const parentType = await getCachedAssetType(parentAsset.assetType);
    const childTypeObj = await getCachedAssetType(data.assetType);
    const error = await assertCanAttach({ childType: childTypeObj, parent: parentAsset, parentType });
    if (error) throw new AppError(400, 'INVALID_PARENT', error);
  }

  const assetTag = await nextAssetTag(assetType);
  const qrCode = await QRCode.toDataURL(assetTag, { width: 200 });

  const asset = await Asset.create({
    assetTag,
    assetType: data.assetType,
    typeVersion: assetType.version,
    name: data.name,
    status: initialState.key,
    attributes: data.attributes || {},
    location: data.location || undefined,
    department: data.department || undefined,
    project: (data.project && data.project !== '' && data.project !== 'null' && data.project !== 'none') ? data.project : null,
    purchase: data.purchase,
    warranty: data.warranty,
    parent: data.parent || null,
    tags: data.tags || [],
    qrCode,
    createdBy: user._id,
    updatedBy: user._id,
  });

  // Update parent childCount
  if (data.parent) {
    await Asset.updateOne({ _id: data.parent }, { $inc: { childCount: 1 } });
  }

  // Lifecycle event
  await LifecycleEvent.create({
    asset: asset._id,
    kind: 'created',
    toStatus: initialState.key,
    actor: user._id,
    note: `Asset created with tag ${assetTag}`,
  });

  await AuditLog.create({
    actor: user._id,
    action: 'create',
    entityKind: 'asset',
    entityId: asset._id,
    after: { assetTag, name: data.name, status: initialState.key },
  });

  return asset;
};

export const updateAsset = async (id, data, user) => {
  const asset = await Asset.findById(id);
  if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset not found');

  const assetType = await getCachedAssetType(asset.assetType);

  if (data.attributes) {
    const merged = { ...asset.attributes, ...data.attributes };
    const attrErrors = validateAttributes(assetType, merged);
    if (attrErrors.length > 0) {
      throw new AppError(400, 'INVALID_ATTRIBUTES', 'Attribute validation failed', attrErrors);
    }
    const uniqueErrors = await checkUniqueFields(assetType, merged, asset._id);
    if (uniqueErrors.length > 0) {
      throw new AppError(409, 'UNIQUE_VIOLATION', 'Unique field constraint violated', uniqueErrors);
    }
    data.attributes = merged;
  }

  const before = asset.toObject();
  const changes = [];
  for (const field of ['name', 'location', 'department', 'project', 'status']) {
    if (data[field] !== undefined && String(data[field]) !== String(before[field])) {
      changes.push({ field, from: before[field], to: data[field] });
    }
  }

  const allowedFields = ['name', 'attributes', 'location', 'department', 'purchase', 'warranty', 'tags'];
  for (const field of allowedFields) {
    if (data[field] !== undefined) asset[field] = data[field];
  }

  // Handle project assignment/unassignment cleanly
  if (data.project !== undefined) {
    if (!data.project || data.project === '' || data.project === 'null' || data.project === 'none' || data.project === 'free') {
      asset.project = null;
    } else {
      asset.project = data.project;
    }
  }

  // Handle direct status update
  if (data.status !== undefined && data.status !== asset.status) {
    const fromStatus = asset.status;
    asset.status = data.status;
    await LifecycleEvent.create({
      asset: asset._id,
      kind: 'status_change',
      fromStatus,
      toStatus: data.status,
      actor: user._id,
      note: data.note || 'Status updated directly',
    });
  }

  asset.updatedBy = user._id;
  await asset.save();

  if (changes.length > 0) {
    await LifecycleEvent.create({ asset: asset._id, kind: 'updated', changes, actor: user._id });
  }

  return asset;
};

export const archiveAsset = async (id, user) => {
  const asset = await Asset.findById(id);
  if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset not found');

  if (asset.childCount > 0) {
    const activeChildren = await Asset.find({ parent: asset._id, isArchived: { $ne: true } })
      .select('assetTag name status').lean();
    if (activeChildren.length > 0) {
      throw new AppError(400, 'HAS_ACTIVE_CHILDREN', 'Cannot archive container with active children', activeChildren);
    }
  }

  asset.isArchived = true;
  asset.updatedBy = user._id;
  await asset.save();

  await LifecycleEvent.create({ asset: asset._id, kind: 'archived', actor: user._id });
  return asset;
};

export const deleteAsset = async (id, user) => {
  const asset = await Asset.findById(id);
  if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset not found');

  if (asset.childCount > 0) {
    throw new AppError(400, 'HAS_CHILDREN', 'Cannot delete asset with children. Reassign or delete children first.');
  }

  // Handle parent childCount if necessary
  if (asset.parent) {
    await Asset.findByIdAndUpdate(asset.parent, { $inc: { childCount: -1 } });
  }

  await Asset.findByIdAndDelete(id);

  // optionally delete lifecycle events, etc.
  await LifecycleEvent.deleteMany({ asset: id });
  
  return { success: true };
};

export const changeAssetStatus = async (id, { toStatus, note }, user) => {
  const asset = await Asset.findById(id);
  if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset not found');

  const assetType = await getCachedAssetType(asset.assetType);
  const currentState = assetType?.states?.find((s) => s.key === asset.status);

  const isAdminOrManager = 
    user.role?.name === 'Admin' || 
    user.role?.name === 'AssetManager' || 
    (user.permissions || []).includes('asset:status') ||
    (user.permissions || []).includes('asset:update') ||
    (user.permissions || []).includes('*') ||
    Boolean(user.role);

  if (currentState?.isFinal && !isAdminOrManager) {
    throw new AppError(400, 'FINAL_STATE', 'Cannot change status from a final state');
  }

  const transition = (assetType?.transitions || []).find(
    (t) => t.from === asset.status && t.to === toStatus
  );

  // If transition not found in predefined list, allow if admin, manager, or role assigned
  if (!transition && !isAdminOrManager) {
    throw new AppError(400, 'INVALID_TRANSITION', `No transition from '${asset.status}' to '${toStatus}'`);
  }

  const fromStatus = asset.status;
  asset.status = toStatus;
  asset.updatedBy = user._id;
  await asset.save();

  await LifecycleEvent.create({
    asset: asset._id,
    kind: 'status_change',
    fromStatus,
    toStatus,
    actor: user._id,
    note: note || 'Status changed',
  });

  return asset;
};

export const getAssetHistory = async (assetId) => {
  return await LifecycleEvent.find({ asset: assetId })
    .populate('actor', 'name email')
    .sort({ at: -1 })
    .lean();
};

export const getAssetQR = async (id) => {
  const asset = await Asset.findById(id).select('assetTag name').lean();
  if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset not found');
  const qrDataUrl = await QRCode.toDataURL(asset.assetTag, { width: 300, margin: 2 });
  return { assetTag: asset.assetTag, name: asset.name, qrCode: qrDataUrl };
};

export const getAssetChildren = async (parentId, query, user) => {
  return listAssets({ ...query, parent: parentId }, user);
};

export const getContainerSummary = async (parentId) => {
  const parent = await Asset.findById(parentId).lean();
  if (!parent) throw new AppError(404, 'NOT_FOUND', 'Asset not found');

  const [byType, byStatus, costAgg] = await Promise.all([
    Asset.aggregate([
      { $match: { parent: parent._id, isArchived: { $ne: true } } },
      { $group: { _id: '$assetType', count: { $sum: 1 } } },
      { $lookup: { from: 'assettypes', localField: '_id', foreignField: '_id', as: 'type' } },
      { $unwind: '$type' },
      { $project: { name: '$type.name', code: '$type.code', count: 1 } },
    ]),
    Asset.aggregate([
      { $match: { parent: parent._id, isArchived: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Asset.aggregate([
      { $match: { parent: parent._id, isArchived: { $ne: true } } },
      { $group: { _id: null, totalCost: { $sum: '$purchase.cost' } } },
    ]),
  ]);

  return { childCount: parent.childCount, byType, byStatus, totalPurchaseCost: costAgg[0]?.totalCost || 0 };
};

export const setAssetParent = async (assetId, parentId, user) => {
  const asset = await Asset.findById(assetId);
  if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset not found');

  if (parentId) {
    const parent = await Asset.findById(parentId);
    if (!parent) throw new AppError(404, 'NOT_FOUND', 'Parent not found');
    const parentType = await getCachedAssetType(parent.assetType);
    const childType = await getCachedAssetType(asset.assetType);
    const error = await assertCanAttach({ childType, parent, parentType });
    if (error) throw new AppError(400, 'INVALID_PARENT', error);
  }

  const oldParent = asset.parent;
  if (oldParent) await Asset.updateOne({ _id: oldParent }, { $inc: { childCount: -1 } });
  if (parentId) await Asset.updateOne({ _id: parentId }, { $inc: { childCount: 1 } });

  asset.parent = parentId || null;
  await asset.save();

  await LifecycleEvent.create({
    asset: asset._id,
    kind: 'parent_changed',
    changes: [{ field: 'parent', from: oldParent, to: parentId }],
    actor: user._id,
  });

  return asset;
};
