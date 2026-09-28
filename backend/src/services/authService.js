import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { AuditLog } from '../models/AuditLog.js';
import { refreshTokenStore } from '../lib/redis.js';
import { AppError } from '../middleware/errorHandler.js';

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      email: user.email,
      role: user.role?.name || user.role,
      tokenVersion: user.tokenVersion,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TTL }
  );
};

const generateRefreshToken = async (user) => {
  const token = jwt.sign(
    { sub: user._id, tokenVersion: user.tokenVersion },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TTL }
  );

  const hash = await bcrypt.hash(token, 4);
  await refreshTokenStore.set(user._id, hash, 7 * 24 * 60 * 60);
  return token;
};

export const signup = async ({ name, email, password, roleId }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError(400, 'USER_EXISTS', 'Email already in use');

  let assignedRole = roleId;
  if (!assignedRole) {
    const defaultRole = await Role.findOne({ name: 'AssetManager' }) || await Role.findOne({ name: 'Admin' }) || await Role.findOne();
    assignedRole = defaultRole?._id;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    email,
    passwordHash: hashedPassword,
    role: assignedRole,
    status: 'active'
  });
  await user.save();
  return { success: true, message: 'User created successfully' };
};

export const login = async ({ email, password, ip, userAgent }) => {
  const user = await User.findOne({ email })
    .select('+passwordHash')
    .populate('role');

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000);
    throw new AppError(423, 'ACCOUNT_LOCKED', `Account is locked. Try again in ${minutesLeft} minutes.`);
  }

  if (user.status === 'disabled') {
    throw new AppError(401, 'ACCOUNT_DISABLED', 'Account is disabled');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    const updates = { $inc: { failedLogins: 1 } };
    if (user.failedLogins + 1 >= LOCKOUT_ATTEMPTS) {
      updates.$set = { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS), failedLogins: 0 };
    }
    await User.updateOne({ _id: user._id }, updates);
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } }
  );

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  await AuditLog.create({
    actor: user._id,
    action: 'login',
    entityKind: 'user',
    entityId: user._id,
    ip,
    userAgent,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      scope: user.scope,
    },
  };
};

export const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError(401, 'NO_TOKEN', 'Refresh token required');
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid refresh token');
  }

  const user = await User.findById(payload.sub).populate('role');
  if (!user || user.status === 'disabled') {
    throw new AppError(401, 'INVALID_TOKEN', 'User not found or disabled');
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    await refreshTokenStore.del(user._id);
    throw new AppError(401, 'TOKEN_REVOKED', 'Token has been revoked');
  }

  const storedHash = await refreshTokenStore.get(user._id);
  if (!storedHash) {
    throw new AppError(401, 'INVALID_TOKEN', 'Refresh token expired');
  }

  const isValid = await bcrypt.compare(refreshToken, storedHash);
  if (!isValid) {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid refresh token');
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user);
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logout = async (userId) => {
  await refreshTokenStore.del(userId);
};

export const getMe = async (userId) => {
  const user = await User.findById(userId)
    .populate('role')
    .populate('department')
    .lean();
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  return user;
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw new AppError(400, 'INVALID_PASSWORD', 'Current password is incorrect');

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.tokenVersion += 1;
  await user.save();

  await refreshTokenStore.del(userId);
  return { message: 'Password changed successfully' };
};
