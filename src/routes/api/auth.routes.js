import express from 'express'
import * as authController from '../../controllers/auth/auth.controller.js'
import * as clientAuthController from '../../controllers/auth/client.auth.controller.js'
import validate from '../../middleware/validatorMiddleware.js'
import * as authValidation from '../../validations/auth.validation.js'

const router = express.Router()

// Staff authentication routes
router.post('/login', validate(authValidation.login), authController.login)
router.post('/refresh', validate(authValidation.refresh), authController.refresh)
router.post('/logout', validate(authValidation.refresh), authController.logout)

// Client authentication routes
router.post('/client/register', clientAuthController.register)
router.get('/client/verify', clientAuthController.verifyEmail)
router.post('/client/login', clientAuthController.login)
router.post('/client/forgot-password', clientAuthController.forgotPassword)
router.post('/client/reset-password', clientAuthController.resetPassword)
router.post('/client/logout', clientAuthController.logout)

export default router