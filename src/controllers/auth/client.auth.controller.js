import Client from '../../models/client.model.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendMail } from '../../utils/email.js';
import { generateCryptoToken } from '../../utils/generateTokens.js';
import { hashPassword, comparePassword } from '../../utils/hashing.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.js';
import { sendCookies, clearCookie } from '../../utils/Cookies.js';
import ms from "ms";

/**
 * @desc    Register a new client clinic (simple registration with password)
 * @route   POST /api/v1/auth/client/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res, next) => {
  const { name, officialEmail, password, contactPerson, phone } = req.body;

  // Validate required fields
  if (!name || !officialEmail || !password) {
    return next(ApiError.badRequest('Name, official email, and password are required'));
  }

  // Validate password strength
  if (password.length < 6) {
    return next(ApiError.badRequest('Password must be at least 6 characters long'));
  }

  // Check if client already exists
  const existingClient = await Client.findOne({ officialEmail });
  if (existingClient) {
    return next(ApiError.conflict('Client with this email already exists'));
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Generate verification token
  const { token, hashedToken, expires } = generateCryptoToken();

  // Create client with password authentication
  const client = await Client.create({
    name,
    officialEmail,
    password: hashedPassword,
    contactPerson,
    phone,
    verificationToken: hashedToken,
    verificationExpires: expires,
    status: 'pending_verification',
    authType: 'password'
  });

  // Send verification email
  try {
    await sendMail({
      to: officialEmail,
      subject: 'Verify Your Pharmacy Client Account',
      templateName: 'clientVerification',
      templateData: {
        clientName: name,
        verificationToken: token,
        verificationUrl: `${req.protocol}://${req.get('host')}/api/v1/client/verify/${token}`
      }
    });
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    // Don't fail registration if email fails, just log it
  }

  return successResponse(res, 201, 'Client registration successful. Please check your email for verification instructions.', {
    id: client.id,
    name: client.name,
    officialEmail: client.officialEmail,
    status: client.status
  });
});




/**
 * @desc    Verify client email
 * @route   GET /api/v1/auth/client/verify
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(ApiError.badRequest('Verification token is required'));
  }

  const client = await Client.findOne({
    verificationToken: token,
    verificationExpires: { $gt: Date.now() }
  });

  if (!client) {
    return next(ApiError.badRequest('Invalid or expired verification token'));
  }

  // Update client status to verified (but still needs security setup)
  client.status = 'verified';
  client.verificationToken = undefined;
  client.verificationExpires = undefined;
  await client.save();

  return successResponse(res, 200, 'Email verified successfully. You can now login with your email and password.', {
    id: client.id,
    name: client.name,
    status: client.status
  });
});




/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/v1/auth/client/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { officialEmail } = req.body;

  if (!officialEmail) {
    return next(ApiError.badRequest('Email is required'));
  }

  const client = await Client.findOne({ officialEmail });
  if (!client) {
    return next(ApiError.notFound('Client not found'));
  }

  // Generate reset token
  const { token, hashedToken, expires } = generateCryptoToken();

  // Save reset token
  client.passwordResetToken = hashedToken;
  client.passwordResetExpires = expires;
  await client.save();

  // Send reset email
  try {
    await sendMail({
      to: officialEmail,
      subject: 'Reset Your Password',
      templateName: 'passwordReset',
      templateData: {
        name: client.name,
        link: `${req.protocol}://${req.get('host')}/api/v1/client/reset-password/${token}`
      }
    });
  } catch (emailError) {
    console.error('Failed to send reset email:', emailError);
    return next(ApiError.internal('Failed to send reset email'));
  }

  return successResponse(res, 200, 'Password reset email sent successfully');
});




/**
 * @desc    Reset password with token
 * @route   POST /api/v1/auth/client/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return next(ApiError.badRequest('Token and new password are required'));
  }

  if (newPassword.length < 6) {
    return next(ApiError.badRequest('Password must be at least 6 characters long'));
  }

  const client = await Client.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!client) {
    return next(ApiError.badRequest('Invalid or expired reset token'));
  }

  // Update password
  client.password = await hashPassword(newPassword);
  client.passwordResetToken = undefined;
  client.passwordResetExpires = undefined;
  await client.save();

  return successResponse(res, 200, 'Password reset successfully');
});




/**
 * @desc    Simple client login with email and password
 * @route   POST /api/v1/auth/client/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res, next) => {
  const { officialEmail, password } = req.body;

  if (!officialEmail || !password) {
    return next(ApiError.badRequest('Email and password are required'));
  }

  // Find client by email with password
  const client = await Client.findOne({ officialEmail }).select('+password');

  if (!client || !client.password || !(await comparePassword(password, client.password))) {
    return next(ApiError.unauthorized('Invalid email or password'));
  }

  if (client.status !== 'verified') {
    return next(ApiError.unauthorized(`Account is ${client.status}. Please verify your email first.`));
  }

  // Generate JWT tokens
  const payload = {
    id: client.id,
    email: client.officialEmail,
    name: client.name,
    type: 'client'
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ id: client.id });

  // Set cookies
  sendCookies(res, {
    name: "clientAuth",
    value: accessToken,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: ms(process.env.JWT_ACCESS_EXPIRES_IN || "15m")
    }
  });

  sendCookies(res, {
    name: "clientRefresh",
    value: refreshToken,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: ms(process.env.JWT_REFRESH_EXPIRES_IN || "7d")
    }
  });

  return successResponse(res, 200, 'Client login successful', {
    accessToken,
    refreshToken,
    client: {
      id: client.id,
      name: client.name,
      officialEmail: client.officialEmail,
      status: client.status
    }
  });
});



/**
 * @desc    Client logout
 * @route   POST /api/v1/auth/client/logout
 * @access  Private (Client)
 */
export const logout = asyncHandler(async (req, res, next) => {
  // Clear cookies
  clearCookie(res, 'clientAuth');
  clearCookie(res, 'clientRefresh');

  return successResponse(res, 200, 'Client logout successful');
});





