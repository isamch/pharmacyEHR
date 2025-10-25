import Client from '../../models/client.model.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import crypto from 'crypto';
import { sendMail } from '../../utils/email.js'; // For sending verification email


// Helper to generate crypto tokens (unchanged)
const generateCryptoToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return { token, hashedToken, expires };
};

/**
 * @desc Register a new client clinic, receiving their Public Key
 * @route POST /api/v1/client/register
 * @access Public
 */
export const registerClient = asyncHandler(async (req, res, next) => {
  const { name, officialEmail, publicKey } = req.body; // <-- Receive public key

  if (!publicKey || !publicKey.trim().startsWith('-----BEGIN PUBLIC KEY-----')) {
    return next(ApiError.badRequest('Valid Public Key (PEM format) is required.'));
  }
  if (await Client.findOne({ officialEmail })) {
    return next(ApiError.conflict('Client with this email already registered.'));
  }

  const { token, hashedToken, expires } = generateCryptoToken();

  // Store the public key (trimmed) along with other details
  await Client.create({
    name,
    officialEmail,
    publicKey: publicKey.trim(), // <-- Store public key
    status: 'pending_verification',
    verificationToken: hashedToken,
    verificationExpires: expires
  });

  // --- Send Verification Email ---
  // try {
  //     const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/client/verify/${token}`;
  //     await sendEmail({ /* ... email details ... */ });
  //     console.log(`Verification email sent to ${officialEmail}. Token: ${token}`);
  // } catch (emailError) { /* ... handle error ... */ }
  console.log(`Client verification token for ${officialEmail}: ${token}`); // For testing

  return successResponse(res, 201, 'Client registration submitted. Please check email for verification.');
});

/**
 * @desc Verify a client clinic via token, activating the stored public key
 * @route GET /api/v1/client/verify/:token
 * @access Public
 */
export const verifyClient = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const client = await Client.findOne({
    verificationToken: hashedToken,
    verificationExpires: { $gt: Date.now() }
  });

  if (!client) {
    return next(ApiError.badRequest('Verification token is invalid or has expired.'));
  }
  if (!client.publicKey) {
    await Client.findByIdAndDelete(client._id);
    return next(ApiError.badRequest('Client registration incomplete (missing public key). Please register again.'));
  }

  client.status = 'verified'; // Mark as verified!
  client.verificationToken = undefined;
  client.verificationExpires = undefined;
  await client.save();

  return successResponse(res, 200, `Client '${client.name}' verified successfully. Client ID: ${client.id}`);
});