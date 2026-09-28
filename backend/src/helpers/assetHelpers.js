import { Counter } from '../models/Counter.js';
import { Asset } from '../models/Asset.js';

/**
 * Generate next asset tag atomically
 * Format: PREFIX-YEAR-00001 (configurable via tagFormat)
 */
export const nextAssetTag = async (assetType, session = null) => {
  const { prefix, includeYear, padding } = assetType.tagFormat;
  const year = new Date().getFullYear();
  const counterId = includeYear ? `tag:${prefix}:${year}` : `tag:${prefix}`;

  const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
  if (session) opts.session = session;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    opts
  );

  const seqStr = String(counter.seq).padStart(padding, '0');
  return includeYear ? `${prefix}-${year}-${seqStr}` : `${prefix}-${seqStr}`;
};

/**
 * Validate attributes against the type's field definitions
 * Returns an array of error strings (empty = valid)
 */
export const validateAttributes = (assetType, attrs = {}) => {
  const errors = [];
  const activeFields = (assetType.fields || []).filter((f) => f.active !== false);
  const fieldMap = new Map(activeFields.map((f) => [f.key, f]));

  // Reject unknown keys
  for (const key of Object.keys(attrs)) {
    if (!fieldMap.has(key)) {
      errors.push(`Unknown field: '${key}'`);
    }
  }

  // Check required, type, options, validation for each active field
  for (const field of activeFields) {
    const value = attrs[field.key];

    // Required check
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`'${field.label}' is required`);
      continue;
    }

    if (value === undefined || value === null || value === '') continue;

    // Data type checks
    switch (field.dataType) {
      case 'text':
      case 'user':
      case 'location':
        if (typeof value !== 'string') {
          errors.push(`'${field.label}' must be a string`);
        }
        if (field.validation?.maxLength && String(value).length > field.validation.maxLength) {
          errors.push(`'${field.label}' exceeds max length of ${field.validation.maxLength}`);
        }
        if (field.validation?.regex) {
          const regex = new RegExp(field.validation.regex);
          if (!regex.test(String(value))) {
            errors.push(`'${field.label}' does not match required format`);
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`'${field.label}' must be a number`);
        } else {
          if (field.validation?.min !== undefined && value < field.validation.min) {
            errors.push(`'${field.label}' must be at least ${field.validation.min}`);
          }
          if (field.validation?.max !== undefined && value > field.validation.max) {
            errors.push(`'${field.label}' must be at most ${field.validation.max}`);
          }
        }
        break;

      case 'date':
        if (isNaN(Date.parse(value))) {
          errors.push(`'${field.label}' must be a valid date`);
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`'${field.label}' must be a boolean`);
        }
        break;

      case 'select':
        if (field.options && field.options.length > 0 && !field.options.includes(value)) {
          errors.push(`'${field.label}' must be one of: ${field.options.join(', ')}`);
        }
        break;

      case 'multiselect':
        if (!Array.isArray(value)) {
          errors.push(`'${field.label}' must be an array`);
        } else if (field.options && field.options.length > 0) {
          for (const v of value) {
            if (!field.options.includes(v)) {
              errors.push(`'${field.label}' contains invalid option: '${v}'`);
            }
          }
        }
        break;
    }
  }

  return errors;
};

/**
 * Find a valid transition between two states
 */
export const findTransition = (assetType, fromState, toState) => {
  return (assetType.transitions || []).find(
    (t) => t.from === fromState && t.to === toState
  );
};

/**
 * Check if a child can be attached to a parent
 * Returns an error string or null
 */
export const assertCanAttach = async ({ childType, parent, parentType }) => {
  // Parent must be a container
  if (!parentType?.hierarchy?.isContainer) {
    return 'Parent asset type is not a container';
  }

  // Parent cannot itself be a child
  if (parent?.parent) {
    return 'Cannot nest assets more than two levels deep';
  }

  // Child type must be in allowedChildTypes
  const allowedIds = (parentType.hierarchy.allowedChildTypes || []).map((id) =>
    id.toString()
  );
  const childTypeId = (childType._id || childType).toString();
  if (!allowedIds.includes(childTypeId)) {
    return `Asset type '${childType.name || childTypeId}' is not allowed as a child of '${parentType.name}'`;
  }

  // Child cannot be a container
  if (childType?.hierarchy?.isContainer) {
    return 'A container asset cannot be placed inside another container';
  }

  return null;
};

/**
 * Set parent for an asset (attach, move, or detach)
 * Must be called within a transaction
 */
export const setParent = async (asset, newParentId, session) => {
  const oldParentId = asset.parent;

  if (oldParentId && oldParentId.toString() === newParentId?.toString()) {
    return; // No change
  }

  // Decrement old parent's childCount
  if (oldParentId) {
    await Asset.updateOne(
      { _id: oldParentId },
      { $inc: { childCount: -1 } },
      { session }
    );
  }

  // Increment new parent's childCount
  if (newParentId) {
    await Asset.updateOne(
      { _id: newParentId },
      { $inc: { childCount: 1 } },
      { session }
    );
  }

  asset.parent = newParentId || null;
};

/**
 * Build Mongo filter based on user permissions and scope
 */
export const buildAssetFilter = (user) => {
  const filter = { isArchived: { $ne: true } };
  const permissions = user.permissions || [];

  // If user only has asset:read:own, filter to their assigned assets
  if (!permissions.includes('asset:read') && permissions.includes('asset:read:own')) {
    filter['assignment.user'] = user._id;
  }

  // Apply scope restrictions
  if (user.scope?.locations?.length > 0) {
    filter.location = { $in: user.scope.locations };
  }

  if (user.scope?.assetTypes?.length > 0) {
    filter.assetType = { $in: user.scope.assetTypes };
  }

  return filter;
};

/**
 * Check unique field constraint
 */
export const checkUniqueFields = async (assetType, attrs, excludeAssetId = null) => {
  const uniqueFields = (assetType.fields || []).filter((f) => f.unique && f.active);
  const errors = [];

  for (const field of uniqueFields) {
    if (attrs[field.key] !== undefined && attrs[field.key] !== null) {
      const query = {
        assetType: assetType._id,
        [`attributes.${field.key}`]: attrs[field.key],
      };
      if (excludeAssetId) {
        query._id = { $ne: excludeAssetId };
      }
      const existing = await Asset.findOne(query).lean();
      if (existing) {
        errors.push(`'${field.label}' value '${attrs[field.key]}' already exists (tag: ${existing.assetTag})`);
      }
    }
  }

  return errors;
};
