import { Router } from 'express';
import {
  createBulbSchedule,
  deleteBulbSchedule,
  listBulbSchedules,
  updateBulbSchedule,
} from '../controllers/bulbScheduleController';
import { requireAuth } from '../middleware/auth';

export const bulbScheduleRouter = Router();

bulbScheduleRouter.use(requireAuth());
bulbScheduleRouter.get('/', listBulbSchedules);
bulbScheduleRouter.post('/', createBulbSchedule);
bulbScheduleRouter.put('/:id', updateBulbSchedule);
bulbScheduleRouter.delete('/:id', deleteBulbSchedule);
