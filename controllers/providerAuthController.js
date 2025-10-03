// backend/controllers/providerAuthController.js
import Provider from '../models/Provider.js';
import jwt from 'jsonwebtoken';

// Generate token for provider
const generateToken = (id) => {
  return jwt.sign({ id, role: 'provider' }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Provider login
// @route   POST /api/providers/auth/login
// @access  Public
export const loginProvider = async (req, res) => {
  const { phone, password } = req.body;

  try {
    const provider = await Provider.findOne({ phone });

    if (!provider) {
      return res.status(401).json({ message: 'Provider not found' });
    }

    const isMatch = await provider.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }

    // Respond with token and details
    res.json({
      _id: provider._id,
      name: provider.name,
      phone: provider.phone,
      serviceCategory: provider.serviceCategory,
      token: generateToken(provider._id),
    });

  } catch (error) {
    console.error('❌ Provider login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};
