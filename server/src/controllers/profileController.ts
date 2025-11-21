import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { OrganisationModel } from '../models/Organisation';
import { hashPassword } from '../utils/password';

export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = await UserModel.findById(req.user!.id).select('-password');
  res.json(user);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { name, phone, password, email } = req.body;
  const payload: Record<string, unknown> = {};
  if (name) payload.name = name;
  if (phone) payload.phone = phone;
  if (email) payload.email = email;
  if (password) payload.password = await hashPassword(password);
  const user = await UserModel.findByIdAndUpdate(req.user!.id, payload, { new: true }).select('-password');
  res.json(user);
};

export const updateOrganisation = async (req: AuthRequest, res: Response) => {
  const { name, contactEmail, contactPhone, timezone } = req.body;
  const org = await OrganisationModel.findByIdAndUpdate(
    req.user!.organisationId,
    { name, contactEmail, contactPhone, timezone },
    { new: true },
  );
  res.json(org);
};
