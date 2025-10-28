import PharmacyUser from '../../models/user.model.js';
import PharmacyToken from '../../models/token.model.js';
import { 
  successResponse,
  errorResponse,
  isValidEmail,
  isValidPassword,
  sanitizeInput,
  getPagination,
  formatPaginatedResponse
} from '../../utils/helpers.js';

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { role, status, search } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const users = await PharmacyUser.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    const total = await PharmacyUser.countDocuments(query);

    return successResponse(res, 200, 'Users retrieved successfully', 
      formatPaginatedResponse(users, total, page, perPage)
    );

  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse(res, 500, 'Failed to get users', error);
  }
};

/**
 * Get user by ID (Admin only)
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await PharmacyUser.findById(id).select('-password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'User retrieved successfully', { user });

  } catch (error) {
    console.error('Get user by ID error:', error);
    return errorResponse(res, 500, 'Failed to get user', error);
  }
};

/**
 * Create new user (Admin only)
 */
export const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role = 'staff' } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return errorResponse(res, 400, 'Full name, email, and password are required');
    }

    if (!isValidEmail(email)) {
      return errorResponse(res, 400, 'Invalid email format');
    }

    if (!isValidPassword(password)) {
      return errorResponse(res, 400, 'Password must be at least 6 characters');
    }

    if (!['admin', 'pharmacist', 'staff'].includes(role)) {
      return errorResponse(res, 400, 'Invalid role');
    }

    // Check if user already exists
    const existingUser = await PharmacyUser.findOne({ email: sanitizeInput(email) });
    if (existingUser) {
      return errorResponse(res, 409, 'User with this email already exists');
    }

    // Create new user
    const user = await PharmacyUser.create({
      fullName: sanitizeInput(fullName),
      email: sanitizeInput(email),
      password: sanitizeInput(password),
      role: sanitizeInput(role)
    });

    return successResponse(res, 201, 'User created successfully', {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse(res, 500, 'Failed to create user', error);
  }
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, status } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = sanitizeInput(fullName);
    if (email) {
      if (!isValidEmail(email)) {
        return errorResponse(res, 400, 'Invalid email format');
      }
      updateData.email = sanitizeInput(email);
    }
    if (role) {
      if (!['admin', 'pharmacist', 'staff'].includes(role)) {
        return errorResponse(res, 400, 'Invalid role');
      }
      updateData.role = role;
    }
    if (status) {
      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return errorResponse(res, 400, 'Invalid status');
      }
      updateData.status = status;
    }

    const user = await PharmacyUser.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'User updated successfully', { user });

  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(res, 500, 'Failed to update user', error);
  }
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await PharmacyUser.findById(id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return errorResponse(res, 400, 'Cannot delete your own account');
    }

    // Delete user and related tokens
    await PharmacyUser.findByIdAndDelete(id);
    await PharmacyToken.deleteMany({ userId: id });

    return successResponse(res, 200, 'User deleted successfully');

  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse(res, 500, 'Failed to delete user', error);
  }
};

/**
 * Change user password (Admin only)
 */
export const changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return errorResponse(res, 400, 'New password is required');
    }

    if (!isValidPassword(newPassword)) {
      return errorResponse(res, 400, 'Password must be at least 6 characters');
    }

    const user = await PharmacyUser.findById(id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Update password
    user.password = sanitizeInput(newPassword);
    await user.save();

    // Invalidate all user tokens
    await PharmacyToken.deleteMany({ userId: id });

    return successResponse(res, 200, 'Password changed successfully');

  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(res, 500, 'Failed to change password', error);
  }
};

/**
 * Get user statistics (Admin only)
 */
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await PharmacyUser.countDocuments();
    const activeUsers = await PharmacyUser.countDocuments({ status: 'active' });
    const adminUsers = await PharmacyUser.countDocuments({ role: 'admin' });
    const pharmacistUsers = await PharmacyUser.countDocuments({ role: 'pharmacist' });
    const staffUsers = await PharmacyUser.countDocuments({ role: 'staff' });

    const recentUsers = await PharmacyUser.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email role createdAt');

    return successResponse(res, 200, 'User statistics retrieved successfully', {
      stats: {
        totalUsers,
        activeUsers,
        adminUsers,
        pharmacistUsers,
        staffUsers
      },
      recentUsers
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    return errorResponse(res, 500, 'Failed to get user statistics', error);
  }
};
