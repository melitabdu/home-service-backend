import express from 'express';
import { getProviderBySlug } from '../controllers/providerPublicController.js';

const router = express.Router();

// 🔗 Public provider page
router.get('/p/:slug', getProviderBySlug);

export default router;
