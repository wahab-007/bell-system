import { Router } from 'express';
import { authRouter } from './authRoutes';
import { blockRouter } from './blockRoutes';
import { bellRouter } from './bellRoutes';
import { scheduleRouter } from './scheduleRoutes';
import { emergencyRouter } from './emergencyRoutes';
import { deviceRouter } from './deviceRoutes';
import { profileRouter } from './profileRoutes';
import { adminRouter } from './adminRoutes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/blocks', blockRouter);
apiRouter.use('/bells', bellRouter);
apiRouter.use('/schedules', scheduleRouter);
apiRouter.use('/emergency', emergencyRouter);
apiRouter.use('/device', deviceRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/admin', adminRouter);
