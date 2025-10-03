// seedAdmin.js
//import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js'; // or './models/Admin.js' if separate

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const phone = '0984735563';
    const plainPassword = 'zxcvbnm';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const existing = await User.findOne({ phone });

    if (existing) {
      console.log('⚠️ Admin already exists.');
    } else {
      await User.create({
        name: 'Super Admin',
        phone,
        password: hashedPassword,
        role: 'admin',
      });
      console.log('✅ Admin user created successfully');
    }

    process.exit();
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();//
