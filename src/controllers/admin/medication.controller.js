import Medication from '../../models/medication.model.js';
import { 
  successResponse,
  errorResponse,
  sanitizeInput,
  getPagination,
  formatPaginatedResponse
} from '../../utils/helpers.js';

/**
 * Get all medications
 */
export const getAllMedications = async (req, res) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { search, category, requiresPrescription, inStock } = req.query;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (requiresPrescription !== undefined) {
      query.requiresPrescription = requiresPrescription === 'true';
    }
    if (inStock === 'true') {
      query.stockQuantity = { $gt: 0 };
    }

    // Get medications with pagination
    const medications = await Medication.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(perPage);

    const total = await Medication.countDocuments(query);

    return successResponse(res, 200, 'Medications retrieved successfully', 
      formatPaginatedResponse(medications, total, page, perPage)
    );

  } catch (error) {
    console.error('Get all medications error:', error);
    return errorResponse(res, 500, 'Failed to get medications', error);
  }
};

/**
 * Get medication by ID
 */
export const getMedicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const medication = await Medication.findById(id);
    if (!medication) {
      return errorResponse(res, 404, 'Medication not found');
    }

    return successResponse(res, 200, 'Medication retrieved successfully', { medication });

  } catch (error) {
    console.error('Get medication by ID error:', error);
    return errorResponse(res, 500, 'Failed to get medication', error);
  }
};

/**
 * Create new medication
 */
export const createMedication = async (req, res) => {
  try {
    const { 
      name, 
      code, 
      description, 
      stockQuantity = 0, 
      unit = 'unit', 
      price = 0, 
      requiresPrescription = true, 
      category, 
      supplier 
    } = req.body;

    // Validate required fields
    if (!name) {
      return errorResponse(res, 400, 'Medication name is required');
    }

    // Check if medication already exists
    const existingMedication = await Medication.findOne({ 
      $or: [
        { name: sanitizeInput(name) },
        { code: code ? sanitizeInput(code) : null }
      ]
    });

    if (existingMedication) {
      return errorResponse(res, 409, 'Medication with this name or code already exists');
    }

    // Create new medication
    const medication = await Medication.create({
      name: sanitizeInput(name),
      code: code ? sanitizeInput(code) : undefined,
      description: description ? sanitizeInput(description) : undefined,
      stockQuantity: parseInt(stockQuantity) || 0,
      unit: sanitizeInput(unit),
      price: parseFloat(price) || 0,
      requiresPrescription: Boolean(requiresPrescription),
      category: category ? sanitizeInput(category) : undefined,
      supplier: supplier ? sanitizeInput(supplier) : undefined,
      lastUpdatedBy: req.user.id
    });

    return successResponse(res, 201, 'Medication created successfully', { medication });

  } catch (error) {
    console.error('Create medication error:', error);
    return errorResponse(res, 500, 'Failed to create medication', error);
  }
};

/**
 * Update medication
 */
export const updateMedication = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      code, 
      description, 
      stockQuantity, 
      unit, 
      price, 
      requiresPrescription, 
      category, 
      supplier 
    } = req.body;

    const updateData = { lastUpdatedBy: req.user.id };
    
    if (name) updateData.name = sanitizeInput(name);
    if (code !== undefined) updateData.code = code ? sanitizeInput(code) : undefined;
    if (description !== undefined) updateData.description = description ? sanitizeInput(description) : undefined;
    if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity) || 0;
    if (unit) updateData.unit = sanitizeInput(unit);
    if (price !== undefined) updateData.price = parseFloat(price) || 0;
    if (requiresPrescription !== undefined) updateData.requiresPrescription = Boolean(requiresPrescription);
    if (category !== undefined) updateData.category = category ? sanitizeInput(category) : undefined;
    if (supplier !== undefined) updateData.supplier = supplier ? sanitizeInput(supplier) : undefined;

    const medication = await Medication.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!medication) {
      return errorResponse(res, 404, 'Medication not found');
    }

    return successResponse(res, 200, 'Medication updated successfully', { medication });

  } catch (error) {
    console.error('Update medication error:', error);
    return errorResponse(res, 500, 'Failed to update medication', error);
  }
};

/**
 * Delete medication
 */
export const deleteMedication = async (req, res) => {
  try {
    const { id } = req.params;

    const medication = await Medication.findByIdAndDelete(id);
    if (!medication) {
      return errorResponse(res, 404, 'Medication not found');
    }

    return successResponse(res, 200, 'Medication deleted successfully');

  } catch (error) {
    console.error('Delete medication error:', error);
    return errorResponse(res, 500, 'Failed to delete medication', error);
  }
};

/**
 * Update medication stock
 */
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQuantity, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

    if (stockQuantity === undefined) {
      return errorResponse(res, 400, 'Stock quantity is required');
    }

    const medication = await Medication.findById(id);
    if (!medication) {
      return errorResponse(res, 404, 'Medication not found');
    }

    let newStockQuantity;
    switch (operation) {
      case 'add':
        newStockQuantity = medication.stockQuantity + parseInt(stockQuantity);
        break;
      case 'subtract':
        newStockQuantity = medication.stockQuantity - parseInt(stockQuantity);
        if (newStockQuantity < 0) {
          return errorResponse(res, 400, 'Insufficient stock');
        }
        break;
      case 'set':
      default:
        newStockQuantity = parseInt(stockQuantity);
        break;
    }

    medication.stockQuantity = newStockQuantity;
    medication.lastUpdatedBy = req.user.id;
    await medication.save();

    return successResponse(res, 200, 'Stock updated successfully', { 
      medication: {
        id: medication.id,
        name: medication.name,
        stockQuantity: medication.stockQuantity,
        lastUpdatedBy: medication.lastUpdatedBy
      }
    });

  } catch (error) {
    console.error('Update stock error:', error);
    return errorResponse(res, 500, 'Failed to update stock', error);
  }
};

/**
 * Get low stock medications
 */
export const getLowStockMedications = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const medications = await Medication.find({
      stockQuantity: { $lte: parseInt(threshold) }
    }).sort({ stockQuantity: 1 });

    return successResponse(res, 200, 'Low stock medications retrieved successfully', {
      medications,
      threshold: parseInt(threshold)
    });

  } catch (error) {
    console.error('Get low stock medications error:', error);
    return errorResponse(res, 500, 'Failed to get low stock medications', error);
  }
};

/**
 * Get medication statistics
 */
export const getMedicationStats = async (req, res) => {
  try {
    const totalMedications = await Medication.countDocuments();
    const inStockMedications = await Medication.countDocuments({ stockQuantity: { $gt: 0 } });
    const outOfStockMedications = await Medication.countDocuments({ stockQuantity: 0 });
    const prescriptionRequired = await Medication.countDocuments({ requiresPrescription: true });
    const overTheCounter = await Medication.countDocuments({ requiresPrescription: false });

    // Get category distribution
    const categoryStats = await Medication.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get total inventory value
    const inventoryValue = await Medication.aggregate([
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } } } }
    ]);

    return successResponse(res, 200, 'Medication statistics retrieved successfully', {
      stats: {
        totalMedications,
        inStockMedications,
        outOfStockMedications,
        prescriptionRequired,
        overTheCounter,
        totalInventoryValue: inventoryValue[0]?.totalValue || 0
      },
      categoryStats
    });

  } catch (error) {
    console.error('Get medication stats error:', error);
    return errorResponse(res, 500, 'Failed to get medication statistics', error);
  }
};
