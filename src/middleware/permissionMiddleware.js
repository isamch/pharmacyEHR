import * as ApiError from '../utils/ApiError.js';

/**
 * Middleware to check if user has required permissions
 * @param {string|string[]} requiredPermissions - Permission(s) required
 * @returns {Function} Express middleware function
 */
export const requirePermissions = (requiredPermissions) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Check if user has role
    if (!req.user.role || !req.user.role.permissions) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    const userPermissions = req.user.role.permissions;
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    // Check if user has any of the required permissions
    const hasPermission = permissions.some(permission => userPermissions.includes(permission));

    if (!hasPermission) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (req.user.role?.name !== 'PharmacyAdmin') {
    return next(ApiError.forbidden('Admin access required'));
  }

  next();
};

/**
 * Middleware to check if user has pharmacist or admin role
 */
export const requirePharmacistOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  const allowedRoles = ['PharmacyAdmin', 'Pharmacist'];
  if (!allowedRoles.includes(req.user.role?.name)) {
    return next(ApiError.forbidden('Pharmacist or Admin access required'));
  }

  next();
};

/**
 * Middleware to check if user has technician, pharmacist, or admin role
 */
export const requireStaff = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  const allowedRoles = ['PharmacyAdmin', 'Pharmacist', 'Technician'];
  if (!allowedRoles.includes(req.user.role?.name)) {
    return next(ApiError.forbidden('Staff access required'));
  }

  next();
};

/**
 * Middleware to check if user can manage medications
 */
export const requireMedicationAccess = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  const allowedRoles = ['PharmacyAdmin', 'Pharmacist', 'Technician'];
  if (!allowedRoles.includes(req.user.role?.name)) {
    return next(ApiError.forbidden('Medication access required'));
  }

  next();
};
