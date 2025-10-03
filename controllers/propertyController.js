import Property from "../models/Property.js";
import Owner from "../models/Owner.js";
import { cloudinary } from "../config/cloudinary.js";

/**
 * @desc Create property (Admin only)
 * @route POST /api/properties
 */
export const createProperty = async (req, res) => {
  try {
    const { title, location, price, description, category, owner, ownerName, ownerPhone, ownerPassword } = req.body;

    let ownerId;

    if (owner) {
      const existingOwner = await Owner.findById(owner);
      if (!existingOwner) return res.status(404).json({ message: "Owner not found" });
      ownerId = existingOwner._id;
    } else {
      if (!ownerName || !ownerPhone || !ownerPassword)
        return res.status(400).json({ message: "New owner details required" });

      const phoneExists = await Owner.findOne({ phone: ownerPhone });
      if (phoneExists)
        return res.status(400).json({ message: "Owner with this phone already exists" });

      const newOwner = new Owner({ name: ownerName, phone: ownerPhone, password: ownerPassword });
      const savedOwner = await newOwner.save();
      ownerId = savedOwner._id;
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, { folder: "properties" });
        images.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    const property = new Property({ title, location, price, description, category, images, owner: ownerId });
    const savedProperty = await property.save();

    await Owner.findByIdAndUpdate(ownerId, { $push: { properties: savedProperty._id } });

    res.status(201).json({ message: "Property created successfully", property: savedProperty });
  } catch (error) {
    console.error("❌ Error creating property:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Get all properties
 * @route GET /api/properties
 */
export const getProperties = async (req, res) => {
  try {
    const properties = await Property.find().populate("owner", "name phone");
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Get property by ID
 * @route GET /api/properties/:id
 */
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate("owner", "name phone");
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Get properties by category
 * @route GET /api/properties/category/:category
 */
export const getPropertiesByCategory = async (req, res) => {
  try {
    const properties = await Property.find({ category: req.params.category });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Search properties
 * @route GET /api/properties/search/query?q=...
 */
export const searchProperties = async (req, res) => {
  try {
    const q = req.query.q;
    const properties = await Property.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Update property (Admin only)
 * @route PUT /api/properties/:id
 */
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    const { title, location, price, description, category, removedImages, existingImages } = req.body;

    // Remove images from Cloudinary
    if (removedImages) {
      const removedArray = Array.isArray(removedImages) ? removedImages : [removedImages];
      for (const img of removedArray) {
        const imageObj = property.images.find(i => i.url === img || i.public_id === img);
        if (imageObj) {
          await cloudinary.uploader.destroy(imageObj.public_id);
          property.images = property.images.filter(i => i.public_id !== imageObj.public_id);
        }
      }
    }

    // Keep existing images
    if (existingImages) {
      const existingArray = Array.isArray(existingImages) ? existingImages : [existingImages];
      property.images = property.images.filter(i => existingArray.includes(i.url));
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, { folder: "properties" });
        property.images.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    // Update text fields
    property.title = title || property.title;
    property.location = location || property.location;
    property.price = price || property.price;
    property.description = description || property.description;
    property.category = category || property.category;

    const updated = await property.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Delete property (Admin only)
 * @route DELETE /api/properties/:id
 */
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    await Owner.findByIdAndUpdate(property.owner, { $pull: { properties: property._id } });

    for (const img of property.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    await property.deleteOne();
    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Upload single new image to property
 * @route POST /api/properties/:id/image
 */
export const uploadPropertyImage = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "properties" });
      property.images.push({ url: result.secure_url, public_id: result.public_id });
      await property.save();
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Delete image from property
 * @route DELETE /api/properties/:id/image
 */
export const deletePropertyImage = async (req, res) => {
  try {
    const { public_id } = req.body;
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    await cloudinary.uploader.destroy(public_id);
    property.images = property.images.filter(img => img.public_id !== public_id);
    await property.save();

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
