import express from "express";
import {
  getAllBookingsAdmin,
  updateBookingStatusAdmin,
  markBookingAsPaid,
  deleteBookingAdmin,
} from "../controllers/rentalBookingController.js";
import { verifyAdminSecret } from "../middleware/verifyAdminSecret.js";

const router = express.Router();

/**
 * 🔹 Admin Rental Booking Routes
 * All routes are protected with verifyAdminSecret
 */

// ✅ Get all bookings
router.get("/", verifyAdminSecret, getAllBookingsAdmin);

// ✅ Update booking status (e.g. "awaiting_payment", "processing", "completed", "cancelled")
router.patch("/:bookingId/status", verifyAdminSecret, updateBookingStatusAdmin);

// ✅ Mark booking as paid (reveals customer details to owner + renter)
router.patch("/:bookingId/pay", verifyAdminSecret, markBookingAsPaid);

// ✅ Delete booking (admin can delete any booking anytime)
router.delete("/:bookingId", verifyAdminSecret, deleteBookingAdmin);

export default router;
