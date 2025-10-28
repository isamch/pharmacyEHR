import PharmacyUser from '../../models/user.model.js';
import PharmacyToken from '../../models/token.model.js';
import { 
  generateTokens, 
  verifyToken, 
  generateEmailToken,
  generatePasswordResetToken,
  hashPassword,
  comparePassword,
  successResponse,
  errorResponse,
  isValidEmail,
  isValidPassword,
  sanitizeInput
} from '../../utils/helpers.js';

/**
 * Register new pharmacy user
 */
export const register = async (req, res) => {
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

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token
    await PharmacyToken.create({
      userId: user._id,
      token: refreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Update last login
    await user.updateLastLogin();

    return successResponse(res, 201, 'User registered successfully', {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(res, 500, 'Registration failed', error);
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are required');
    }

    if (!isValidEmail(email)) {
      return errorResponse(res, 400, 'Invalid email format');
    }

    // Find user with password
    const user = await PharmacyUser.findOne({ email: sanitizeInput(email) }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(sanitizeInput(password));
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Check user status
    if (user.status !== 'active') {
      return errorResponse(res, 403, 'Account is not active');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token
    await PharmacyToken.create({
      userId: user._id,
      token: refreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Update last login
    await user.updateLastLogin();

    return successResponse(res, 200, 'Login successful', {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 500, 'Login failed', error);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 400, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if token exists in database
    const tokenDoc = await PharmacyToken.findOne({
      token: refreshToken,
      type: 'refresh',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return errorResponse(res, 401, 'Invalid or expired refresh token');
    }

    // Get user
    const user = await PharmacyUser.findById(decoded.id);
    if (!user || user.status !== 'active') {
      return errorResponse(res, 401, 'User not found or inactive');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Mark old token as used
    tokenDoc.isUsed = true;
    await tokenDoc.save();

    // Save new refresh token
    await PharmacyToken.create({
      userId: user._id,
      token: newRefreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return successResponse(res, 200, 'Token refreshed successfully', {
      accessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse(res, 401, 'Invalid refresh token', error);
  }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Mark refresh token as used
      await PharmacyToken.findOneAndUpdate(
        { token: refreshToken, type: 'refresh' },
        { isUsed: true }
      );
    }

    return successResponse(res, 200, 'Logout successful');

  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, 500, 'Logout failed', error);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await PharmacyUser.findById(req.user.id);
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'Profile retrieved successfully', {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 500, 'Failed to get profile', error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (fullName) updateData.fullName = sanitizeInput(fullName);
    if (email) {
      if (!isValidEmail(email)) {
        return errorResponse(res, 400, 'Invalid email format');
      }
      updateData.email = sanitizeInput(email);
    }

    const user = await PharmacyUser.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'Profile updated successfully', {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, 500, 'Failed to update profile', error);
  }
};
