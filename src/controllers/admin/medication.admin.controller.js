import Medication from '../../models/medication.model.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import getPagination from '../../utils/pagination.js';

/**
 * @desc    Create a new medication
 * @route   POST /api/v1/admin/medications
 * @access  Private (Admin only)
 */
export const createMedication = asyncHandler(async (req, res, next) => {
  const {
    name,
    code,
    description,
    stockQuantity = 0,
    unit = 'unit',
    price,
    requiresPrescription = true,
    category,
    supplier
  } = req.body;

  if (!name) {
    return next(ApiError.badRequest('Medication name is required'));
  }

  // Check if medication already exists
  const existingMedication = await Medication.findOne({ name });
  if (existingMedication) {
    return next(ApiError.conflict('Medication with this name already exists'));
  }

  // Check if code already exists (if provided)
  if (code) {
    const existingCode = await Medication.findOne({ code });
    if (existingCode) {
      return next(ApiError.conflict('Medication with this code already exists'));
    }
  }

  const medication = await Medication.create({
    name,
    code,
    description,
    stockQuantity,
    unit,
    price,
    requiresPrescription,
    category,
    supplier,
    lastUpdatedBy: req.user.id
  });

  return successResponse(res, 201, 'Medication created successfully', medication);
});

/**
 * @desc    Get all medications
 * @route   GET /api/v1/admin/medications
 * @access  Private (Admin only)
 */
export const getMedications = asyncHandler(async (req, res) => {
  const { page, perPage, skip } = getPagination(req.query);
  const { category, requiresPrescription, search, lowStock } = req.query;

  // Build query
  const query = {};
  if (category) query.category = category;
  if (requiresPrescription !== undefined) query.requiresPrescription = requiresPrescription === 'true';
  if (lowStock === 'true') query.stockQuantity = { $lte: 10 }; // Low stock threshold
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const medications = await Medication.find(query)
    .populate('lastUpdatedBy', 'fullName email')
    .limit(perPage)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Medication.countDocuments(query);

  return successResponse(res, 200, 'Medications retrieved successfully', {
    total,
    page,
    perPage,
    data: medications
  });
});

/**
 * @desc    Get medication by ID
 * @route   GET /api/v1/admin/medications/:id
 * @access  Private (Admin only)
 */
export const getMedicationById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const medication = await Medication.findById(id).populate('lastUpdatedBy', 'fullName email');
  if (!medication) {
    return next(ApiError.notFound('Medication not found'));
  }

  return successResponse(res, 200, 'Medication retrieved successfully', medication);
});

/**
 * @desc    Update medication
 * @route   PUT /api/v1/admin/medications/:id
 * @access  Private (Admin only)
 */
export const updateMedication = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const medication = await Medication.findById(id);
  if (!medication) {
    return next(ApiError.notFound('Medication not found'));
  }

  // Check if name is being changed and if it already exists
  if (updateData.name && updateData.name !== medication.name) {
    const existingMedication = await Medication.findOne({ name: updateData.name });
    if (existingMedication) {
      return next(ApiError.conflict('Medication name already exists'));
    }
  }

  // Check if code is being changed and if it already exists
  if (updateData.code && updateData.code !== medication.code) {
    const existingCode = await Medication.findOne({ code: updateData.code });
    if (existingCode) {
      return next(ApiError.conflict('Medication code already exists'));
    }
  }

  // Add last updated by
  updateData.lastUpdatedBy = req.user.id;

  const updatedMedication = await Medication.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('lastUpdatedBy', 'fullName email');

  return successResponse(res, 200, 'Medication updated successfully', updatedMedication);
});

/**
 * @desc    Update medication stock
 * @route   PUT /api/v1/admin/medications/:id/stock
 * @access  Private (Admin, Pharmacist, Technician)
 */
export const updateMedicationStock = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { stockQuantity, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

  if (stockQuantity === undefined) {
    return next(ApiError.badRequest('Stock quantity is required'));
  }

  const medication = await Medication.findById(id);
  if (!medication) {
    return next(ApiError.notFound('Medication not found'));
  }

  let newStockQuantity;
  switch (operation) {
    case 'set':
      newStockQuantity = stockQuantity;
      break;
    case 'add':
      newStockQuantity = medication.stockQuantity + stockQuantity;
      break;
    case 'subtract':
      newStockQuantity = medication.stockQuantity - stockQuantity;
      if (newStockQuantity < 0) {
        return next(ApiError.badRequest('Insufficient stock'));
      }
      break;
    default:
      return next(ApiError.badRequest('Invalid operation. Use: set, add, or subtract'));
  }

  medication.stockQuantity = newStockQuantity;
  medication.lastUpdatedBy = req.user.id;
  await medication.save();

  await medication.populate('lastUpdatedBy', 'fullName email');

  return successResponse(res, 200, 'Stock updated successfully', {
    id: medication.id,
    name: medication.name,
    previousStock: medication.stockQuantity - (operation === 'add' ? stockQuantity : -stockQuantity),
    newStock: medication.stockQuantity,
    operation,
    updatedBy: medication.lastUpdatedBy
  });
});

/**
 * @desc    Delete medication
 * @route   DELETE /api/v1/admin/medications/:id
 * @access  Private (Admin only)
 */
export const deleteMedication = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const medication = await Medication.findById(id);
  if (!medication) {
    return next(ApiError.notFound('Medication not found'));
  }

  await Medication.findByIdAndDelete(id);

  return successResponse(res, 200, 'Medication deleted successfully');
});

/**
 * @desc    Get medication categories
 * @route   GET /api/v1/admin/medications/categories
 * @access  Private (Admin only)
 */
export const getMedicationCategories = asyncHandler(async (req, res) => {
  const categories = await Medication.distinct('category');
  const categoriesWithCount = await Medication.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return successResponse(res, 200, 'Categories retrieved successfully', {
    categories,
    categoriesWithCount
  });
});

/**
 * @desc    Get low stock medications
 * @route   GET /api/v1/admin/medications/low-stock
 * @access  Private (Admin, Pharmacist, Technician)
 */
export const getLowStockMedications = asyncHandler(async (req, res) => {
  const { threshold = 10 } = req.query;

  const lowStockMedications = await Medication.find({
    stockQuantity: { $lte: parseInt(threshold) }
  })
    .populate('lastUpdatedBy', 'fullName email')
    .sort({ stockQuantity: 1 });

  return successResponse(res, 200, 'Low stock medications retrieved', {
    threshold: parseInt(threshold),
    count: lowStockMedications.length,
    medications: lowStockMedications
  });
});

/**
 * @desc    Get medication statistics
 * @route   GET /api/v1/admin/medications/statistics
 * @access  Private (Admin only)
 */
export const getMedicationStatistics = asyncHandler(async (req, res) => {
  const totalMedications = await Medication.countDocuments();
  const totalStockValue = await Medication.aggregate([
    { $match: { price: { $exists: true, $ne: null } } },
    { $group: { _id: null, totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } } } }
  ]);

  const medicationsByCategory = await Medication.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const lowStockCount = await Medication.countDocuments({ stockQuantity: { $lte: 10 } });

  return successResponse(res, 200, 'Medication statistics retrieved', {
    total: totalMedications,
    totalStockValue: totalStockValue[0]?.totalValue || 0,
    lowStockCount,
    byCategory: medicationsByCategory
  });
});
