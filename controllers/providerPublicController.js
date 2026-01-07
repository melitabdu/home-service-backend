import Provider from '../models/Provider.js';

/**
 * 🔗 PUBLIC API
 * Get provider by slug
 * Used by frontend route: /p/:slug
 * API endpoint: /api/providers/slug/:slug
 */
export const getProviderBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const provider = await Provider.findOne({ slug }).select(
      '_id name serviceCategory description priceEstimate photo slug'
    );

    if (!provider) {
      return res.status(404).json({
        message: 'Provider not found',
      });
    }

    res.status(200).json(provider);
  } catch (error) {
    console.error('❌ Error fetching provider by slug:', error);
    res.status(500).json({
      message: 'Server error',
    });
  }
};
