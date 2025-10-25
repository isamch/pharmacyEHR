import Medication from '../../models/medication.model.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import getPagination from '../../utils/pagination.js';

/**
 * @desc    Get all medications (for users)
 * @route   GET /api/v1/user/medications
 * @access  Private (PharmacyAdmin, Pharmacist, Technician)
 */
export const getMedications = asyncHandler(async (req, res) => {
  const { page, perPage, skip } = getPagination(req.query);
  const { category, requiresPrescription, search, lowStock } = req.query;

  // Build query
  const query = {};
  if (category) query.category = category;
  if (requiresPrescription !== undefined) query.requiresPrescription = requiresPrescription === 'true';
  if (lowStock === 'true') query.stockQuantity = { $lte: 10 };
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
 * @route   GET /api/v1/user/medications/:id
 * @access  Private (PharmacyAdmin, Pharmacist, Technician)
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
 * @desc    Update medication stock (for users)
 * @route   PUT /api/v1/user/medications/:id/stock
 * @access  Private (PharmacyAdmin, Pharmacist, Technician)
 */
export const updateMedicationStock = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { stockQuantity, operation = 'set' } = req.body;

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
 * @desc    Get low stock medications
 * @route   GET /api/v1/user/medications/low-stock
 * @access  Private (PharmacyAdmin, Pharmacist, Technician)
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
 * @desc    Search medications
 * @route   GET /api/v1/user/medications/search
 * @access  Private (PharmacyAdmin, Pharmacist, Technician)
 */
export const searchMedications = asyncHandler(async (req, res) => {
  const { q, limit = 20 } = req.query;

  if (!q) {
    return next(ApiError.badRequest('Search query is required'));
  }

  const medications = await Medication.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { code: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ]
  })
    .limit(parseInt(limit))
    .select('name code description stockQuantity unit price requiresPrescription category');

  return successResponse(res, 200, 'Search results retrieved', {
    query: q,
    count: medications.length,
    medications
  });
});

/**
 * @desc    Get medication categories
 * @route   GET /api/v1/user/medications/categories
 * @access  Private (PharmacyAdmin, Pharmacist, Technician)
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
 * @desc    Get medication statistics (for users)
 * @route   GET /api/v1/user/medications/statistics
 * @access  Private (PharmacyAdmin, Pharmacist, Technician)
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

  // Get recent updates by current user
  const recentUpdates = await Medication.find({ lastUpdatedBy: req.user.id })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('name stockQuantity updatedAt');

  return successResponse(res, 200, 'Medication statistics retrieved', {
    total: totalMedications,
    totalStockValue: totalStockValue[0]?.totalValue || 0,
    lowStockCount,
    byCategory: medicationsByCategory,
    recentUpdates
  });
});

/**
 * @desc    Bulk update medication stock
 * @route   POST /api/v1/user/medications/bulk-update-stock
 * @access  Private (PharmacyAdmin, Pharmacist, Technician)
 */
export const bulkUpdateStock = asyncHandler(async (req, res, next) => {
  const { updates } = req.body; // Array of { medicationId, stockQuantity, operation }

  if (!Array.isArray(updates) || updates.length === 0) {
    return next(ApiError.badRequest('Updates array is required'));
  }

  const results = [];
  const errors = [];

  for (const update of updates) {
    try {
      const { medicationId, stockQuantity, operation = 'set' } = update;

      const medication = await Medication.findById(medicationId);
      if (!medication) {
        errors.push({ medicationId, error: 'Medication not found' });
        continue;
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
            errors.push({ medicationId, error: 'Insufficient stock' });
            continue;
          }
          break;
        default:
          errors.push({ medicationId, error: 'Invalid operation' });
          continue;
      }

      medication.stockQuantity = newStockQuantity;
      medication.lastUpdatedBy = req.user.id;
      await medication.save();

      results.push({
        medicationId,
        name: medication.name,
        previousStock: medication.stockQuantity - (operation === 'add' ? stockQuantity : -stockQuantity),
        newStock: medication.stockQuantity,
        operation
      });
    } catch (error) {
      errors.push({ medicationId: update.medicationId, error: error.message });
    }
  }

  return successResponse(res, 200, 'Bulk update completed', {
    successful: results.length,
    failed: errors.length,
    results,
    errors
  });
});
