import express from 'express'
import apiRoutes from './api.js'

const router = express.Router()

// Mount all API routes under the /api/v1 prefix
router.use('/api/v1', apiRoutes)

export default router