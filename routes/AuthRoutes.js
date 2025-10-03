// backend/routes/AuthRoutes.js
import express from "express";
import { registerUser, loginUser, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Register new user
router.post("/register", registerUser);

// ✅ User login
router.post("/login", loginUser);

// ✅ Change password (logged in user only)
router.patch("/change-password", protect, changePassword);

export default router;
