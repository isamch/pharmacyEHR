import ApiToken from '../models/apiToken.model.js';
import Client from '../models/client.model.js';
import * as ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware to authenticate API requests using API tokens
 * Similar to OpenAI API authentication
 */
export const apiTokenAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('API token required. Use: Authorization: Bearer ph_sk_...'));
  }

  const token = authHeader.split(' ')[1];

  // Find API token
  const apiToken = await ApiToken.findOne({ token }).select('+token');
  if (!apiToken) {
    return next(ApiError.unauthorized('Invalid API token'));
  }

  // Check if token is active
  if (!apiToken.isActive) {
    return next(ApiError.unauthorized('API token has been revoked'));
  }

  // Check if token is expired
  if (apiToken.expiresAt < new Date()) {
    return next(ApiError.unauthorized('API token has expired'));
  }

  // Get client information
  const client = await Client.findById(apiToken.clientId);
  if (!client || client.status !== 'verified') {
    return next(ApiError.unauthorized('Client not found or not verified'));
  }

  // Update token usage
  apiToken.lastUsed = new Date();
  apiToken.usageCount += 1;
  await apiToken.save();

  // Attach token and client info to request
  req.apiToken = {
    id: apiToken.id,
    name: apiToken.name,
    permissions: apiToken.permissions,
    clientId: apiToken.clientId
  };
  req.client = client.toJSON();

  next();
});

/**
 * Middleware to check if API token has required permissions
 * @param {string|string[]} requiredPermissions - Permission(s) required
 */
export const requireApiPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.apiToken) {
      return next(ApiError.unauthorized('API token authentication required'));
    }

    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const hasPermission = permissions.some(permission => 
      req.apiToken.permissions.includes(permission)
    );

    if (!hasPermission) {
      return next(ApiError.forbidden('Insufficient API token permissions'));
    }

    next();
  };
};
