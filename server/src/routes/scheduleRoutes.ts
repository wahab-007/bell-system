import { Router } from 'express';
import {
  createOccasion,
  createSchedule,
  deleteSchedule,
  listOccasions,
  listSchedules,
  deleteOccasion,
  updateSchedule,
} from '../controllers/scheduleController';
import { requireAuth } from '../middleware/auth';

export const scheduleRouter = Router();

scheduleRouter.use(requireAuth());
scheduleRouter.get('/', listSchedules);
scheduleRouter.post('/', createSchedule);
scheduleRouter.put('/:id', updateSchedule);
scheduleRouter.delete('/:id', deleteSchedule);
scheduleRouter.post('/occasions', createOccasion);
scheduleRouter.get('/occasions', listOccasions);
scheduleRouter.delete('/occasions/:id', deleteOccasion);
