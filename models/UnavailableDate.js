import mongoose from 'mongoose';

const unavailableDateSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('UnavailableDate', unavailableDateSchema);
