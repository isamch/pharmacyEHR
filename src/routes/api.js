import express from 'express'
import authRoutes from './api/auth.routes.js'
import clientProfileRoutes from './api/client.profile.routes.js'
import adminRoutes from './api/admin.routes.js'
import userRoutes from './api/user.routes.js'

const router = express.Router()

// Public Routes (No 'protect' middleware here)
router.use('/auth', authRoutes)

// Client Profile Routes (Protected routes)
router.use('/client', clientProfileRoutes)

// Admin Routes (Protected routes - Admin only)
router.use('/admin', adminRoutes)

// User Routes (Protected routes - All authenticated users)
router.use('/user', userRoutes)

export default router