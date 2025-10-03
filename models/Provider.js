// backend/models/Provider.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const providerSchema = new mongoose.Schema({
  photo: { type: String },     // ✅ Cloudinary URL
  photoId: { type: String },   // ✅ Cloudinary public_id (for deletion)

  name: { type: String, required: true },
  serviceCategory: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  description: { type: String },
  priceEstimate: { type: Number },
  password: { type: String, required: true },

  // 🆕 List of unavailable dates in YYYY-MM-DD format
  unavailableDates: { type: [String], default: [] },
}, { timestamps: true });

// 🔐 Encrypt password before saving
providerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔐 Compare entered password with hashed password
providerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Provider = mongoose.model('Provider', providerSchema);
export default Provider;
