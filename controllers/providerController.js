import Provider from '../models/Provider.js';
import fs from 'fs';
import path from 'path';

// Add a new provider (admin only)
export const addProvider = async (req, res) => {
  const { name, phone, serviceCategory, description, priceEstimate, password } = req.body;
  const photo = req.file ? req.file.filename : null;

  if ([name, phone, serviceCategory, description, priceEstimate, password].some(field => !field)) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const providerExists = await Provider.findOne({ phone });
    if (providerExists) {
      return res.status(400).json({ message: 'Provider with this phone number already exists' });
    }

    const provider = await Provider.create({
      name,
      phone,
      serviceCategory,
      description,
      priceEstimate,
      photo,
      password,
    });

    // ✅ Return the full provider object (so frontend has photo, description, etc.)
    res.status(201).json(provider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all providers
export const getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find({});
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a provider by ID (admin only)
export const updateProvider = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (req.file) {
      updates.photo = req.file.filename; // ✅ store only filename
    }

    const provider = await Provider.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json(provider); // ✅ return updated provider with photo
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a provider by ID
export const deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // ✅ Delete the photo file if it exists
    if (provider.photo) {
      const photoPath = path.join(process.cwd(), 'uploads', provider.photo); // adjust if your folder is different
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await provider.deleteOne();
    res.json({ message: '✅ Provider and photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
