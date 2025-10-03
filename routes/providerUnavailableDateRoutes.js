import express from 'express';
import {
  addUnavailableDate,
  getUnavailableDates,
  deleteUnavailableDate,
} from '../controllers/providerUnavailableDateController.js';
import { protectProvider } from '../middleware/providerAuthMiddleware.js';

const router = express.Router();

// ✅ Provider marks date unavailable
router.post('/', protectProvider, addUnavailableDate);

// ✅ Provider gets their unavailable dates
router.get('/', protectProvider, getUnavailableDates);

// ✅ Provider deletes an unavailable date
router.delete('/:dateId', protectProvider, deleteUnavailableDate);

export default router;
