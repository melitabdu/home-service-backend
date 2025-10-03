// backend/controllers/ownerController.js
import Owner from "../models/Owner.js";
import Property from "../models/Property.js";

/**
 * ✅ Create Owner
 */
export const createOwner = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    const exists = await Owner.findOne({ phone });
    if (exists) {
      return res.status(400).json({ success: false, message: "Owner already exists" });
    }

    const owner = new Owner({ name, phone, password });
    await owner.save();

    res.status(201).json({ success: true, message: "Owner created successfully", data: owner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✅ Get all Owners with their Properties
 */
export const getOwners = async (req, res) => {
  try {
    const owners = await Owner.find().populate("properties"); // populate properties list
    res.json({ success: true, data: owners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✅ Update Owner
 */
export const updateOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    owner.name = req.body.name || owner.name;
    owner.phone = req.body.phone || owner.phone;

    // if admin wants to reset/change password
    if (req.body.password) {
      owner.password = req.body.password; // will be hashed by pre-save hook
    }

    await owner.save();
    res.json({ success: true, message: "Owner updated successfully", data: owner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✅ Delete Owner (and all their properties)
 */
export const deleteOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    // Delete all properties linked to this owner
    await Property.deleteMany({ owner: owner._id });

    // Delete owner
    await owner.deleteOne();

    res.json({ success: true, message: "Owner and their properties deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
