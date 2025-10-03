import express from 'express';
import { getUnavailableDatesPublic } from '../controllers/p';

const router = express.Router();

// Publicly view a provider's unavailable dates
router.get('/:providerId', getUnavailableDatesPublic);

export default router;
