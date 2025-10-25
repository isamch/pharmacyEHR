import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  updateEmail,
  deleteAccount,
  getDashboard
} from '../../controllers/profile/client.profile.controller.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile management routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.put('/update-email', updateEmail);
router.delete('/delete-account', deleteAccount);

// Dashboard route
router.get('/dashboard', getDashboard);

export default router;
