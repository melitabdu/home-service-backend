import express from 'express';
import { getProviderBySlug } from '../controllers/providerPublicController.js';

const router = express.Router();

// 🔗 PUBLIC PROVIDER LINK
router.get('/p/:slug', getProviderBySlug);

export default router;
