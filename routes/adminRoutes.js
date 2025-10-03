// backend/routes/adminRoutes.js
import express from "express";
import { upload } from "../config/cloudinary.js"; // ✅ use Cloudinary upload
import {
  addProvider,
  getAllProviders,
  deleteProvider,
  loginAdmin,
  updateProvider,
} from "../controllers/adminController.js";

const router = express.Router();

// ✅ Admin Login
router.post("/login", loginAdmin);

// ✅ Add a provider (photo uploads go to Cloudinary)
router.post("/add-provider", upload.single("photo"), addProvider);

// ✅ Get all providers
router.get("/providers", getAllProviders);

// ✅ Delete provider by ID
router.delete("/provider/:id", deleteProvider);

// ✅ Update provider (with optional new photo)
router.put("/provider/:id", upload.single("photo"), updateProvider);

export default router;
