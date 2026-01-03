import express from "express";
import { getAllUsers, deleteUser } from "../controllers/adminUserController.js";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// ✅ Admin authentication is enough
router.get("/users", protectAdmin, getAllUsers);
router.delete("/users/:id", protectAdmin, deleteUser);

export default router;
