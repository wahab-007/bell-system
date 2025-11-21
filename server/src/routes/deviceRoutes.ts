import { Router } from 'express';
import { requestSession } from '../controllers/deviceController';

export const deviceRouter = Router();

deviceRouter.post('/session', requestSession);
