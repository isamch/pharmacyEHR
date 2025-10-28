import express from 'express';
import {
  createPrescription,
  getAllPrescriptions,
  searchPrescriptionByPatientName,
  updatePrescriptionStatus,
  getAvailableMedications
} from '../controllers/simple/prescription.controller.js';

const router = express.Router();

// Create new prescription
router.post('/prescriptions', createPrescription);

// Get all prescriptions
router.get('/prescriptions', getAllPrescriptions);

// Search prescription by patient name
router.get('/prescriptions/search/:patientName', searchPrescriptionByPatientName);

// Update prescription status
router.put('/prescriptions/:id/status', updatePrescriptionStatus);

// Get available medications
router.get('/medications', getAvailableMedications);

export default router;
