import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'pharmacy_jwt_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'pharmacy_refresh_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate JWT tokens
 */
export function generateTokens(user) {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    status: user.status
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
  });

  return { accessToken, refreshToken };
}

/**
 * Verify JWT token
 */
export function verifyToken(token, secret = JWT_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate random token
 */
export function generateRandomToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate email verification token
 */
export function generateEmailToken() {
  return generateRandomToken(32);
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken() {
  return generateRandomToken(32);
}

/**
 * Hash password
 */
export async function hashPassword(password) {
  const bcrypt = await import('bcryptjs');
  return await bcrypt.hash(password, 12);
}

/**
 * Compare password
 */
export async function comparePassword(password, hashedPassword) {
  const bcrypt = await import('bcryptjs');
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate success response
 */
export function successResponse(res, statusCode = 200, message = 'Success', data = null) {
  const response = {
    status: 'success',
    message
  };
  
  if (data) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Generate error response
 */
export function errorResponse(res, statusCode = 500, message = 'Internal Server Error', error = null) {
  const response = {
    status: 'error',
    message
  };
  
  if (process.env.NODE_ENV === 'development' && error) {
    response.stack = error.stack;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password) {
  return password && password.length >= 6;
}

/**
 * Sanitize input
 */
export function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.trim();
  }
  return input;
}

/**
 * Generate pagination info
 */
export function getPagination(query) {
  const page = parseInt(query.page) || 1;
  const perPage = Math.min(parseInt(query.perPage) || 20, 100);
  const skip = (page - 1) * perPage;
  
  return { page, perPage, skip };
}

/**
 * Format paginated response
 */
export function formatPaginatedResponse(data, total, page, perPage) {
  return {
    data,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      hasNext: page < Math.ceil(total / perPage),
      hasPrev: page > 1
    }
  };
}
