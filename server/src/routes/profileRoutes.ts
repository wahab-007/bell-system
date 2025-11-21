import { Router } from 'express';
import { getProfile, updateOrganisation, updateProfile } from '../controllers/profileController';
import { requireAuth } from '../middleware/auth';

export const profileRouter = Router();

profileRouter.use(requireAuth());
profileRouter.get('/', getProfile);
profileRouter.put('/', updateProfile);
profileRouter.put('/organisation', requireAuth(['owner']), updateOrganisation);
