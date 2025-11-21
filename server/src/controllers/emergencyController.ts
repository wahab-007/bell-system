import { Response } from 'express';
import { EmergencyStateModel } from '../models/EmergencyState';
import { AuthRequest } from '../middleware/auth';
import { setEmergencyState } from '../services/emergencyService';

export const getEmergencyState = async (req: AuthRequest, res: Response) => {
  const state = await EmergencyStateModel.findOne({ organisation: req.user!.organisationId });
  res.json(state);
};

export const activateEmergency = async (req: AuthRequest, res: Response) => {
  const state = await setEmergencyState(req.user!.organisationId, req.user!, true);
  res.json(state);
};

export const deactivateEmergency = async (req: AuthRequest, res: Response) => {
  const state = await setEmergencyState(req.user!.organisationId, req.user!, false);
  res.json(state);
};
