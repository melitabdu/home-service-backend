// backend/controllers/userBookingController.js
import Booking from '../models/Booking.js';

// ✅ GET my bookings (for logged-in customer)
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('provider', 'name phone serviceCategory')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('❌ My bookings error:', err.message);
    res.status(500).json({ message: 'Failed to load bookings' });
  }
};

// ✅ GET bookings for a provider (for calendar blocking or analytics)
export const getBookingsByProviderId = async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.params.providerId })
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('❌ Provider bookings error:', err.message);
    res.status(500).json({ message: 'Failed to load bookings' });
  }
};
