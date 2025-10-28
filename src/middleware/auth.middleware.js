import { verifyToken } from '../utils/helpers.js';
import PharmacyUser from '../models/user.model.js';

/**
 * Authentication middleware
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await PharmacyUser.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check user status
    if (user.status !== 'active') {
      return res.status(403).json({
        status: 'error',
        message: 'Account is not active'
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Authorization middleware - Admin only
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * Authorization middleware - Admin or Pharmacist
 */
export const requireAdminOrPharmacist = (req, res, next) => {
  if (!['admin', 'pharmacist'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Admin or Pharmacist access required'
    });
  }
  next();
};

/**
 * Authorization middleware - Staff or higher
 */
export const requireStaff = (req, res, next) => {
  if (!['admin', 'pharmacist', 'staff'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Staff access required'
    });
  }
  next();
};

/**
 * Optional authentication middleware
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      const user = await PharmacyUser.findById(decoded.id);
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
