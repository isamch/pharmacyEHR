// Simple prescription controller for MVP
import Prescription from '../../models/prescription.model.js';
import Medication from '../../models/medication.model.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/apiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * Create new prescription from clinic
 * POST /api/prescriptions
 */
export const createPrescription = asyncHandler(async (req, res, next) => {
  const {
    patientId,
    patientName,
    patientAge,
    patientPhone,
    doctorName,
    clinicName,
    clinicCode,
    medications,
    prescriptionNotes
  } = req.body;

  // Validate required fields
  if (!patientName || !doctorName || !clinicCode || !medications || !Array.isArray(medications)) {
    return next(ApiError.badRequest('Patient name, doctor name, clinic code and medications are required'));
  }

  // Validate medications
  for (const med of medications) {
    if (!med.medicationName || !med.quantity || !med.dosage) {
      return next(ApiError.badRequest('Each medication must have name, quantity and dosage'));
    }
  }

  // Check medication availability and calculate total cost
  let totalCost = 0;
  const validatedMedications = [];

  for (const med of medications) {
    const medication = await Medication.findOne({
      $or: [
        { name: { $regex: med.medicationName, $options: 'i' } },
        { code: med.medicationId }
      ]
    });

    if (!medication) {
      return next(ApiError.notFound(`Medication not found: ${med.medicationName}`));
    }

    if (medication.stockQuantity < med.quantity) {
      return next(ApiError.badRequest(`Insufficient stock for ${med.medicationName}. Available: ${medication.stockQuantity}`));
    }

    const medicationCost = medication.price ? medication.price * med.quantity : 0;
    totalCost += medicationCost;

    validatedMedications.push({
      medicationId: medication._id,
      medicationName: medication.name,
      quantity: med.quantity,
      dosage: med.dosage,
      duration: med.duration,
      notes: med.notes,
      price: medication.price,
      totalPrice: medicationCost
    });
  }

  // Create prescription
  const prescription = await Prescription.create({
    patientId: patientId || `patient_${Date.now()}`,
    patientName,
    patientAge,
    patientPhone,
    doctorName,
    clinicName,
    clinicCode,
    medications: validatedMedications,
    prescriptionNotes,
    prescriptionDate: new Date(),
    status: 'pending',
    totalCost
  });

  return successResponse(res, 201, 'Prescription created successfully', {
    prescriptionId: prescription.id,
    status: prescription.status,
    totalCost: prescription.totalCost,
    estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    medications: validatedMedications
  });
});

/**
 * Get all prescriptions
 * GET /api/prescriptions
 */
export const getAllPrescriptions = asyncHandler(async (req, res) => {
  const { status, patientName, clinicCode } = req.query;

  const query = {};
  if (status) query.status = status;
  if (patientName) query.patientName = { $regex: patientName, $options: 'i' };
  if (clinicCode) query.clinicCode = clinicCode;

  const prescriptions = await Prescription.find(query)
    .populate('medications.medicationId', 'name code')
    .sort({ prescriptionDate: -1 });

  return successResponse(res, 200, 'Prescriptions retrieved successfully', prescriptions);
});

/**
 * Search prescription by patient name
 * GET /api/prescriptions/search/:patientName
 */
export const searchPrescriptionByPatientName = asyncHandler(async (req, res, next) => {
  const { patientName } = req.params;


  const prescriptions = await Prescription.find({
    patientName: { $regex: patientName, $options: 'i' },
    status: { $in: ['pending', 'processing', 'ready'] }
  }).populate('medications.medicationId', 'name code');

  if (prescriptions.length === 0) {
    return next(ApiError.notFound('No prescriptions found for this patient'));
  }

  return successResponse(res, 200, 'Prescriptions found', prescriptions);
});

/**
 * Update prescription status
 * PUT /api/prescriptions/:id/status
 */
export const updatePrescriptionStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    return next(ApiError.badRequest('Status is required'));
  }

  const validStatuses = ['pending', 'processing', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return next(ApiError.badRequest('Invalid status'));
  }

  const prescription = await Prescription.findById(id);

  if (!prescription) {
    return next(ApiError.notFound('Prescription not found'));
  }

  prescription.status = status;
  if (notes) prescription.notes = notes;
  prescription.updatedAt = new Date();

  await prescription.save();

  return successResponse(res, 200, 'Prescription status updated successfully', {
    prescriptionId: prescription.id,
    status: prescription.status,
    notes: prescription.notes
  });
});

/**
 * Get available medications
 * GET /api/medications
 */
export const getAvailableMedications = asyncHandler(async (req, res) => {
  const { search, category } = req.query;

  const query = { stockQuantity: { $gt: 0 } }; // Only available medications
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ];
  }
  if (category) query.category = category;

  const medications = await Medication.find(query)
    .select('name code description stockQuantity unit price requiresPrescription category')
    .sort({ name: 1 });

  return successResponse(res, 200, 'Medications retrieved successfully', medications);
});