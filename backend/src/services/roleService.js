import { Role } from '../models/Role.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../middleware/errorHandler.js';
import { cache } from '../lib/redis.js';

export const listRoles = async () => {
  return await Role.find().sort('name').lean();
};

export const getRoleById = async (id) => {
  const role = await Role.findById(id).lean();
  if (!role) throw new AppError(404, 'NOT_FOUND', 'Role not found');
  return role;
};

export const createRole = async (data, actorId) => {
  const role = await Role.create(data);

  await AuditLog.create({
    actor: actorId,
    action: 'create',
    entityKind: 'role',
    entityId: role._id,
    after: { name: role.name },
  });

  return role;
};

export const updateRole = async (id, data, actorId) => {
  const role = await Role.findById(id);
  if (!role) throw new AppError(404, 'NOT_FOUND', 'Role not found');
  if (role.isSystem) {
    throw new AppError(403, 'FORBIDDEN', 'System roles cannot be modified');
  }

  const before = role.toObject();
  Object.assign(role, data);
  await role.save();

  // Invalidate role cache
  await cache.del(`role:${id}`);

  await AuditLog.create({
    actor: actorId,
    action: 'update',
    entityKind: 'role',
    entityId: role._id,
    before: { name: before.name, permissions: before.permissions },
    after: { name: role.name, permissions: role.permissions },
  });

  return role;
};

export const deleteRole = async (id, actorId) => {
  const role = await Role.findById(id);
  if (!role) throw new AppError(404, 'NOT_FOUND', 'Role not found');
  if (role.isSystem) {
    throw new AppError(403, 'FORBIDDEN', 'System roles cannot be deleted');
  }

  await role.deleteOne();
  await cache.del(`role:${id}`);

  await AuditLog.create({
    actor: actorId,
    action: 'delete',
    entityKind: 'role',
    entityId: id,
  });

  return { message: 'Role deleted successfully' };
};
