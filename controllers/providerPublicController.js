import Provider from '../models/Provider.js';

/**
 * 🔗 PUBLIC PROVIDER PAGE DATA
 * GET /p/:slug
 */
export const getProviderBySlug = async (req, res) => {
  try {
    const provider = await Provider.findOne({ slug: req.params.slug }).select(
      'name photo description priceEstimate serviceCategory slug averageRating ratingCount'
    );

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json(provider);
  } catch (error) {
    console.error('❌ getProviderBySlug error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
