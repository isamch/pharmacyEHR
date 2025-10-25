import User from '../../models/user.model.js';
import Role from '../../models/role.model.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { hashPassword } from '../../utils/hashing.js';
import { getPagination } from '../../utils/pagination.js';

/**
 * @desc    Create a new pharmacy user
 * @route   POST /api/v1/admin/users
 * @access  Private (Admin only)
 */
export const createUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, roleId, status = 'active' } = req.body;

  // Validate required fields
  if (!fullName || !email || !password || !roleId) {
    return next(ApiError.badRequest('Full name, email, password, and role are required'));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(ApiError.conflict('User with this email already exists'));
  }

  // Verify role exists
  const role = await Role.findById(roleId);
  if (!role) {
    return next(ApiError.notFound('Role not found'));
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    role: roleId,
    status
  });

  // Populate role for response
  await user.populate('role');

  return successResponse(res, 201, 'User created successfully', user);
});

/**
 * @desc    Get all pharmacy users
 * @route   GET /api/v1/admin/users
 * @access  Private (Admin only)
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { page, perPage, skip } = getPagination(req.query);
  const { status, role } = req.query;

  // Build query
  const query = {};
  if (status) query.status = status;
  if (role) query.role = role;

  const users = await User.find(query)
    .populate('role', 'name description permissions')
    .limit(perPage)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  return successResponse(res, 200, 'Users retrieved successfully', {
    total,
    page,
    perPage,
    data: users
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/admin/users/:id
 * @access  Private (Admin only)
 */
export const getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id).populate('role', 'name description permissions');
  if (!user) {
    return next(ApiError.notFound('User not found'));
  }

  return successResponse(res, 200, 'User retrieved successfully', user);
});

/**
 * @desc    Update user
 * @route   PUT /api/v1/admin/users/:id
 * @access  Private (Admin only)
 */
export const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { fullName, email, roleId, status } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return next(ApiError.notFound('User not found'));
  }

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(ApiError.conflict('Email already exists'));
    }
  }

  // Verify role if being changed
  if (roleId) {
    const role = await Role.findById(roleId);
    if (!role) {
      return next(ApiError.notFound('Role not found'));
    }
  }

  // Update user
  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (email) updateData.email = email;
  if (roleId) updateData.role = roleId;
  if (status) updateData.status = status;

  const updatedUser = await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('role', 'name description permissions');

  return successResponse(res, 200, 'User updated successfully', updatedUser);
});

/**
 * @desc    Change user password
 * @route   PUT /api/v1/admin/users/:id/change-password
 * @access  Private (Admin only)
 */
export const changeUserPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return next(ApiError.badRequest('New password is required'));
  }

  if (newPassword.length < 6) {
    return next(ApiError.badRequest('Password must be at least 6 characters long'));
  }

  const user = await User.findById(id);
  if (!user) {
    return next(ApiError.notFound('User not found'));
  }

  // Hash new password
  user.password = await hashPassword(newPassword);
  await user.save();

  return successResponse(res, 200, 'Password changed successfully');
});

/**
 * @desc    Suspend/Activate user
 * @route   PUT /api/v1/admin/users/:id/toggle-status
 * @access  Private (Admin only)
 */
export const toggleUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return next(ApiError.notFound('User not found'));
  }

  // Toggle status
  user.status = user.status === 'active' ? 'suspended' : 'active';
  await user.save();

  return successResponse(res, 200, `User ${user.status} successfully`, {
    id: user.id,
    status: user.status
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private (Admin only)
 */
export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return next(ApiError.notFound('User not found'));
  }

  // Soft delete - set status to suspended
  user.status = 'suspended';
  await user.save();

  return successResponse(res, 200, 'User deleted successfully');
});

/**
 * @desc    Get user statistics
 * @route   GET /api/v1/admin/users/statistics
 * @access  Private (Admin only)
 */
export const getUserStatistics = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ status: 'active' });
  const suspendedUsers = await User.countDocuments({ status: 'suspended' });

  // Get users by role
  const usersByRole = await User.aggregate([
    {
      $lookup: {
        from: 'pharmacyroles',
        localField: 'role',
        foreignField: '_id',
        as: 'roleInfo'
      }
    },
    {
      $unwind: '$roleInfo'
    },
    {
      $group: {
        _id: '$roleInfo.name',
        count: { $sum: 1 }
      }
    }
  ]);

  return successResponse(res, 200, 'User statistics retrieved', {
    total: totalUsers,
    active: activeUsers,
    suspended: suspendedUsers,
    byRole: usersByRole
  });
});
