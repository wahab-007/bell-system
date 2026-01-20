import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listOrgLogs } from '../controllers/logController';

export const logRouter = Router();

logRouter.use(requireAuth());
logRouter.get('/', listOrgLogs);
