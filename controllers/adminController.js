// backend/controllers/adminController.js
import Admin from '../models/Admin.js';
import Provider from '../models/Provider.js';
import Booking from '../models/Booking.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cloudinary } from '../config/cloudinary.js';

/**
 * 🔐 Admin Login
 */
export const loginAdmin = async (req, res) => {
  const { phone, password } = req.body;
  try {
    const admin = await Admin.findOne({ phone });
    if (!admin) return res.status(401).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid phone or password' });

    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({
      _id: admin._id,
      name: admin.name,
      phone: admin.phone,
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * ✅ Add a new provider (with Cloudinary photo)
 */
export const addProvider = async (req, res) => {
  try {
    const { name, phone, serviceCategory, description, priceEstimate, password } = req.body;
    if ([name, phone, serviceCategory, description, priceEstimate, password].some(f => !f)) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const providerExists = await Provider.findOne({ phone });
    if (providerExists) return res.status(400).json({ message: 'Provider already exists' });

    let photo = null;
    let photoId = null;
    if (req.file) {
      photo = req.file.path;        // ✅ Cloudinary URL
      photoId = req.file.filename;  // ✅ Cloudinary public_id
    }

    const provider = await Provider.create({
      name,
      phone,
      serviceCategory,
      description,
      priceEstimate,
      password,
      photo,
      photoId,
    });

    res.status(201).json({ message: 'Provider added successfully', provider });
  } catch (error) {
    res.status(500).json({ message: 'Error adding provider', error: error.message });
  }
};

/**
 * ✅ Get all providers
 */
export const getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find();
    res.status(200).json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching providers', error: error.message });
  }
};

/**
 * ✅ Update provider (with optional new Cloudinary photo)
 */
export const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, serviceCategory, description, priceEstimate, password } = req.body;

    const provider = await Provider.findById(id);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    if (req.file) {
      // 🗑 Delete old photo from Cloudinary if exists
      if (provider.photoId) {
        await cloudinary.uploader.destroy(provider.photoId);
      }
      provider.photo = req.file.path;      // new URL
      provider.photoId = req.file.filename; // new public_id
    }

    provider.name = name || provider.name;
    provider.phone = phone || provider.phone;
    provider.serviceCategory = serviceCategory || provider.serviceCategory;
    provider.description = description || provider.description;
    provider.priceEstimate = priceEstimate || provider.priceEstimate;
    if (password) provider.password = password;

    const updatedProvider = await provider.save();
    res.status(200).json({ message: 'Provider updated successfully', updatedProvider });
  } catch (error) {
    res.status(500).json({ message: 'Error updating provider', error: error.message });
  }
};

/**
 * ✅ Delete provider (also remove Cloudinary photo)
 */
export const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await Provider.findById(id);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    // 🗑 Delete Cloudinary image if exists
    if (provider.photoId) {
      await cloudinary.uploader.destroy(provider.photoId);
    }

    await provider.deleteOne();
    res.status(200).json({ message: 'Provider deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting provider', error: error.message });
  }
};

/**
 * ✅ Get all bookings
 */
export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('providerId', 'name phone serviceCategory')
      .populate('userId', 'name phone');

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};

/**
 * ✅ Update booking status
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status, paymentStatus },
      { new: true }
    );

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    res.status(200).json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
};
