import express from 'express';
import simpleRoutes from './simple.routes.js';

const router = express.Router();

// Simple MVP Routes (No authentication required)
router.use('/', simpleRoutes);

export default router;