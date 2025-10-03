import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  address: { type: String, required: true },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
  },
  date: { type: String, required: true }, // e.g. "2025-05-12"
  status: {
    type: String,
    enum: ['request', 'rejected', 'confirmed', 'processing', 'completed'],
    default: 'request',
  },
  paid: { type: Boolean, default: false },

  providerConfirmed: { type: Boolean, default: false },
  adminConfirmed: { type: Boolean, default: false },
  showProviderPhone: { type: Boolean, default: false },
  location: {
    lat: Number,
    lng: Number,
  },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
