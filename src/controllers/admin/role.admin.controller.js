import Role from '../../models/role.model.js';
import User from '../../models/user.model.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import getPagination from '../../utils/pagination.js';

/**
 * @desc    Create a new role
 * @route   POST /api/v1/admin/roles
 * @access  Private (Admin only)
 */
export const createRole = asyncHandler(async (req, res, next) => {
  const { name, description, permissions = [] } = req.body;

  if (!name) {
    return next(ApiError.badRequest('Role name is required'));
  }

  // Check if role already exists
  const existingRole = await Role.findOne({ name });
  if (existingRole) {
    return next(ApiError.conflict('Role with this name already exists'));
  }

  const role = await Role.create({
    name,
    description,
    permissions
  });

  return successResponse(res, 201, 'Role created successfully', role);
});

/**
 * @desc    Get all roles
 * @route   GET /api/v1/admin/roles
 * @access  Private (Admin only)
 */
export const getRoles = asyncHandler(async (req, res) => {
  const { page, perPage, skip } = getPagination(req.query);

  const roles = await Role.find()
    .limit(perPage)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Role.countDocuments();

  return successResponse(res, 200, 'Roles retrieved successfully', {
    total,
    page,
    perPage,
    data: roles
  });
});

/**
 * @desc    Get role by ID
 * @route   GET /api/v1/admin/roles/:id
 * @access  Private (Admin only)
 */
export const getRoleById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const role = await Role.findById(id);
  if (!role) {
    return next(ApiError.notFound('Role not found'));
  }

  return successResponse(res, 200, 'Role retrieved successfully', role);
});

/**
 * @desc    Update role
 * @route   PUT /api/v1/admin/roles/:id
 * @access  Private (Admin only)
 */
export const updateRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, permissions } = req.body;

  const role = await Role.findById(id);
  if (!role) {
    return next(ApiError.notFound('Role not found'));
  }

  // Check if name is being changed and if it already exists
  if (name && name !== role.name) {
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return next(ApiError.conflict('Role name already exists'));
    }
  }

  // Update role
  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (permissions !== undefined) updateData.permissions = permissions;

  const updatedRole = await Role.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  return successResponse(res, 200, 'Role updated successfully', updatedRole);
});

/**
 * @desc    Delete role
 * @route   DELETE /api/v1/admin/roles/:id
 * @access  Private (Admin only)
 */
export const deleteRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const role = await Role.findById(id);
  if (!role) {
    return next(ApiError.notFound('Role not found'));
  }

  // Check if role is being used by any users
  const usersWithRole = await User.countDocuments({ role: id });
  if (usersWithRole > 0) {
    return next(ApiError.badRequest('Cannot delete role that is assigned to users'));
  }

  await Role.findByIdAndDelete(id);

  return successResponse(res, 200, 'Role deleted successfully');
});

/**
 * @desc    Get available permissions
 * @route   GET /api/v1/admin/roles/permissions
 * @access  Private (Admin only)
 */
export const getAvailablePermissions = asyncHandler(async (req, res) => {
  const permissions = [
    // User management
    'manage:users',
    'view:users',
    'create:users',
    'update:users',
    'delete:users',
    
    // Client management
    'manage:clients',
    'view:clients',
    'create:clients',
    'update:clients',
    'delete:clients',
    
    // Medication management
    'manage:medications',
    'view:medications',
    'create:medications',
    'update:medications',
    'delete:medications',
    'update:medication-stock',
    
    // Prescription management
    'manage:prescriptions',
    'view:prescriptions',
    'create:prescriptions',
    'update:prescriptions',
    'process:prescriptions',
    
    // Role management
    'manage:roles',
    'view:roles',
    'create:roles',
    'update:roles',
    'delete:roles',
    
    // Reports and analytics
    'view:reports',
    'view:statistics',
    'export:data',
    
    // System administration
    'manage:system',
    'view:logs',
    'manage:settings'
  ];

  return successResponse(res, 200, 'Available permissions retrieved', permissions);
});

/**
 * @desc    Get role statistics
 * @route   GET /api/v1/admin/roles/statistics
 * @access  Private (Admin only)
 */
export const getRoleStatistics = asyncHandler(async (req, res) => {
  const totalRoles = await Role.countDocuments();

  // Get user count for each role
  const rolesWithUserCount = await Role.aggregate([
    {
      $lookup: {
        from: 'pharmacyusers',
        localField: '_id',
        foreignField: 'role',
        as: 'users'
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        permissions: 1,
        userCount: { $size: '$users' }
      }
    }
  ]);

  return successResponse(res, 200, 'Role statistics retrieved', {
    total: totalRoles,
    roles: rolesWithUserCount
  });
});
