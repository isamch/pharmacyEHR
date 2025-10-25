import User from '../../models/user.model.js'; // PharmacyUser model
import Role from '../../models/role.model.js'; // PharmacyRole model
import Token from '../../models/token.model.js'; // PharmacyToken model
import { generateAccessToken, generateRefreshToken, decode, verifyRefreshToken } from '../../utils/jwt.js'; // Uses symmetric keys from .env
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { comparePassword } from '../../utils/hashing.js';
import { sendCookies, clearCookie } from '../../utils/Cookies.js';
import ms from "ms";

// Helper to save refresh token
const saveToken = async (userId, refreshToken) => {
  await Token.deleteOne({ userId });
  await Token.create({ userId, token: refreshToken });
};

/**
 * @desc    Login for Pharmacy Staff
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user and populate their role to get permissions
  const user = await User.findOne({ email }).select('+password').populate('role');

  if (!user || !user.password || !(await comparePassword(password, user.password))) {
    return next(ApiError.unauthorized('Invalid email or password'));
  }
  if (user.status !== 'active') {
    // Could be 'suspended'
    return next(ApiError.unauthorized(`Account is currently ${user.status}.`));
  }
  if (!user.role) {
    // Data inconsistency
    console.error(`User ${user.email} has no assigned role!`);
    return next(ApiError.unauthorized('User role configuration error. Contact admin.'));
  }

  // --- Create JWT Payload with Permissions ---
  const payload = {
    id: user.id,          // Staff User ID
    role: user.role.name, // Role Name (e.g., 'PharmacyAdmin')
    permissions: user.role.permissions || [] // Permissions array
  };
  // --- End Payload Creation ---

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ id: user.id }); // Refresh token only needs ID

  await saveToken(user.id, refreshToken);
  const accessTokenData = decode(accessToken);


  sendCookies(res, {
    name: "Authorization",
    value: accessToken,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: ms(process.env.JWT_ACCESS_EXPIRES_IN)

    }
  });

  sendCookies(res, {
    name: "refreshToken",
    value: refreshToken,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: ms(process.env.JWT_REFRESH_EXPIRES_IN)
    }
  });


  return successResponse(res, 200, 'Staff login successful', {
    accessToken,
    refreshToken,
    expiresIn: accessTokenData.exp * 1000 - Date.now(), // Calculate remaining ms
    user: user.toJSON() // Send user details (without password)
  });
});



/**
 * @desc    Refresh staff access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public (Requires valid refresh token)
 */
export const refresh = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return next(ApiError.unauthorized('No refresh token provided'));

  const existingToken = await Token.findOne({ token: refreshToken });
  if (!existingToken) return next(ApiError.unauthorized('Invalid refresh token'));

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return next(ApiError.unauthorized('Invalid or expired refresh token'));
  }

  const newAccessToken = generateAccessToken(payload);

  sendCookies(res, {
    name: "Authorization",
    value: newAccessToken,
    options: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Strict", maxAge: 15 * 60 * 1000 }
  });

  return successResponse(res, 200, 'Access token refreshed', { accessToken: newAccessToken });
});



/**
 * @desc    Logout staff user
 * @route   POST /api/v1/auth/logout
 * @access  Private (Staff)
 */
export const logout = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(ApiError.unauthorized('User not authenticated'));
  }

  // remove token from database
  await Token.deleteOne({ userId });

  // remove cookies
  clearCookie(res, 'Authorization');
  clearCookie(res, 'refreshToken');

  return successResponse(res, 200, 'Logout successful');
});
