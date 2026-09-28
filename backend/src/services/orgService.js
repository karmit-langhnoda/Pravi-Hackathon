import { Department } from '../models/Department.js';
import { Location } from '../models/Location.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../middleware/errorHandler.js';

// ==================== DEPARTMENTS ====================

export const listDepartments = async () => {
  return await Department.find()
    .populate('head', 'name email')
    .populate('parent', 'name code')
    .sort('name')
    .lean();
};

export const getDepartmentTree = async () => {
  const departments = await Department.find()
    .populate('head', 'name email')
    .sort('name')
    .lean();

  // Build tree structure
  const map = {};
  const roots = [];
  departments.forEach((d) => {
    map[d._id.toString()] = { ...d, children: [] };
  });
  departments.forEach((d) => {
    if (d.parent) {
      const parentId = d.parent.toString();
      if (map[parentId]) {
        map[parentId].children.push(map[d._id.toString()]);
      }
    } else {
      roots.push(map[d._id.toString()]);
    }
  });

  return roots;
};

export const getDepartmentById = async (id) => {
  const dept = await Department.findById(id)
    .populate('head', 'name email')
    .populate('parent', 'name code')
    .lean();
  if (!dept) throw new AppError(404, 'NOT_FOUND', 'Department not found');
  return dept;
};

export const createDepartment = async (data, actorId) => {
  const dept = await Department.create(data);

  await AuditLog.create({
    actor: actorId,
    action: 'create',
    entityKind: 'department',
    entityId: dept._id,
    after: { name: dept.name, code: dept.code },
  });

  return dept;
};

export const updateDepartment = async (id, data, actorId) => {
  const dept = await Department.findById(id);
  if (!dept) throw new AppError(404, 'NOT_FOUND', 'Department not found');

  const before = { name: dept.name, code: dept.code };
  Object.assign(dept, data);
  await dept.save();

  await AuditLog.create({
    actor: actorId,
    action: 'update',
    entityKind: 'department',
    entityId: dept._id,
    before,
    after: { name: dept.name, code: dept.code },
  });

  return dept;
};

export const deleteDepartment = async (id, actorId) => {
  const dept = await Department.findById(id);
  if (!dept) throw new AppError(404, 'NOT_FOUND', 'Department not found');

  // Check for child departments
  const children = await Department.countDocuments({ parent: id });
  if (children > 0) {
    throw new AppError(400, 'HAS_CHILDREN', 'Cannot delete department with sub-departments');
  }

  await dept.deleteOne();

  await AuditLog.create({
    actor: actorId,
    action: 'delete',
    entityKind: 'department',
    entityId: id,
  });

  return { message: 'Department deleted successfully' };
};

// ==================== LOCATIONS ====================

export const listLocations = async () => {
  return await Location.find()
    .populate('parent', 'name kind')
    .sort('name')
    .lean();
};

export const getLocationTree = async () => {
  const locations = await Location.find().sort('name').lean();

  const map = {};
  const roots = [];
  locations.forEach((l) => {
    map[l._id.toString()] = { ...l, children: [] };
  });
  locations.forEach((l) => {
    if (l.parent) {
      const parentId = l.parent.toString();
      if (map[parentId]) {
        map[parentId].children.push(map[l._id.toString()]);
      }
    } else {
      roots.push(map[l._id.toString()]);
    }
  });

  return roots;
};

export const getLocationById = async (id) => {
  const loc = await Location.findById(id)
    .populate('parent', 'name kind')
    .lean();
  if (!loc) throw new AppError(404, 'NOT_FOUND', 'Location not found');
  return loc;
};

export const createLocation = async (data, actorId) => {
  const loc = new Location(data);
  await loc.save();

  await AuditLog.create({
    actor: actorId,
    action: 'create',
    entityKind: 'location',
    entityId: loc._id,
    after: { name: loc.name, kind: loc.kind },
  });

  return loc;
};

export const updateLocation = async (id, data, actorId) => {
  const loc = await Location.findById(id);
  if (!loc) throw new AppError(404, 'NOT_FOUND', 'Location not found');

  const before = { name: loc.name, kind: loc.kind };
  Object.assign(loc, data);
  await loc.save(); // triggers pre-save for path recalculation

  await AuditLog.create({
    actor: actorId,
    action: 'update',
    entityKind: 'location',
    entityId: loc._id,
    before,
    after: { name: loc.name, kind: loc.kind },
  });

  return loc;
};

export const deleteLocation = async (id, actorId) => {
  const loc = await Location.findById(id);
  if (!loc) throw new AppError(404, 'NOT_FOUND', 'Location not found');

  const children = await Location.countDocuments({ parent: id });
  if (children > 0) {
    throw new AppError(400, 'HAS_CHILDREN', 'Cannot delete location with child locations');
  }

  await loc.deleteOne();

  await AuditLog.create({
    actor: actorId,
    action: 'delete',
    entityKind: 'location',
    entityId: id,
  });

  return { message: 'Location deleted successfully' };
};
