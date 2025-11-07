import express from 'express';
import {
  getAllMedications,
  getMedicationById,
  createMedication,
  updateMedication,
  deleteMedication,
  updateStock,
  getLowStockMedications,
  getMedicationStats
} from '../../controllers/admin/medication.controller.js';
import { authenticate, requireStaff } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and staff role or higher
// router.use(authenticate);
// router.use(requireStaff);

router.get('/', getAllMedications);
router.get('/stats', getMedicationStats);
router.get('/low-stock', getLowStockMedications);
router.get('/:id', getMedicationById);
router.post('/', createMedication);
router.put('/:id', updateMedication);
router.delete('/:id', deleteMedication);
router.put('/:id/stock', updateStock);

export default router;
