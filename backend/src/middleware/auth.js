import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { cache } from '../lib/redis.js';

/**
 * Authentication middleware - verifies JWT access token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Access token required' },
      });
    }

    const token = authHeader.split(' ')[1];
    let payload;

    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' },
        });
      }
      return res.status(401).json({
        error: { code: 'INVALID_TOKEN', message: 'Invalid access token' },
      });
    }

    // Check token version (for invalidating all sessions)
    const user = await User.findById(payload.sub)
      .populate('role')
      .lean();

    if (!user) {
      return res.status(401).json({
        error: { code: 'USER_NOT_FOUND', message: 'User no longer exists' },
      });
    }

    if (user.status === 'disabled') {
      return res.status(401).json({
        error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' },
      });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({
        error: { code: 'TOKEN_REVOKED', message: 'Token has been revoked' },
      });
    }

    // Attach user with role permissions to request
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      scope: user.scope,
      permissions: user.role?.permissions || [],
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional auth - sets req.user if token present, but doesn't block
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, next);
};
