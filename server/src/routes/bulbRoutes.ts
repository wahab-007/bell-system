import { Router } from 'express';
import { listBulbs, toggleBulb, updateBulb } from '../controllers/bulbController';
import { requireAuth } from '../middleware/auth';

export const bulbRouter = Router();

bulbRouter.use(requireAuth());
bulbRouter.get('/', listBulbs);
bulbRouter.put('/:id', updateBulb);
bulbRouter.post('/:id/toggle', toggleBulb);
