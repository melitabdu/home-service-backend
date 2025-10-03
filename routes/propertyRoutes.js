import express from "express";
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPropertiesByCategory,
  searchProperties,
  uploadPropertyImage,
  deletePropertyImage,
} from "../controllers/propertyController.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

/** CRUD */
router.post("/", upload.array("images", 5), createProperty);
router.get("/", getProperties);
router.get("/:id", getPropertyById);
router.put("/:id", upload.array("images", 5), updateProperty);
router.delete("/:id", deleteProperty);

/** Filter & Search */
router.get("/category/:category", getPropertiesByCategory);
router.get("/search/query", searchProperties);

/** Images */
router.post("/:id/image", upload.single("image"), uploadPropertyImage);
router.delete("/:id/image", deletePropertyImage);

export default router;
