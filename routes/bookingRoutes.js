// backend/routes/bookingRoutes.js
import express from 'express';
import {
  createBooking,
  getAllBookings,
  getProviderBookings,
  updateBookingStatus,
  deleteBooking,
  markBookingAsPaid,
} from '../controllers/bookingController.js';

import { protect } from '../middleware/authMiddleware.js';
import { protectProvider } from '../middleware/providerAuthMiddleware.js';
import { verifyAdminSecret } from '../middleware/verifyAdminSecret.js';

const router = express.Router();

// ✅ Customer creates booking
router.post('/', protect, createBooking);

// ✅ Admin views all bookings
router.get('/', getAllBookings);

// ✅ Provider views own bookings
router.get('/provider', protectProvider, getProviderBookings);

// ✅ Provider/Admin updates booking status
router.patch('/:id', updateBookingStatus);

// ✅ Admin marks booking as paid using secret
router.patch('/:id/pay', verifyAdminSecret, markBookingAsPaid);

// ✅ Admin/Provider deletes booking
router.delete('/:id', verifyAdminSecret, deleteBooking); // ✅ updated
export default router;
