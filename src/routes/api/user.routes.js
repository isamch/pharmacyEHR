import express from 'express';
import * as medicationController from '../../controllers/user/medication.user.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireMedicationAccess } from '../../middleware/permissionMiddleware.js';

const router = express.Router();

// All user routes require authentication and medication access
router.use(authMiddleware);
router.use(requireMedicationAccess);

// Medication management routes (for users)
router.get('/medications', medicationController.getMedications);
router.get('/medications/search', medicationController.searchMedications);
router.get('/medications/categories', medicationController.getMedicationCategories);
router.get('/medications/low-stock', medicationController.getLowStockMedications);
router.get('/medications/statistics', medicationController.getMedicationStatistics);
router.get('/medications/:id', medicationController.getMedicationById);
router.put('/medications/:id/stock', medicationController.updateMedicationStock);
router.post('/medications/bulk-update-stock', medicationController.bulkUpdateStock);

export default router;
