import { verifyAccessToken } from '../utils/jwt.js'
import { unauthorized, forbidden } from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * @desc Middleware to protect routes
 * Verifies JWT and attaches user data and permissions to req.user
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token
  }

  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  // Fallback to cookie if not found in header
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token
  }

  if (!token) throw unauthorized('Not authorized, no token')

  const payload = verifyAccessToken(token)
  if (!payload) throw unauthorized('Not authorized, token invalid')

  // The payload we created in 'login' contains everything we need
  // No need for a database (DB) hit here, this is very fast
  req.user = {
    id: payload.id, // User ID
    role: payload.role, // 'Doctor', 'Admin', etc.
    profileId: payload.profileId, // Doctor ID, Patient ID, etc.
    permissions: payload.permissions || [] // [ 'read:patient', 'create:appointment' ]
  }

  next()
})



/**
 * @desc Middleware to check for a specific permission
 * @param {string} permission - The required permission (e.g., 'create:user')
 * @example router.post('/', protect, authorize('create:user'), createUser)
 */
export const authorize = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions.includes(permission)) {
      throw forbidden(`Forbidden: You do not have the required permission ('${permission}')`)
    }
    next()
  }
}


/**
 * @desc Middleware to check for a specific role (easier way)
 * @param  {...string} roles - Allowed roles (e.g., 'Admin', 'Doctor')
 * @example router.get('/', protect, checkRole('Admin', 'Doctor'), getData)
 */
export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw forbidden(`Forbidden: Your role ('${req.user.role}') is not authorized`)
    }
    next()
  }
}