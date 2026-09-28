/**
 * Permission-based access control middleware.
 * Checks if the authenticated user has the required permission(s).
 *
 * @param  {...string} requiredPermissions - One or more permission strings
 * @returns Express middleware
 */
export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const userPermissions = req.user.permissions || [];

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
          required: requiredPermissions,
        },
      });
    }

    next();
  };
};

/**
 * Require ALL listed permissions (AND logic)
 */
export const requireAllPermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const userPermissions = req.user.permissions || [];

    const hasAll = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasAll) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have all required permissions',
          required: requiredPermissions,
        },
      });
    }

    next();
  };
};
