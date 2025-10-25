import express from 'express';
import * as userController from '../../controllers/admin/user.admin.controller.js';
import * as clientController from '../../controllers/admin/client.admin.controller.js';
import * as roleController from '../../controllers/admin/role.admin.controller.js';
import * as medicationController from '../../controllers/admin/medication.admin.controller.js';
import * as apiTokenController from '../../controllers/admin/apiToken.admin.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireAdmin, requirePermissions } from '../../middleware/permissionMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

// User management routes
router.post('/users', userController.createUser);
router.get('/users', userController.getUsers);
router.get('/users/statistics', userController.getUserStatistics);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.put('/users/:id/change-password', userController.changeUserPassword);
router.put('/users/:id/toggle-status', userController.toggleUserStatus);
router.delete('/users/:id', userController.deleteUser);

// Client management routes
router.post('/clients', clientController.createClient);
router.get('/clients', clientController.getClients);
router.get('/clients/:id', clientController.getClientById);
router.put('/clients/:id', clientController.updateClient);
router.delete('/clients/:id', clientController.deleteClient);

// Role management routes
router.post('/roles', roleController.createRole);
router.get('/roles', roleController.getRoles);
router.get('/roles/permissions', roleController.getAvailablePermissions);
router.get('/roles/statistics', roleController.getRoleStatistics);
router.get('/roles/:id', roleController.getRoleById);
router.put('/roles/:id', roleController.updateRole);
router.delete('/roles/:id', roleController.deleteRole);

// Medication management routes (Admin only)
router.post('/medications', medicationController.createMedication);
router.get('/medications', medicationController.getMedications);
router.get('/medications/categories', medicationController.getMedicationCategories);
router.get('/medications/low-stock', medicationController.getLowStockMedications);
router.get('/medications/statistics', medicationController.getMedicationStatistics);
router.get('/medications/:id', medicationController.getMedicationById);
router.put('/medications/:id', medicationController.updateMedication);
router.put('/medications/:id/stock', medicationController.updateMedicationStock);
router.delete('/medications/:id', medicationController.deleteMedication);

// API Token management routes
router.post('/clients/:clientId/tokens', apiTokenController.generateApiToken);
router.get('/clients/:clientId/tokens', apiTokenController.getClientTokens);
router.get('/tokens', apiTokenController.getAllTokens);
router.get('/tokens/statistics', apiTokenController.getTokenStatistics);
router.get('/tokens/:id', apiTokenController.getTokenById);
router.put('/tokens/:id', apiTokenController.updateApiToken);
router.delete('/tokens/:id', apiTokenController.revokeApiToken);

export default router;
