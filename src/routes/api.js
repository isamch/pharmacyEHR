import express from 'express'
import authRoutes from './api/auth.routes.js'
import clientProfileRoutes from './api/client.profile.routes.js'

const router = express.Router()

// Public Routes (No 'protect' middleware here)
router.use('/auth', authRoutes)

// Client Profile Routes (Protected routes)
router.use('/client', clientProfileRoutes)

export default router