import Client from '../../models/client.model.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import crypto from 'crypto';

// Helper
const generateCryptoToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return { token, hashedToken, expires };
};


export const registerClient = asyncHandler(async (req, res, next) => {
  const { name, officialEmail } = req.body;
  if (await Client.findOne({ officialEmail })) {
    return next(ApiError.conflict('Client with this email already registered.'));
  }
  const { token, hashedToken, expires } = generateCryptoToken();
  await Client.create({
    name,
    officialEmail,
    status: 'pending_verification',
    verificationToken: hashedToken,
    verificationExpires: expires
  });

  console.log(`Client verification token for ${officialEmail}: ${token}`);
  return successResponse(res, 201, 'Client registration submitted. Please check email for verification.');
});


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

  client.status = 'verified';
  client.verificationToken = undefined;
  client.verificationExpires = undefined;
  await client.save();
  return successResponse(res, 200, `Client '${client.name}' verified successfully. Client ID: ${client.id}`);
});