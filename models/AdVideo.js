import mongoose from 'mongoose';

const adVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    enum: ['youtube', 'tiktok'],
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('AdVideo', adVideoSchema);
