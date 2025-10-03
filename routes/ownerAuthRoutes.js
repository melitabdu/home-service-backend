import express from "express";
import { loginOwner } from "../controllers/ownerAuthController.js";

const router = express.Router();

// Owner login route
router.post("/login", loginOwner);

export default router;
