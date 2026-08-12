import express from 'express';
import { createLocation, searchLocation, createConnection, getAllLocations } from '../controllers/locationController.js';

const router = express.Router();

router.get('/', getAllLocations); // <--- Nouvelle route pour récupérer tous les lieux
router.post('/', createLocation);
router.get('/search', searchLocation);
router.post('/connections', createConnection);

export default router;