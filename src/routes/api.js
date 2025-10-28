import express from 'express';
import authRoutes from './api/auth.routes.js';
import adminRoutes from './api/admin.routes.js';
import medicationRoutes from './api/medication.routes.js';
import simpleRoutes from './api/simple.routes.js';

const router = express.Router();

// Authentication routes
router.use('/auth', authRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Medication management routes
router.use('/medications', medicationRoutes);

// Simple MVP routes (No authentication required)
router.use('/', simpleRoutes);

export default router;