import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  adminHealth,
  createBellAdmin,
  createBlockAdmin,
  createScheduleAdmin,
  createUser,
  createOrganisation,
  deleteBellAdmin,
  deleteBlockAdmin,
  deleteScheduleAdmin,
  deleteUser,
  deleteOrganisation,
  listBellsAdmin,
  listBlocksAdmin,
  listLogs,
  listSchedulesAdmin,
  listUsers,
  listOrganisations,
  updateBellAdmin,
  updateBlockAdmin,
  updateScheduleAdmin,
  updateUser,
  updateOrganisationAdmin,
} from '../controllers/adminController';

export const adminRouter = Router();

adminRouter.use(requireAuth(['superadmin']));

adminRouter.get('/health', adminHealth);
adminRouter.get('/logs', listLogs);

adminRouter.get('/users', listUsers);
adminRouter.post('/users', createUser);
adminRouter.put('/users/:id', updateUser);
adminRouter.delete('/users/:id', deleteUser);

adminRouter.get('/blocks', listBlocksAdmin);
adminRouter.post('/blocks', createBlockAdmin);
adminRouter.put('/blocks/:id', updateBlockAdmin);
adminRouter.delete('/blocks/:id', deleteBlockAdmin);

adminRouter.get('/bells', listBellsAdmin);
adminRouter.post('/bells', createBellAdmin);
adminRouter.put('/bells/:id', updateBellAdmin);
adminRouter.delete('/bells/:id', deleteBellAdmin);

adminRouter.get('/schedules', listSchedulesAdmin);
adminRouter.post('/schedules', createScheduleAdmin);
adminRouter.put('/schedules/:id', updateScheduleAdmin);
adminRouter.delete('/schedules/:id', deleteScheduleAdmin);
adminRouter.get('/organisations', listOrganisations);
adminRouter.post('/organisations', createOrganisation);
adminRouter.put('/organisations/:id', updateOrganisationAdmin);
adminRouter.delete('/organisations/:id', deleteOrganisation);
