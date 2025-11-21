import { Router } from 'express';
import { activateEmergency, deactivateEmergency, getEmergencyState } from '../controllers/emergencyController';
import { requireAuth } from '../middleware/auth';

export const emergencyRouter = Router();

emergencyRouter.use(requireAuth(['owner', 'admin']));
emergencyRouter.get('/', getEmergencyState);
emergencyRouter.post('/activate', activateEmergency);
emergencyRouter.post('/deactivate', deactivateEmergency);
