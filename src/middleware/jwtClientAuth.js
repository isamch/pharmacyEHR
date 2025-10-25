import jwt from 'jsonwebtoken';
import { forbidden, unauthorized, badRequest } from '../utils/ApiError.js';
import Client from '../models/client.model.js'; // To fetch the public key
import asyncHandler from '../utils/asyncHandler.js';
import { decode } from '../utils/jwt.js';


// @desc Middleware to authenticate clients using JWTs signed with their private keys
// @route Protected routes for clients
// @access Public
const jwtClientAuth = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw unauthorized('Access denied. Authorization token missing.');
  }

  // 1. Decode Token to find Issuer (Client ID) without verification
  let decodedPayload;
  try {
    
    decodedPayload = decode(token);

    if (!decodedPayload || !decodedPayload.iss) {
      throw new Error('Invalid token structure or missing issuer (iss) claim.');
    }
  } catch (decodeError) {
    throw badRequest(`Invalid token format.`);
  }

  const clientId = decodedPayload.iss; // Client ID from 'iss' claim

  // 2. Fetch Client's Public Key from DB
  const client = await Client.findOne({ _id: clientId, status: 'verified' }).select('+publicKey');

  if (!client || !client.publicKey) {
    throw unauthorized('Authentication failed [Invalid Client or Key Configuration].');
  }
  
  const clientPublicKey = client.publicKey; // The PEM public key stored for the client

  // 3. Verify JWT Signature and Claims using Client's Public Key
  try {
    const verifiedPayload = jwt.verify(token, clientPublicKey, {
      algorithms: ['RS256'], // ONLY allow RS256
      audience: 'pharmacy-service', // Must match 'aud' in client's token
      // Issuer check is implicit via key lookup
    });

    // Attach client info
    req.client = client.toJSON(); // Verified client
    req.jwtPayload = verifiedPayload; // Verified token payload

    console.log(`JWT client auth successful for: ${client.name} (${client.id})`);
    next();

  } catch (verifyError) {
    console.warn(`JWT verification failed for client ${clientId}:`, verifyError.message);
    if (verifyError instanceof jwt.TokenExpiredError) {
      throw unauthorized('Authentication failed [Token Expired].');
    } else {
      throw unauthorized('Authentication failed [Invalid Signature or Token Format].');
    }
  }
});

export default jwtClientAuth;