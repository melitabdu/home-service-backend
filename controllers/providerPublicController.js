import Provider from '../models/Provider.js';

/**
 * 🔗 PUBLIC: Get provider by slug
 * Used for shareable links like /p/semir
 * No auth required
 */
export const getProviderBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Find provider by slug
    const provider = await Provider.findOne({ slug }).select(
      '_id name serviceCategory slug'
    );

    if (!provider) {
      return res.status(404).json({
        message: 'Provider not found',
      });
    }

    res.status(200).json(provider);
  } catch (error) {
    console.error('❌ Error fetching provider by slug:', error.message);
    res.status(500).json({
      message: 'Failed to fetch provider',
    });
  }
};
