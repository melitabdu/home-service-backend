// scripts/createAdmin.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js'; // Import Admin model

dotenv.config();

const createAdmin = async () => {
  try {
     await mongoose.connect('mongodb://melitabdu:10203040zxc@ac-po4ke8b-shard-00-00.gmbymhj.mongodb.net:27017,ac-po4ke8b-shard-00-01.gmbymhj.mongodb.net:27017,ac-po4ke8b-shard-00-02.gmbymhj.mongodb.net:27017/?replicaSet=atlas-pkg6u6-shard-0&ssl=true&authSource=admin');

    const existingAdmin = await Admin.findOne({ phone: '0984438542' });
    if (existingAdmin) {
      console.log('Admin already exists');
      await mongoose.connection.close();
      process.exit(0);
    }

    const admin = new Admin({
      name: 'Main Admin',
      phone: '0984438542',
      password: 'Admin@123zxcvbnm', // Will be hashed by pre-save middleware
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();
