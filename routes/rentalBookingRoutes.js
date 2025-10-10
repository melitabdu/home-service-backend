import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js"; // ✅ Use Cloudinary upload
import {
  createRentalBooking,
  getMyRentalBookings,
  getOwnerBookings,
  updateBookingStatusOwner,
  deleteBookingOwner,
} from "../controllers/rentalBookingController.js";
import { protectOwner } from "../middleware/ownerAuthMiddleware.js";

const router = express.Router();

// User creates booking with ID upload
router.post("/", protect, upload.single("idCard"), createRentalBooking);

// ✅ User views their own bookings
router.get("/my-bookings", protect, getMyRentalBookings);

// Owner views bookings
router.get("/owner", protectOwner, getOwnerBookings);

// Owner updates booking status
router.patch("/owner/:bookingId", protectOwner, updateBookingStatusOwner);

// Owner deletes booking
router.delete("/owner/:bookingId", protectOwner, deleteBookingOwner);

export default router;
