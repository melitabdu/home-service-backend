import UnavailableDate from '../models/UnavailableDate.js';

// ✅ Add unavailable date
export const addUnavailableDate = async (req, res) => {
  try {
    const providerId = req.user._id; // comes from auth middleware
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // prevent duplicate dates
    const exists = await UnavailableDate.findOne({ provider: providerId, date });
    if (exists) {
      return res.status(400).json({ message: 'Date already marked unavailable' });
    }

    const newDate = new UnavailableDate({ provider: providerId, date });
    await newDate.save();

    res.status(201).json(newDate);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Get provider unavailable dates
export const getUnavailableDates = async (req, res) => {
  try {
    const providerId = req.user._id; // provider fetches their own
    const dates = await UnavailableDate.find({ provider: providerId }).sort({ date: 1 });
    res.json(dates);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Delete unavailable date
export const deleteUnavailableDate = async (req, res) => {
  try {
    const providerId = req.user._id;
    const { dateId } = req.params;

    const deleted = await UnavailableDate.findOneAndDelete({
      _id: dateId,
      provider: providerId,
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Date not found' });
    }

    res.json({ message: 'Unavailable date removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
