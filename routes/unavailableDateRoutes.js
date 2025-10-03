import UnavailableDate from '../models/UnavailableDate.js';

// ✅ Provider adds unavailable date
export const addUnavailableDate = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const today = new Date();
    today.setHours(0,0,0,0);
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);

    if (targetDate < today) {
      return res.status(400).json({ message: 'Cannot mark past dates as unavailable' });
    }

    const exists = await UnavailableDate.findOne({
      provider: req.user._id,
      date: targetDate,
    });
    if (exists) return res.status(400).json({ message: 'Date already marked unavailable' });

    const unavailableDate = await UnavailableDate.create({
      provider: req.user._id,
      date: targetDate,
      createdBy: 'provider',
    });

    res.status(201).json(unavailableDate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Provider fetches unavailable dates
export const getUnavailableDates = async (req, res) => {
  try {
    const dates = await UnavailableDate.find({ provider: req.user._id }).sort({ date: 1 });
    res.json(dates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Provider deletes their unavailable date
export const deleteUnavailableDate = async (req, res) => {
  try {
    const date = await UnavailableDate.findOne({
      _id: req.params.dateId,
      provider: req.user._id,
    });
    if (!date) return res.status(404).json({ message: 'Date not found' });

    await date.deleteOne();
    res.json({ success: true, message: 'Unavailable date removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Admin adds unavailable date for ANY provider
export const adminAddUnavailableDate = async (req, res) => {
  try {
    const { date, providerId } = req.body;
    if (!date || !providerId) {
      return res.status(400).json({ message: 'Date and providerId are required' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);

    const exists = await UnavailableDate.findOne({ provider: providerId, date: targetDate });
    if (exists) return res.status(400).json({ message: 'Date already marked unavailable' });

    const unavailableDate = await UnavailableDate.create({
      provider: providerId,
      date: targetDate,
      createdBy: 'admin',
    });

    res.status(201).json(unavailableDate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Admin deletes unavailable date
export const adminDeleteUnavailableDate = async (req, res) => {
  try {
    const date = await UnavailableDate.findById(req.params.dateId);
    if (!date) return res.status(404).json({ message: 'Date not found' });

    await date.deleteOne();
    res.json({ success: true, message: 'Unavailable date removed by admin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
