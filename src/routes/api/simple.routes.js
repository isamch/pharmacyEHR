import express from 'express';
import {
  createPrescription,
  getAllPrescriptions,
  searchPrescriptionByPatientName,
  updatePrescriptionStatus,
  getAvailableMedications
} from '../../controllers/simple/prescription.controller.js';

const router = express.Router();

// Simple MVP Routes (No authentication required)
router.post('/prescriptions', createPrescription);
router.get('/prescriptions', getAllPrescriptions);
router.get('/prescriptions/search/:patientName', searchPrescriptionByPatientName);
router.put('/prescriptions/:id/status', updatePrescriptionStatus);
router.get('/medications', getAvailableMedications);

export default router;
