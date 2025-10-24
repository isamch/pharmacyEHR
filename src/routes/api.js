import express from 'express'
import authRoutes from './api/auth.routes.js'

const router = express.Router()

// Public Routes (No 'protect' middleware here)
router.use('/auth', authRoutes)


export default router