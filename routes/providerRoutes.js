// backend/routes/providerRoutes.js
import express from 'express';
import Provider from '../models/Provider.js';

const router = express.Router();

// Get all providers (optionally filtered via query param)


router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { serviceCategory: category } : {};
    const providers = await Provider.find(filter);
    res.status(200).json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch providers' });
  }
});

// ✅ NEW: Get providers by category via route param
router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const providers = await Provider.find({ serviceCategory: category });
    res.status(200).json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch providers by category' });
  }
});

export default router;
