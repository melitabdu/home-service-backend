// backend/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Configure cloudinary with your .env values
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Create storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "home-serv", // all uploads go into a "home-serv" folder in your Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "mp4", "mov"], // extend later for videos
  },
});

// ✅ Multer upload middleware
const upload = multer({ storage });

export { cloudinary, upload };
