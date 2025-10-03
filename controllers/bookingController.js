import Booking from '../models/Booking.js';
import Provider from '../models/Provider.js';
import UnavailableDate from '../models/UnavailableDate.js';
import { io } from '../server.js';

// 1. Create a new booking
export const createBooking = async (req, res) => {
  const { providerId, date, address, location, customerName, customerPhone } = req.body;

  try {
    if (!req.user || !req.user._id)
      return res.status(401).json({ message: 'Unauthorized' });

    if (!providerId || !date || !address || !customerName || !customerPhone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!location?.lat || !location?.lng) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({ message: 'This date is in the past and cannot be booked.' });
    }

    const isUnavailable = await UnavailableDate.findOne({
      provider: providerId,
      date: bookingDate,
    });
    if (isUnavailable) {
      return res.status(400).json({ message: 'This date is unavailable for booking.' });
    }

    const exists = await Booking.findOne({ provider: providerId, date: bookingDate });
    if (exists)
      return res.status(400).json({ message: 'This date is already booked' });

    const booking = await Booking.create({
      provider: providerId,
      customer: req.user._id,
      customerName,
      customerPhone,
      date: bookingDate,
      address,
      location,
    });

    await Provider.findByIdAndUpdate(providerId, {
      $addToSet: { unavailableDates: bookingDate },
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('❌ Booking creation error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// 2. Provider views bookings
export const getProviderBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.user._id })
      .populate('customer', 'name phone')
      .sort({ date: 1 });

    const filtered = bookings.map((b) => ({
      ...b._doc,
      customerPhone: b.showProviderPhone ? b.customerPhone : '🔒 Hidden',
    }));

    res.json(filtered);
  } catch (error) {
    console.error('❌ Provider bookings error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// 3. Admin views all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('provider', 'name serviceCategory phone')
      .populate('customer', 'name phone')
      .sort({ date: 1 });

    res.json(bookings);
  } catch (error) {
    console.error('❌ All bookings error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// 4. Update booking status
export const updateBookingStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'name phone')
      .populate('customer', 'name phone');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const allowedStatuses = ['request','confirmed','processing','completed','rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    booking.status = status;

    if (status === 'confirmed') {
      io.emit('booking-confirmed', {
        bookingId: booking._id,
        customerName: booking.customer.name,
        providerName: booking.provider.name,
        date: booking.date,
      });
    } else if (['rejected','completed'].includes(status)) {
      await Provider.findByIdAndUpdate(booking.provider._id, {
        $pull: { unavailableDates: booking.date },
      });

      io.emit('booking-updated', { bookingId: booking._id, status });
    }

    await booking.save();
    res.json(booking);
  } catch (error) {
    console.error('❌ Update status error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// 5. Admin marks booking as paid using secret
export const markBookingAsPaid = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'name phone')
      .populate('customer', 'name phone');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.paid = true;
    booking.showProviderPhone = true;
    await booking.save();

    io.emit('booking-paid', {
      bookingId: booking._id,
      customerName: booking.customer.name,
      providerName: booking.provider.name,
      paid: true,
    });

    res.json({ success: true, message: '✅ Payment confirmed' });
  } catch (error) {
    console.error('❌ Payment error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// 6. Delete booking (admin override)
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (req.isAdminSecret) {
      await booking.deleteOne();
      io.emit('booking-deleted', { bookingId: booking._id });
      return res.json({ success: true, message: '✅ Booking deleted by admin', id: booking._id });
    }

    if (!['rejected','completed'].includes(booking.status)) {
      return res.status(403).json({ message: 'Only rejected or completed bookings can be deleted' });
    }

    await booking.deleteOne();
    io.emit('booking-deleted', { bookingId: booking._id });
    res.json({ success: true, message: '✅ Booking deleted', id: booking._id });
  } catch (error) {
    console.error('❌ Delete error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
