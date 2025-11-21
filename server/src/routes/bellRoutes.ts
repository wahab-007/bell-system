import { Router } from 'express';
import { createBell, deleteBell, listBells, updateBell } from '../controllers/bellController';
import { requireAuth } from '../middleware/auth';

export const bellRouter = Router();

bellRouter.use(requireAuth());
bellRouter.get('/', listBells);
bellRouter.post('/', createBell);
bellRouter.put('/:id', updateBell);
bellRouter.delete('/:id', deleteBell);
