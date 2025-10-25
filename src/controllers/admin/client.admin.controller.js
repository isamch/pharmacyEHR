import Client from '../../models/client.model.js';
import { successResponse } from '../../utils/apiResponse.js';
import * as ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import getPagination from '../../utils/pagination.js';

/**
 * @desc Admin creates a new client clinic (alternative to public registration)
 * @route POST /api/v1/admin/clients
 * @access Private (Admin, manage:clients)
 */
export const createClient = asyncHandler(async (req, res, next) => {
    const { name, officialEmail, publicKey, status = 'verified' } = req.body; // Admin can directly verify

    if (!publicKey || !publicKey.trim().startsWith('-----BEGIN PUBLIC KEY-----')) {
        return next(ApiError.badRequest('Valid Public Key (PEM format) is required.'));
    }
    if (await Client.findOne({ officialEmail })) {
        return next(ApiError.conflict('Client with this email already exists.'));
    }

    const client = await Client.create({
        name,
        officialEmail,
        publicKey: publicKey.trim(),
        status // Admin sets status directly
        // No verification token needed if admin creates
    });

    return successResponse(res, 201, 'Client created successfully', client);
});



/**
 * @desc Admin gets a list of client clinics
 * @route GET /api/v1/admin/clients
 * @access Private (Admin, manage:clients)
 */
export const getClients = asyncHandler(async (req, res) => {
    const { page, perPage, skip } = getPagination(req.query);
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const clients = await Client.find(query)
        .limit(perPage)
        .skip(skip)
        .sort({ createdAt: -1 });

    const total = await Client.countDocuments(query);

    return successResponse(res, 200, 'Clients retrieved', { total, page, perPage, data: clients });
});

/**
 * @desc Admin gets a specific client clinic by ID
 * @route GET /api/v1/admin/clients/:id
 * @access Private (Admin, manage:clients)
 */
export const getClientById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    // Select publicKey explicitly if needed for display, otherwise default toJSON hides it
    const client = await Client.findById(id).select('+publicKey');
    if (!client) return next(ApiError.notFound('Client not found'));
    return successResponse(res, 200, 'Client retrieved', client);
});

/**
 * @desc Admin updates a client's status (verify, suspend, reject) or details
 * @route PUT /api/v1/admin/clients/:id
 * @access Private (Admin, manage:clients)
 */
export const updateClient = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name, officialEmail, status, publicKey, contactPerson, phone } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (officialEmail) updateData.officialEmail = officialEmail;
    if (status) updateData.status = status;
    if (publicKey && publicKey.trim().startsWith('-----BEGIN PUBLIC KEY-----')) {
        updateData.publicKey = publicKey.trim();
    }
    if (contactPerson) updateData.contactPerson = contactPerson;
    if (phone) updateData.phone = phone;

    const client = await Client.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!client) return next(ApiError.notFound('Client not found'));

    return successResponse(res, 200, 'Client updated', client);
});

/**
 * @desc Admin deletes a client clinic (soft delete recommended via status)
 * @route DELETE /api/v1/admin/clients/:id
 * @access Private (Admin, manage:clients)
 */
export const deleteClient = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    // Option 1: Hard delete (irreversible)
    // const client = await Client.findByIdAndDelete(id);
    // if (!client) return next(ApiError.notFound('Client not found'));
    // return successResponse(res, 204, 'Client deleted successfully');

    // Option 2: Soft delete (set status to suspended/rejected)
     const client = await Client.findByIdAndUpdate(id, { status: 'suspended' }, { new: true });
     if (!client) return next(ApiError.notFound('Client not found'));
     return successResponse(res, 200, 'Client suspended', client);
});