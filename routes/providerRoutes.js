import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import {
  addProvider,
  getAllProviders,
  getProvidersByCategory,
  getProviderBySlug,
  updateProvider,
  deleteProvider,
} from '../controllers/providerController.js';

const router = express.Router();

/////////////////////////////////////////////////
// 🌍 PUBLIC ROUTES
/////////////////////////////////////////////////

// Shareable public link
router.get('/p/:slug', getProviderBySlug);

// Providers by category
router.get('/category/:category', getProvidersByCategory);

/////////////////////////////////////////////////
// 🔐 ADMIN ROUTES
/////////////////////////////////////////////////

router.get('/', getAllProviders);
router.post('/', upload.single('photo'), addProvider);
router.put('/:id', upload.single('photo'), updateProvider);
router.delete('/:id', deleteProvider);

export default router;
