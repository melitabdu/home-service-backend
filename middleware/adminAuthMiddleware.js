import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// Verify admin JWT and attach to req.user
export const protectAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, admin auth denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) return res.status(401).json({ message: 'Admin not found' });

    // ✅ Normalize into req.user
    req.user = {
      _id: admin._id,
      role: 'admin',
      email: admin.email,
      name: admin.name,
    };

    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired admin token' });
  }
};

// Restrict route to admins only
export const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'Not authorized as admin' });
};
