import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const providerSchema = new mongoose.Schema(
  {
    // 🖼️ Provider image (Cloudinary)
    photo: { type: String },     // Cloudinary URL
    photoId: { type: String },   // Cloudinary public_id

    // 🧑 Provider info
    name: { type: String, required: true },
    serviceCategory: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    description: { type: String },
    priceEstimate: { type: Number },

    // 🔐 Auth
    password: { type: String, required: true },

    // 🔗 Public shareable link slug
    slug: { type: String, unique: true },

    // 📅 Availability
    unavailableDates: {
      type: [String], // YYYY-MM-DD
      default: [],
    },
  },
  { timestamps: true }
);

/////////////////////////////////////////////////
// 🔗 AUTO-GENERATE UNIQUE SLUG (SAFE)
/////////////////////////////////////////////////
providerSchema.pre('save', async function (next) {
  if (this.slug || !this.name) return next();

  const baseSlug = this.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let slug = baseSlug;
  let count = 1;

  while (await mongoose.models.Provider.findOne({ slug })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  this.slug = slug;
  next();
});

/////////////////////////////////////////////////
// 🔐 HASH PASSWORD BEFORE SAVE
/////////////////////////////////////////////////
providerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/////////////////////////////////////////////////
// 🔐 PASSWORD COMPARISON
/////////////////////////////////////////////////
providerSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const Provider = mongoose.model('Provider', providerSchema);
export default Provider;
