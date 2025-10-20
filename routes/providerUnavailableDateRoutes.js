import express from 'express';
import {
  addUnavailableDate,
  getUnavailableDates,
  getUnavailableDatesByProvider,
  deleteUnavailableDate,
} from '../controllers/providerUnavailableDateController.js';
import { protectProvider } from '../middleware/providerAuthMiddleware.js';

const router = express.Router();

// ✅ Provider marks date unavailable
router.post('/', protectProvider, addUnavailableDate);

// ✅ Provider gets their own unavailable dates
router.get('/', protectProvider, getUnavailableDates);

// ✅ Customer can fetch unavailable dates by providerId
router.get('/:providerId', getUnavailableDatesByProvider);

// ✅ Provider deletes an unavailable date
router.delete('/:dateId', protectProvider, deleteUnavailableDate);

export default router;
