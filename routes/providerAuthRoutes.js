// backend/routes/providerAuthRoutes.js
import express from 'express';
import { loginProvider } from '../controllers/providerAuthController.js';

const router = express.Router();

// @route POST /api/providers/login
router.post('/login', loginProvider);

export default router;
