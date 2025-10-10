import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Configure Cloudinary with your .env values
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Verify connection once when server starts
try {
  const testConfig = cloudinary.config();
  if (testConfig.cloud_name && testConfig.api_key && testConfig.api_secret) {
    console.log("☁️ Cloudinary connected successfully!");
    console.log("   → Cloud Name:", testConfig.cloud_name);
  } else {
    console.warn("⚠️ Cloudinary config missing! Check your .env variables.");
  }
} catch (error) {
  console.error("❌ Cloudinary connection failed:", error.message);
}

// ✅ Create storage engine for Multer
// We’ll detect file type dynamically: 
// - images → `image`
// - pdf/mp4/mov → `raw`
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Determine resource_type
    let resourceType = "image";
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("video/")) {
      resourceType = "raw";
    }

    return {
      folder: "home-serv",
      resource_type: resourceType,
      allowed_formats: ["jpg", "jpeg", "png", "pdf", "mp4", "mov"],
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

// ✅ Multer upload middleware
const upload = multer({ storage });

export { cloudinary, upload };
