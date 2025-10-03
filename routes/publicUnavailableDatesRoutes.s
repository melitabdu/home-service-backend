// backend/routes/publicUnavailableDates.js
//import express from 'express';
import { getUnavailableDatesPublic } from '../controllers/publicUnavialbleDateController.js';

const router = express.Router();

router.get('/:providerId', getUnavailableDatesPublic);

export default router;
