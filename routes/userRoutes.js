import express from 'express';
import { getMyBookings } from '../controllers/userBookingControllers.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ GET /api/users/my-bookings
router.get('/my-bookings', protect, getMyBookings);

export default router;
