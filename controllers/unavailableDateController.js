import express from 'express';
import {
  addUnavailableDate,
  getUnavailableDates,
  deleteUnavailableDate,
  adminAddUnavailableDate,
  adminDeleteUnavailableDate,
} from '../controllers/unavailableDateController.js';
import { protectProvider } from '../middleware/providerAuthMiddleware.js';
import { protectAdmin } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// ✅ Provider manages unavailable dates
router.post('/', protectProvider, addUnavailableDate);
router.get('/', protectProvider, getUnavailableDates);
router.delete('/:dateId', protectProvider, deleteUnavailableDate);

// ✅ Admin manages unavailable dates for ANY provider
router.post('/admin', protectAdmin, adminAddUnavailableDate);
router.delete('/admin/:dateId', protectAdmin, adminDeleteUnavailableDate);

export default router;
