import Prescription from '../../models/prescription.model.js';
import Medication from '../../models/medication.model.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import getPagination from '../../utils/pagination.js';

/**
 * @desc    Create prescription (from clinic)
 * @route   POST /api/v1/prescriptions
 * @access  Public (API Token required)
 */
export const createPrescription = asyncHandler(async (req, res, next) => {
  const {
    patientId,
    patientName,
    patientAge,
    patientPhone,
    doctorName,
    doctorLicense,
    clinicName,
    medications,
    prescriptionNotes,
    prescriptionDate
  } = req.body;

  // Validate required fields
  if (!patientName || !doctorName || !medications || !Array.isArray(medications)) {
    return next(ApiError.badRequest('Patient name, doctor name, and medications are required'));
  }

  // Validate medications
  for (const med of medications) {
    if (!med.medicationName || !med.quantity || !med.dosage) {
      return next(ApiError.badRequest('Each medication must have name, quantity, and dosage'));
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
    doctorLicense,
    clinicName,
    clientId: req.client.id,
    medications: validatedMedications,
    prescriptionNotes,
    prescriptionDate: prescriptionDate ? new Date(prescriptionDate) : new Date(),
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
 * @desc    Get prescription by ID
 * @route   GET /api/v1/prescriptions/:id
 * @access  Public (API Token required)
 */
export const getPrescriptionById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const prescription = await Prescription.findOne({
    _id: id,
    clientId: req.client.id
  }).populate('medications.medicationId', 'name code description');

  if (!prescription) {
    return next(ApiError.notFound('Prescription not found'));
  }

  return successResponse(res, 200, 'Prescription retrieved successfully', prescription);
});

/**
 * @desc    Get all prescriptions for client
 * @route   GET /api/v1/prescriptions
 * @access  Public (API Token required)
 */
export const getClientPrescriptions = asyncHandler(async (req, res) => {
  const { page, perPage, skip } = getPagination(req.query);
  const { status, patientName, dateFrom, dateTo } = req.query;

  const query = { clientId: req.client.id };
  if (status) query.status = status;
  if (patientName) query.patientName = { $regex: patientName, $options: 'i' };
  if (dateFrom || dateTo) {
    query.prescriptionDate = {};
    if (dateFrom) query.prescriptionDate.$gte = new Date(dateFrom);
    if (dateTo) query.prescriptionDate.$lte = new Date(dateTo);
  }

  const prescriptions = await Prescription.find(query)
    .populate('medications.medicationId', 'name code')
    .limit(perPage)
    .skip(skip)
    .sort({ prescriptionDate: -1 });

  const total = await Prescription.countDocuments(query);

  return successResponse(res, 200, 'Prescriptions retrieved successfully', {
    total,
    page,
    perPage,
    data: prescriptions
  });
});

/**
 * @desc    Update prescription status
 * @route   PUT /api/v1/prescriptions/:id/status
 * @access  Public (API Token required)
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

  const prescription = await Prescription.findOne({
    _id: id,
    clientId: req.client.id
  });

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
 * @desc    Get available medications
 * @route   GET /api/v1/medications
 * @access  Public (API Token required)
 */
export const getAvailableMedications = asyncHandler(async (req, res) => {
  const { page, perPage, skip } = getPagination(req.query);
  const { search, category, requiresPrescription } = req.query;

  const query = { stockQuantity: { $gt: 0 } }; // Only available medications
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ];
  }
  if (category) query.category = category;
  if (requiresPrescription !== undefined) query.requiresPrescription = requiresPrescription === 'true';

  const medications = await Medication.find(query)
    .select('name code description stockQuantity unit price requiresPrescription category')
    .limit(perPage)
    .skip(skip)
    .sort({ name: 1 });

  const total = await Medication.countDocuments(query);

  return successResponse(res, 200, 'Medications retrieved successfully', {
    total,
    page,
    perPage,
    data: medications
  });
});

/**
 * @desc    Get prescription statistics for client
 * @route   GET /api/v1/prescriptions/statistics
 * @access  Public (API Token required)
 */
export const getPrescriptionStatistics = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;

  const matchQuery = { clientId: req.client.id };
  if (dateFrom || dateTo) {
    matchQuery.prescriptionDate = {};
    if (dateFrom) matchQuery.prescriptionDate.$gte = new Date(dateFrom);
    if (dateTo) matchQuery.prescriptionDate.$lte = new Date(dateTo);
  }

  const stats = await Prescription.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalPrescriptions: { $sum: 1 },
        totalCost: { $sum: '$totalCost' },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalPrescriptions: 0,
    totalCost: 0,
    pendingCount: 0,
    completedCount: 0
  };

  return successResponse(res, 200, 'Statistics retrieved successfully', result);
});
