import ApiToken from '../../models/apiToken.model.js';
import Client from '../../models/client.model.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import getPagination from '../../utils/pagination.js';
import ms from 'ms';
import dayjs from 'dayjs';

/**
 * @desc    Generate API token for client
 * @route   POST /api/v1/admin/clients/:clientId/tokens
 * @access  Private (Admin only)
 */
export const generateApiToken = asyncHandler(async (req, res, next) => {
  const { clientId } = req.params;
  const { name, permissions, expiresIn = '1y' } = req.body;

  if (!name || !permissions || !Array.isArray(permissions)) {
    return next(ApiError.badRequest('Name and permissions array are required'));
  }

  // Check if client exists
  const client = await Client.findById(clientId);
  if (!client) {
    return next(ApiError.notFound('Client not found'));
  }

  // Calculate expiration date using ms and dayjs
  const msAmount = ms(expiresIn);
  if (!msAmount || typeof msAmount !== 'number' || msAmount <= 0) {
    return next(ApiError.badRequest('Invalid expiration format. Use: 1d, 1w, 1m, 1y'));
  }

  const expiresAt = dayjs().add(msAmount, 'millisecond').toDate();


  // Create API token
  const apiToken = await ApiToken.create({
    clientId,
    name,
    permissions,
    expiresAt
  });

  // Return token only once (for security)
  const tokenResponse = {
    id: apiToken.id,
    name: apiToken.name,
    permissions: apiToken.permissions,
    expiresAt: apiToken.expiresAt,
    token: apiToken.token, // Only returned on creation
    client: {
      id: client.id,
      name: client.name,
      officialEmail: client.officialEmail
    }
  };

  return successResponse(res, 201, 'API token generated successfully', tokenResponse);
});

/**
 * @desc    Get all API tokens for a client
 * @route   GET /api/v1/admin/clients/:clientId/tokens
 * @access  Private (Admin only)
 */
export const getClientTokens = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const { page, perPage, skip } = getPagination(req.query);

  const tokens = await ApiToken.find({ clientId })
    .limit(perPage)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await ApiToken.countDocuments({ clientId });

  return successResponse(res, 200, 'API tokens retrieved successfully', {
    total,
    page,
    perPage,
    data: tokens
  });
});

/**
 * @desc    Get all API tokens
 * @route   GET /api/v1/admin/tokens
 * @access  Private (Admin only)
 */
export const getAllTokens = asyncHandler(async (req, res) => {
  const { page, perPage, skip } = getPagination(req.query);
  const { isActive, clientId } = req.query;

  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (clientId) query.clientId = clientId;

  const tokens = await ApiToken.find(query)
    .populate('clientId', 'name officialEmail')
    .limit(perPage)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await ApiToken.countDocuments(query);

  return successResponse(res, 200, 'API tokens retrieved successfully', {
    total,
    page,
    perPage,
    data: tokens
  });
});

/**
 * @desc    Get API token by ID
 * @route   GET /api/v1/admin/tokens/:id
 * @access  Private (Admin only)
 */
export const getTokenById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const token = await ApiToken.findById(id).populate('clientId', 'name officialEmail');
  if (!token) {
    return next(ApiError.notFound('API token not found'));
  }

  return successResponse(res, 200, 'API token retrieved successfully', token);
});

/**
 * @desc    Update API token
 * @route   PUT /api/v1/admin/tokens/:id
 * @access  Private (Admin only)
 */
export const updateApiToken = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, permissions, isActive } = req.body;

  const token = await ApiToken.findById(id);
  if (!token) {
    return next(ApiError.notFound('API token not found'));
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (permissions) updateData.permissions = permissions;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updatedToken = await ApiToken.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('clientId', 'name officialEmail');

  return successResponse(res, 200, 'API token updated successfully', updatedToken);
});

/**
 * @desc    Revoke API token
 * @route   DELETE /api/v1/admin/tokens/:id
 * @access  Private (Admin only)
 */
export const revokeApiToken = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const token = await ApiToken.findById(id);
  if (!token) {
    return next(ApiError.notFound('API token not found'));
  }

  // Soft delete - deactivate token
  token.isActive = false;
  await token.save();

  return successResponse(res, 200, 'API token revoked successfully');
});

/**
 * @desc    Get API token statistics
 * @route   GET /api/v1/admin/tokens/statistics
 * @access  Private (Admin only)
 */
export const getTokenStatistics = asyncHandler(async (req, res) => {
  const totalTokens = await ApiToken.countDocuments();
  const activeTokens = await ApiToken.countDocuments({ isActive: true });
  const expiredTokens = await ApiToken.countDocuments({ 
    expiresAt: { $lt: new Date() },
    isActive: true 
  });

  // Get tokens by client
  const tokensByClient = await ApiToken.aggregate([
    {
      $lookup: {
        from: 'clients',
        localField: 'clientId',
        foreignField: '_id',
        as: 'client'
      }
    },
    {
      $unwind: '$client'
    },
    {
      $group: {
        _id: '$client.name',
        tokenCount: { $sum: 1 },
        activeTokens: {
          $sum: { $cond: ['$isActive', 1, 0] }
        }
      }
    }
  ]);

  return successResponse(res, 200, 'Token statistics retrieved', {
    total: totalTokens,
    active: activeTokens,
    expired: expiredTokens,
    byClient: tokensByClient
  });
});
