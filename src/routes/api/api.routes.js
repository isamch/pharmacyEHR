import express from 'express';
import * as prescriptionController from '../../controllers/api/prescription.api.controller.js';
import { apiTokenAuth, requireApiPermissions } from '../../middleware/apiTokenAuth.js';

const router = express.Router();

// All API routes require API token authentication
router.use(apiTokenAuth);

// Prescription routes
router.post('/prescriptions', 
  requireApiPermissions(['create:prescriptions']), 
  prescriptionController.createPrescription
);

router.get('/prescriptions', 
  requireApiPermissions(['read:prescriptions']), 
  prescriptionController.getClientPrescriptions
);

router.get('/prescriptions/statistics', 
  requireApiPermissions(['read:prescriptions']), 
  prescriptionController.getPrescriptionStatistics
);

router.get('/prescriptions/:id', 
  requireApiPermissions(['read:prescriptions']), 
  prescriptionController.getPrescriptionById
);

router.put('/prescriptions/:id/status', 
  requireApiPermissions(['update:prescriptions']), 
  prescriptionController.updatePrescriptionStatus
);

// Medication routes
router.get('/medications', 
  requireApiPermissions(['read:medications']), 
  prescriptionController.getAvailableMedications
);

export default router;
