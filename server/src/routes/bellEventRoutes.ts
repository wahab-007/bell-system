import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  activateBellEvent,
  createBellEvent,
  deleteBellEvent,
  listBellEvents,
  updateBellEvent,
} from '../controllers/bellEventController';

export const bellEventRouter = Router();

bellEventRouter.use(requireAuth());
bellEventRouter.get('/', listBellEvents);
bellEventRouter.post('/', createBellEvent);
bellEventRouter.put('/:id', updateBellEvent);
bellEventRouter.post('/:id/activate', activateBellEvent);
bellEventRouter.delete('/:id', deleteBellEvent);
