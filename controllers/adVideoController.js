import AdVideo from '../models/AdVideo.js';

/**
 * @desc Create a new ad video
 * @route POST /api/advideos
 * @access Admin
 */
export const createAdVideo = async (req, res) => {
  try {
    const { title, platform, videoUrl } = req.body;

    if (!title || !platform || !videoUrl) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newAd = new AdVideo({ title, platform, videoUrl });
    await newAd.save();

    res.status(201).json(newAd);
  } catch (err) {
    res.status(500).json({ message: 'Error creating ad video', error: err.message });
  }
};

/**
 * @desc Get all ad videos (with optional pagination)
 * @route GET /api/advideos
 * @access Public
 */
export const getAllAdVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    const ads = await AdVideo.find().skip(skip).limit(limit);
    const total = await AdVideo.countDocuments();

    res.status(200).json({
      videos: ads,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching ad videos', error: err.message });
  }
};

/**
 * @desc Delete an ad video by ID
 * @route DELETE /api/advideos/:id
 * @access Admin
 */
export const deleteAdVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await AdVideo.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Ad video not found' });
    }

    res.status(200).json({ message: 'Ad video deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting ad video', error: err.message });
  }
};
