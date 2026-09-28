import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../middleware/errorHandler.js';

export const listUsers = async (query) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    role,
    department,
    sort = '-createdAt',
  } = query;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) filter.status = status;
  if (role) filter.role = role;
  if (department) filter.department = department;

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('role', 'name permissions')
      .populate('department', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    data: users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate('role', 'name permissions')
    .populate('department', 'name code')
    .lean();

  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  return user;
};

export const createUser = async (data, actorId) => {
  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    ...data,
    passwordHash,
    password: undefined,
  });

  await AuditLog.create({
    actor: actorId,
    action: 'create',
    entityKind: 'user',
    entityId: user._id,
    after: { name: user.name, email: user.email },
  });

  const populated = await User.findById(user._id)
    .populate('role', 'name permissions')
    .populate('department', 'name code')
    .lean();

  return populated;
};

export const updateUser = async (id, data, actorId) => {
  const user = await User.findById(id);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

  const before = user.toObject();

  // If password is being changed, hash it
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 12);
    delete data.password;
  }

  Object.assign(user, data);
  await user.save();

  await AuditLog.create({
    actor: actorId,
    action: 'update',
    entityKind: 'user',
    entityId: user._id,
    before: { name: before.name, email: before.email, status: before.status },
    after: { name: user.name, email: user.email, status: user.status },
  });

  const populated = await User.findById(user._id)
    .populate('role', 'name permissions')
    .populate('department', 'name code')
    .lean();

  return populated;
};

export const deleteUser = async (id, actorId) => {
  const user = await User.findById(id);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

  // Soft delete by disabling
  user.status = 'disabled';
  await user.save();

  await AuditLog.create({
    actor: actorId,
    action: 'disable',
    entityKind: 'user',
    entityId: user._id,
    after: { status: 'disabled' },
  });

  return { message: 'User disabled successfully' };
};
