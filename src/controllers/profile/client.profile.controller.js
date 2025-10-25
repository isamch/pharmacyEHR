import Client from '../../models/client.model.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { hashPassword, comparePassword } from '../../utils/hashing.js';

/**
 * @desc    Get client profile
 * @route   GET /api/v1/client/profile
 * @access  Private (Client)
 */
export const getProfile = asyncHandler(async (req, res, next) => {
  const clientId = req.user?.id; // From JWT token

  if (!clientId) {
    return next(ApiError.unauthorized('Client not authenticated'));
  }

  const client = await Client.findById(clientId);
  if (!client) {
    return next(ApiError.notFound('Client not found'));
  }

  return successResponse(res, 200, 'Client profile retrieved', {
    id: client.id,
    name: client.name,
    officialEmail: client.officialEmail,
    status: client.status,
    contactPerson: client.contactPerson,
    phone: client.phone,
    createdAt: client.createdAt
  });
});

/**
 * @desc    Update client profile
 * @route   PUT /api/v1/client/profile
 * @access  Private (Client)
 */
export const updateProfile = asyncHandler(async (req, res, next) => {
  const clientId = req.user?.id; // From JWT token
  const { name, contactPerson, phone } = req.body;

  if (!clientId) {
    return next(ApiError.unauthorized('Client not authenticated'));
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (contactPerson) updateData.contactPerson = contactPerson;
  if (phone) updateData.phone = phone;

  const client = await Client.findByIdAndUpdate(
    clientId, 
    updateData, 
    { new: true, runValidators: true }
  );

  if (!client) {
    return next(ApiError.notFound('Client not found'));
  }

  return successResponse(res, 200, 'Profile updated successfully', {
    id: client.id,
    name: client.name,
    officialEmail: client.officialEmail,
    contactPerson: client.contactPerson,
    phone: client.phone
  });
});

/**
 * @desc    Change client password
 * @route   PUT /api/v1/client/change-password
 * @access  Private (Client)
 */
export const changePassword = asyncHandler(async (req, res, next) => {
  const clientId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!clientId) {
    return next(ApiError.unauthorized('Client not authenticated'));
  }

  if (!currentPassword || !newPassword) {
    return next(ApiError.badRequest('Current password and new password are required'));
  }

  if (newPassword.length < 6) {
    return next(ApiError.badRequest('New password must be at least 6 characters long'));
  }

  const client = await Client.findById(clientId).select('+password');
  if (!client) {
    return next(ApiError.notFound('Client not found'));
  }

  if (!(await comparePassword(currentPassword, client.password))) {
    return next(ApiError.unauthorized('Current password is incorrect'));
  }

  client.password = await hashPassword(newPassword);
  await client.save();

  return successResponse(res, 200, 'Password changed successfully');
});

/**
 * @desc    Update client email
 * @route   PUT /api/v1/client/update-email
 * @access  Private (Client)
 */
export const updateEmail = asyncHandler(async (req, res, next) => {
  const clientId = req.user?.id;
  const { newEmail, password } = req.body;

  if (!clientId) {
    return next(ApiError.unauthorized('Client not authenticated'));
  }

  if (!newEmail || !password) {
    return next(ApiError.badRequest('New email and current password are required'));
  }

  // Verify current password
  const client = await Client.findById(clientId).select('+password');
  if (!client) {
    return next(ApiError.notFound('Client not found'));
  }

  if (!(await comparePassword(password, client.password))) {
    return next(ApiError.unauthorized('Current password is incorrect'));
  }

  // Check if new email already exists
  const existingClient = await Client.findOne({ officialEmail: newEmail });
  if (existingClient) {
    return next(ApiError.conflict('Email already exists'));
  }

  // Update email and set status to pending verification
  client.officialEmail = newEmail;
  client.status = 'pending_verification';
  await client.save();

  return successResponse(res, 200, 'Email updated successfully. Please verify your new email.', {
    newEmail: client.officialEmail,
    status: client.status
  });
});

/**
 * @desc    Delete client account
 * @route   DELETE /api/v1/client/delete-account
 * @access  Private (Client)
 */
export const deleteAccount = asyncHandler(async (req, res, next) => {
  const clientId = req.user?.id;
  const { password } = req.body;

  if (!clientId) {
    return next(ApiError.unauthorized('Client not authenticated'));
  }

  if (!password) {
    return next(ApiError.badRequest('Password is required to delete account'));
  }

  // Verify password
  const client = await Client.findById(clientId).select('+password');
  if (!client) {
    return next(ApiError.notFound('Client not found'));
  }

  if (!(await comparePassword(password, client.password))) {
    return next(ApiError.unauthorized('Password is incorrect'));
  }

  // Soft delete - set status to suspended
  client.status = 'suspended';
  await client.save();

  return successResponse(res, 200, 'Account deleted successfully');
});



/**
 * @desc    Get client dashboard data
 * @route   GET /api/v1/client/dashboard
 * @access  Private (Client)
 */
export const getDashboard = asyncHandler(async (req, res, next) => {
  const clientId = req.user?.id;

  if (!clientId) {
    return next(ApiError.unauthorized('Client not authenticated'));
  }

  const client = await Client.findById(clientId);
  if (!client) {
    return next(ApiError.notFound('Client not found'));
  }

  // Here you can add more dashboard data like:
  // - Recent prescriptions
  // - Statistics
  // - Notifications
  // - etc.

  return successResponse(res, 200, 'Dashboard data retrieved', {
    client: {
      id: client.id,
      name: client.name,
      officialEmail: client.officialEmail,
      status: client.status,
      contactPerson: client.contactPerson,
      phone: client.phone
    },
    stats: {
      // Add your statistics here
      totalPrescriptions: 0,
      pendingPrescriptions: 0,
      completedPrescriptions: 0
    },
    recentActivity: [
      // Add recent activity here
    ]
  });
});
