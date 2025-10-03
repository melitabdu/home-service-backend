import UnavailableDate from '../models/UnavailableDate.js';
import Provider from '../models/Provider.js';

// ✅ Admin: add unavailable date for any provider
export const adminAddUnavailableDate = async (req, res) => {
  try {
    const { providerId, date } = req.body;

    if (!providerId || !date) {
      return res.status(400).json({ message: 'Provider ID and date are required' });
    }

    // check provider exists
    const providerExists = await Provider.findById(providerId);
    if (!providerExists) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // prevent duplicate
    const exists = await UnavailableDate.findOne({ provider: providerId, date });
    if (exists) {
      return res.status(400).json({ message: 'Date already marked unavailable for this provider' });
    }

    const newDate = new UnavailableDate({ provider: providerId, date });
    await newDate.save();

    res.status(201).json(newDate);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Admin: get all unavailable dates for a provider
export const adminGetUnavailableDates = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!providerId) {
      return res.status(400).json({ message: 'Provider ID is required' });
    }

    const dates = await UnavailableDate.find({ provider: providerId }).sort({ date: 1 });
    res.json(dates);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Admin: delete a provider’s unavailable date
export const adminDeleteUnavailableDate = async (req, res) => {
  try {
    const { dateId } = req.params;

    const deleted = await UnavailableDate.findByIdAndDelete(dateId);

    if (!deleted) {
      return res.status(404).json({ message: 'Unavailable date not found' });
    }

    res.json({ message: 'Unavailable date removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
