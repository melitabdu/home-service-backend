import express from 'express';
import {
  adminAddUnavailableDate,
  adminGetUnavailableDates,
  adminDeleteUnavailableDate,
} from '../controllers/adminUnavailableDateController.js';
import { protectAdmin } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// ✅ Admin adds unavailable date for a provider
router.post('/', protectAdmin, adminAddUnavailableDate);

// ✅ Admin gets all unavailable dates of a provider
router.get('/:providerId', protectAdmin, adminGetUnavailableDates);

// ✅ Admin deletes an unavailable date
router.delete('/:dateId', protectAdmin, adminDeleteUnavailableDate);

export default router;
