import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await Admin.findOne({
      phone: "0725847355",
    });

    if (existingAdmin) {
      console.log("Admin already exists");

      // 🔄 Fix password if needed
      existingAdmin.password = "zxcvbnm";
      await existingAdmin.save();

      console.log("Password updated");

      await mongoose.connection.close();
      process.exit(0);
    }

    const admin = new Admin({
      name: "Main Admin",
      phone: "0725847355",
      password: "zxcvbnm",
    });

    await admin.save();

    console.log("✅ Admin created successfully");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);

    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();