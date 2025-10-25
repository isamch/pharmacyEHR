import jwt from 'jsonwebtoken';
import fs from 'fs';
import { forbidden, unauthorized, badRequest } from '../utils/ApiError.js';
import Client from '../models/client.model.js';
import asyncHandler from '../utils/asyncHandler.js';

// --- Load Pharmacy's PUBLIC Key ONCE for verification ---
let pharmacyPublicKey;
try {
  const publicKeyPath = process.env.PHARMACY_PUBLIC_KEY_PATH;
  if (!publicKeyPath) throw new Error("PHARMACY_PUBLIC_KEY_PATH not set in .env");
  pharmacyPublicKey = fs.readFileSync(publicKeyPath, 'utf8');
  console.log("Pharmacy public key loaded successfully for verifying client JWTs.");
} catch (err) {
  console.error("\x1b[31m%s\x1b[0m", "FATAL ERROR: Could not load pharmacy public key for verification!", err);
  process.exit(1);
}

/**
 * @desc Middleware to authenticate incoming client requests using JWTs
 * issued and signed by THIS pharmacy service (using pharmacy's private key).
 * Verifies the signature using the pharmacy's public key.
 */
const jwtClientAuth = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw unauthorized('Access denied. No token provided.');
  }

  // --- Verify the JWT Signature and Claims using Pharmacy's PUBLIC Key ---
  let verifiedPayload;
  try {
    verifiedPayload = jwt.verify(token, pharmacyPublicKey, {
      algorithms: ['RS256'],         // Verify using the public key
      issuer: 'pharmacy-service',  // Check if WE issued it
    });
  } catch (verifyError) {
    console.warn(`Client JWT verification failed:`, verifyError.message);
    if (verifyError instanceof jwt.TokenExpiredError) {
      throw unauthorized('Authentication failed [Token Expired].');
    } else {
      throw unauthorized('Authentication failed [Invalid Token].');
    }
  }

  // --- Extract Client ID from the verified payload (subject claim) ---
  const clientId = verifiedPayload.sub;
  if (!clientId) {
    throw badRequest('Invalid token payload: Missing subject (sub) claim.');
  }

  // --- Verify Client Exists and is Active ---
  const client = await Client.findOne({ _id: clientId, status: 'verified' });
  if (!client) {
    console.warn(`JWT Auth failed: Client ID '${clientId}' from valid token not found or not verified.`);
    throw unauthorized('Authentication failed [Client Invalid].');
  }

  // Attach client info to request
  req.client = client.toJSON(); // Attach verified client info
  req.jwtPayload = verifiedPayload; // Attach verified payload

  console.log(`JWT client auth successful for: ${client.name} (${client.id})`);
  next();
});

export default jwtClientAuth;