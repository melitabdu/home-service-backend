import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Provider from './models/Provider.js';
import connectDB from './config/db.js';

dotenv.config();

const cleanPhotos = async () => {
  try {
    await connectDB();
    console.log('🗄️ Connected to DB');

    const providers = await Provider.find({});
    let updatedCount = 0;

    for (const provider of providers) {
      if (provider.photo && provider.photo.startsWith('/uploads/')) {
        // Remove the '/uploads/' prefix
        provider.photo = provider.photo.replace(/^\/uploads\//, '');
        await provider.save();
        updatedCount++;
      }
    }

    console.log(`✅ Cleaned photo field for ${updatedCount} providers`);
    process.exit();
  } catch (err) {
    console.error('❌ Error cleaning photos:', err);
    process.exit(1);
  }
};

cleanPhotos();
