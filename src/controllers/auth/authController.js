import User from '../../models/User.js'
import Token from '../../models/Token.js'
import PatientRecord from '../../models/PatientRecord.js'
import Patient from '../../models/Patient.js'
import Role from '../../models/Role.js'

import { sendCookies, clearCookie } from "../../utils/Cookies.js";
import { generateAccessToken, generateRefreshToken, decode, verifyRefreshToken } from '../../utils/jwt.js'
import { successResponse } from '../../utils/apiResponse.js'
import * as ApiError from '../../utils/ApiError.js'
import asyncHandler from '../../utils/asyncHandler.js'
import { sendMail} from '../../utils/email.js'

import { hashPassword, comparePassword, hmacHash } from '../../utils/hashing.js'
import { generateCryptoToken } from '../../utils/generateTokens.js'

import mongoose from 'mongoose'

// --- Helpers (Token Logic) ---
const saveToken = async (userId, refreshToken) => {
  await Token.deleteOne({ userId })
  await Token.create({ userId, token: refreshToken })
}



// --- 1. Register (For Patients Only) ---
export const register = asyncHandler(async (req, res, next) => {
  const { email, fullName, password } = req.body
  if (await User.findOne({ email })) {
    return next(ApiError.conflict('User already exists with this email'))
  }

  // 1. Find the "Patient" role
  const patientRole = await Role.findOne({ name: 'Patient' })
  if (!patientRole) {
    return next(ApiError.badRequest('Patient role not configured. Please contact admin.'))
  }

  const hashedPassword = await hashPassword(password)
  const { token, hashedToken, expires } = generateCryptoToken()

  // 2. Create the user
  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    role: patientRole._id, // <-- Use the role ID
    status: 'pending_verification',
    emailVerificationToken: hashedToken,
    emailVerificationExpires: expires
  })

  // 3. Create the profile
  const newPatientRecord = await PatientRecord.create({})
  await Patient.create({
    patientRecord: newPatientRecord._id,
    userId: user._id
  })

  // (Send Email Logic)
  const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${token}`;
  await sendMail({
    to: user.email,
    subject: "Verify your email",
    templateName: "verification",
    templateData: {
      name: user.fullName,
      link: verificationUrl
    }
  });

  console.log(`Email verification token: ${token}`) // For testing

  return successResponse(res, 201, 'Registration successful. Please check your email.', { userId: user.id })
})



// --- 2. Login (For All Roles) ---
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  // 1. Fetch the user + Fetch the associated Role
  const user = await User.findOne({ email }).select('+password').populate('role')

  if (!user || !user.password || !(await comparePassword(password, user.password))) {
    return next(ApiError.unauthorized('Invalid email or password'))
  }
  if (!user.isEmailVerified) {
    return next(ApiError.forbidden('Please verify your email before logging in.'))
  }
  if (user.status === 'suspended') {
    return next(ApiError.unauthorized('Your account is suspended'))
  }
  if (!user.role) {
    return next(ApiError.unauthorized('User role not found. Contact admin.'))
  }

  // 2. Fetch the profile (Doctor, Patient, etc.)
  let profile = null
  const roleName = user.role.name // 'Doctor', 'Patient'
  if (roleName !== 'Admin') {
    profile = await mongoose.model(roleName).findOne({ userId: user._id })
  }
  if (!profile && roleName !== 'Admin') {
    return next(ApiError.unauthorized('Profile not found for this user.'))
  }

  // 3. Create the JWT Payload
  const payload = {
    id: user.id,
    role: roleName,
    profileId: profile ? profile.id : null,
    permissions: user.role.permissions // <-- Put the permissions in the token
  }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  sendCookies(res, {
    name: "Authorization",
    value: accessToken,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000 // 15 minutes
    }
  });

  sendCookies(res, {
    name: "refreshToken",
    value: refreshToken,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  });

  await saveToken(user.id, refreshToken)
  const accessTokenData = decode(accessToken)

  return successResponse(res, 200, 'Login successful', {
    accessToken,
    refreshToken,
    expiresIn: accessTokenData.exp * 1000 - Date.now()
  })
})


// --- 2.a Refresh Token ---
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


// --- 2.b Logout ---
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



// --- 3. Verify Email ---
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params

  const hashedToken = hmacHash(token);


  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  })
  if (!user) return next(ApiError.badRequest('Token is invalid or has expired'))

  user.isEmailVerified = true
  user.status = 'active'
  user.emailVerificationToken = undefined
  user.emailVerificationExpires = undefined
  await user.save()
  return successResponse(res, 200, 'Email verified successfully.')
})





// --- 4. Forgot Password ---
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body
  const user = await User.findOne({ email })
  if (!user) return next(ApiError.notFound('User not found'))

  const { token, hashedToken, expires } = generateCryptoToken()
  user.passwordResetToken = hashedToken
  user.passwordResetExpires = expires
  await user.save()

  // (Send Email Logic)
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${token}`;
  await sendMail({
    to: user.email,
    subject: "Password Reset Request",
    templateName: "resetPassword",
    templateData: {
      name: user.fullName,
      link: resetUrl
    }
  });

  console.log(`Password reset token: ${token}`) // For testing

  return successResponse(res, 200, 'Password reset token sent to email.')
})


// --- 5. Reset Password ---
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params
  const { password } = req.body

  const hashedToken = hmacHash(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  })
  if (!user) return next(ApiError.badRequest('Token is invalid or has expired'))

  user.password = await hashPassword(password)
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()
  return successResponse(res, 200, 'Password has been reset successfully.')
})