import express from 'express';
import {
  calculateRoute
} from '../controllers/routeController.js';

const router = express.Router();

router.post(
  '/',
  calculateRoute
);

export default router;