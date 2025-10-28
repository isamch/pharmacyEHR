import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile
} from '../../controllers/auth/auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
