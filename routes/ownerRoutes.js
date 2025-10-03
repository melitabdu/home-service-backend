import express from "express";
import {
  getOwners,
  createOwner,
  updateOwner,
  deleteOwner
} from "../controllers/ownerController.js";

const router = express.Router();

/** Admin-only APIs exposed via protected frontend route */
router.get("/", getOwners);
router.post("/", createOwner);
router.put("/:id", updateOwner);
router.delete("/:id", deleteOwner);

export default router;
