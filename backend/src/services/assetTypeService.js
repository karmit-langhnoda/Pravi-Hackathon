import { AssetType } from '../models/AssetType.js';
import { AuditLog } from '../models/AuditLog.js';
import { cache } from '../lib/redis.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get cached asset type or fetch from DB
 */
export const getCachedAssetType = async (id) => {
  const cacheKey = `atype:${id}`;
  let assetType = await cache.get(cacheKey);

  if (!assetType) {
    assetType = await AssetType.findById(id).lean();
    if (assetType) {
      await cache.set(cacheKey, assetType, 300); // cache 5 min
    }
  }

  return assetType;
};

export const listAssetTypes = async (query = {}) => {
  const filter = {};
  if (query.active !== undefined) {
    filter.isActive = query.active === 'true';
  }
  if (query.category) {
    filter.category = query.category;
  }

  return await AssetType.find(filter)
    .populate('hierarchy.allowedChildTypes', 'name code icon')
    .sort('name')
    .lean();
};

export const getAssetTypeById = async (id) => {
  const assetType = await AssetType.findById(id)
    .populate('hierarchy.allowedChildTypes', 'name code icon')
    .lean();
  if (!assetType) throw new AppError(404, 'NOT_FOUND', 'Asset type not found');
  return assetType;
};

/**
 * Get form schema for dynamic form rendering
 */
export const getFormSchema = async (id) => {
  const assetType = await getCachedAssetType(id);
  if (!assetType) throw new AppError(404, 'NOT_FOUND', 'Asset type not found');

  const activeFields = (assetType.fields || [])
    .filter((f) => f.active !== false)
    .sort((a, b) => a.order - b.order);

  const initialState = (assetType.states || []).find((s) => s.isInitial);

  return {
    typeId: assetType._id,
    typeName: assetType.name,
    typeCode: assetType.code,
    fields: activeFields,
    states: assetType.states,
    initialState: initialState?.key,
    hierarchy: assetType.hierarchy,
    version: assetType.version,
  };
};

/**
 * Get allowed child types for a container type
 */
export const getAllowedChildren = async (id) => {
  const assetType = await AssetType.findById(id)
    .populate('hierarchy.allowedChildTypes', 'name code icon category')
    .lean();
  if (!assetType) throw new AppError(404, 'NOT_FOUND', 'Asset type not found');
  if (!assetType.hierarchy?.isContainer) {
    throw new AppError(400, 'NOT_CONTAINER', 'This asset type is not a container');
  }
  return assetType.hierarchy.allowedChildTypes || [];
};

export const createAssetType = async (data, actorId) => {
  // Validate: exactly one initial state
  const initialStates = (data.states || []).filter((s) => s.isInitial);
  if (initialStates.length !== 1) {
    throw new AppError(400, 'INVALID_STATES', 'Exactly one initial state is required');
  }

  // Validate transitions reference existing states
  const stateKeys = new Set((data.states || []).map((s) => s.key));
  for (const t of data.transitions || []) {
    if (!stateKeys.has(t.from)) {
      throw new AppError(400, 'INVALID_TRANSITION', `Transition 'from' state '${t.from}' does not exist`);
    }
    if (!stateKeys.has(t.to)) {
      throw new AppError(400, 'INVALID_TRANSITION', `Transition 'to' state '${t.to}' does not exist`);
    }
  }

  // Validate field keys are unique
  const fieldKeys = (data.fields || []).map((f) => f.key);
  const uniqueKeys = new Set(fieldKeys);
  if (fieldKeys.length !== uniqueKeys.size) {
    throw new AppError(400, 'DUPLICATE_FIELD_KEY', 'Field keys must be unique');
  }

  const assetType = await AssetType.create({ ...data, version: 1 });

  await AuditLog.create({
    actor: actorId,
    action: 'create',
    entityKind: 'assetType',
    entityId: assetType._id,
    after: { name: assetType.name, code: assetType.code },
  });

  return assetType;
};

export const updateAssetType = async (id, data, actorId) => {
  const assetType = await AssetType.findById(id);
  if (!assetType) throw new AppError(404, 'NOT_FOUND', 'Asset type not found');

  const before = { name: assetType.name, version: assetType.version };

  // Re-validate states and transitions if provided
  if (data.states) {
    const initialStates = data.states.filter((s) => s.isInitial);
    if (initialStates.length !== 1) {
      throw new AppError(400, 'INVALID_STATES', 'Exactly one initial state is required');
    }
  }

  if (data.transitions) {
    const states = data.states || assetType.states;
    const stateKeys = new Set(states.map((s) => s.key));
    for (const t of data.transitions) {
      if (!stateKeys.has(t.from) || !stateKeys.has(t.to)) {
        throw new AppError(400, 'INVALID_TRANSITION', 'Transition references a non-existent state');
      }
    }
  }

  // Field key uniqueness
  if (data.fields) {
    const fieldKeys = data.fields.map((f) => f.key);
    if (new Set(fieldKeys).size !== fieldKeys.length) {
      throw new AppError(400, 'DUPLICATE_FIELD_KEY', 'Field keys must be unique');
    }
  }

  Object.assign(assetType, data);
  assetType.version += 1; // Bump version
  await assetType.save();

  // Invalidate cache
  await cache.del(`atype:${id}`);

  await AuditLog.create({
    actor: actorId,
    action: 'update',
    entityKind: 'assetType',
    entityId: assetType._id,
    before,
    after: { name: assetType.name, version: assetType.version },
  });

  return assetType;
};

export const deactivateAssetType = async (id, actorId) => {
  const assetType = await AssetType.findById(id);
  if (!assetType) throw new AppError(404, 'NOT_FOUND', 'Asset type not found');

  assetType.isActive = false;
  await assetType.save();

  await cache.del(`atype:${id}`);

  await AuditLog.create({
    actor: actorId,
    action: 'deactivate',
    entityKind: 'assetType',
    entityId: assetType._id,
  });

  return assetType;
};

/**
 * Get import template columns for this type
 */
export const getImportTemplate = async (id) => {
  const assetType = await getCachedAssetType(id);
  if (!assetType) throw new AppError(404, 'NOT_FOUND', 'Asset type not found');

  const columns = [
    'name',
    ...assetType.fields.filter((f) => f.active).map((f) => f.key),
    'location',
    'department',
    'purchase_cost',
    'purchase_vendor',
    'warranty_end',
    'parent_tag',
  ];

  return {
    typeName: assetType.name,
    columns,
    fields: assetType.fields.filter((f) => f.active),
  };
};
