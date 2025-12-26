import Provider from '../models/Provider.js';
import fs from 'fs';
import path from 'path';

/////////////////////////////////////////////////
// ➕ Add a new provider (ADMIN ONLY)
/////////////////////////////////////////////////
export const addProvider = async (req, res) => {
  const { name, phone, serviceCategory, description, priceEstimate, password } = req.body;
  const photo = req.file ? req.file.filename : null;

  if ([name, phone, serviceCategory, description, priceEstimate, password].some(f => !f)) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const providerExists = await Provider.findOne({ phone });
    if (providerExists) {
      return res.status(400).json({ message: 'Provider with this phone number already exists' });
    }

    // Create provider
    await Provider.create({
      name,
      phone,
      serviceCategory,
      description,
      priceEstimate,
      photo,
      password,
    });

    // Fetch the saved provider including the slug
    const savedProvider = await Provider.findOne({ phone }).select(
      '_id name serviceCategory description priceEstimate phone password slug photo'
    );

    res.status(201).json(savedProvider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/////////////////////////////////////////////////
// 📄 Get ALL providers
/////////////////////////////////////////////////
export const getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find({});
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/////////////////////////////////////////////////
// 📂 Get providers by CATEGORY
/////////////////////////////////////////////////
export const getProvidersByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const providers = await Provider.find({ serviceCategory: category });
    res.status(200).json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch providers by category' });
  }
};

/////////////////////////////////////////////////
// 🔗 Get provider by SLUG (PUBLIC)
/////////////////////////////////////////////////
export const getProviderBySlug = async (req, res) => {
  try {
    const provider = await Provider.findOne({ slug: req.params.slug });

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/////////////////////////////////////////////////
// ✏️ Update provider by ID (ADMIN)
/////////////////////////////////////////////////
export const updateProvider = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.photo = req.file.filename;

    const provider = await Provider.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/////////////////////////////////////////////////
// 🗑️ Delete provider by ID
/////////////////////////////////////////////////
export const deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (provider.photo) {
      const photoPath = path.join(process.cwd(), 'uploads', provider.photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }

    await provider.deleteOne();
    res.json({ message: '✅ Provider and photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
