import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Owner from "../models/Owner.js";

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

/**
 * 🔑 Owner Login
 */
export const loginOwner = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const owner = await Owner.findOne({ phone });
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Return consistent response structure
    res.json({
      token: generateToken(owner._id),
      owner: {
        _id: owner._id,
        name: owner.name,
        phone: owner.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};
