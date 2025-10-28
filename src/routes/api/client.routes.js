import express from 'express';
import { generateApiToken } from '../../controllers/admin/apiToken.admin.controller.js';
const router = express.Router();

// Endpoint for admin to generate API token for a client (CareFlow)
// POST /api/v1/admin/clients/:clientId/tokens
router.post('/admin/clients/:clientId/tokens', generateApiToken);

export default router;
