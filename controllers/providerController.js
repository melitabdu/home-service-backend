import Provider from '../models/Provider.js';
import bcrypt from 'bcryptjs';

/////////////////////////////////////////////////
// ➕ ADD PROVIDER (ADMIN)
/////////////////////////////////////////////////
export const addProvider = async (req, res) => {
  try {
    const {
      name,
      phone,
      serviceCategory,
      description,
      priceEstimate,
      password,
    } = req.body;

    if (
      !name ||
      !phone ||
      !serviceCategory ||
      !description ||
      !priceEstimate ||
      !password
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const exists = await Provider.findOne({ phone });
    if (exists) {
      return res.status(400).json({ message: 'Provider already exists' });
    }

    const photo = req.file ? req.file.path : null;

    const provider = await Provider.create({
      name,
      phone,
      serviceCategory,
      description,
      priceEstimate,
      password,
      photo,
    });

    // ✅ Return CLEAN response (NO PASSWORD)
    res.status(201).json({
      _id: provider._id,
      name: provider.name,
      phone: provider.phone,
      serviceCategory: provider.serviceCategory,
      description: provider.description,
      priceEstimate: provider.priceEstimate,
      slug: provider.slug,
      photo: provider.photo,
      createdAt: provider.createdAt,
    });
  } catch (error) {
    console.error('Add provider error:', error);
    res.status(500).json({ message: 'Failed to add provider' });
  }
};

/////////////////////////////////////////////////
// 📄 GET ALL PROVIDERS (ADMIN)
/////////////////////////////////////////////////
export const getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find().select('-password');
    res.status(200).json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch providers' });
  }
};

/////////////////////////////////////////////////
// 📂 GET PROVIDERS BY CATEGORY (PUBLIC)
/////////////////////////////////////////////////
export const getProvidersByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const providers = await Provider.find({
      serviceCategory: category,
    }).select('-password');

    res.status(200).json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch providers by category' });
  }
};

/////////////////////////////////////////////////
// 🔗 GET PROVIDER BY SLUG (PUBLIC SHARE LINK)
/////////////////////////////////////////////////
export const getProviderBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const provider = await Provider.findOne({ slug }).select('-password');

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.status(200).json(provider);
  } catch (error) {
    console.error('Slug fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch provider' });
  }
};

/////////////////////////////////////////////////
// ✏️ UPDATE PROVIDER (ADMIN)
/////////////////////////////////////////////////
export const updateProvider = async (req, res) => {
  try {
    const updates = { ...req.body };

    // 🔐 Re-hash password if updated
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    if (req.file) {
      updates.photo = req.file.path;
    }

    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.status(200).json(provider);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update provider' });
  }
};

/////////////////////////////////////////////////
// 🗑 DELETE PROVIDER (ADMIN)
/////////////////////////////////////////////////
export const deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    await provider.deleteOne();
    res.status(200).json({ message: 'Provider deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete provider' });
  }
};
