import mongoose from "mongoose";

const rentalBookingSchema = new mongoose.Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true }, // ⚠️ check if "Owner" model exists
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    guests: { type: Number, default: 1 },
    notes: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    idFile: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "owner_confirm", "rejected", "awaiting_payment", "processing", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
    totalDays: { type: Number },
    totalPrice: { type: Number },
    history: [
      {
        status: String,
        changedBy: String,
        date: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("RentalBooking", rentalBookingSchema);
