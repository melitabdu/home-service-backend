// routes/advideoRoutes.js
import express from 'express';
import {
  createAdVideo,
  getAllAdVideos,
  deleteAdVideo
} from '../controllers/adVideoController.js';

const router = express.Router();

router.post('/', createAdVideo);        // Admin: create video
router.get('/', getAllAdVideos);        // Public: get videos with pagination
router.delete('/:id', deleteAdVideo);   // Admin: delete video by ID

export default router;
