import express from 'express';

// controllers :
import { home, about } from '../../controllers/homeController.js';

const router = express.Router();

router.get('/', home);
router.get('/about', about);

export default router; 