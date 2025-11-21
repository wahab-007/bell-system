import { Request, Response } from 'express';
import { signupSchema, loginSchema } from '../validators/authValidators';
import { OrganisationModel } from '../models/Organisation';
import { UserModel } from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefresh } from '../utils/jwt';
import { AuthUser } from '../types';
import { HttpError } from '../middleware/errorHandler';
import { EmergencyStateModel } from '../models/EmergencyState';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export const signup = async (req: Request, res: Response) => {
  const data = signupSchema.parse(req.body);
  const slug = slugify(data.organisationName);
  const organisation = await OrganisationModel.create({
    name: data.organisationName,
    slug,
    timezone: data.timezone,
    contactEmail: data.email,
    contactPhone: data.phone,
  });

  const password = await hashPassword(data.password);
  const user = await UserModel.create({
    organisation: organisation._id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    password,
    role: 'owner',
  });

  await EmergencyStateModel.create({
    organisation: organisation._id,
    active: false,
  });

  const payload: AuthUser = {
    id: user._id.toString(),
    organisationId: organisation._id.toString(),
    role: user.role,
    email: user.email,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.status(201).json({ user: payload, organisation, accessToken, refreshToken });
};

export const login = async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const user = await UserModel.findOne({ email: data.email }).populate('organisation');
  if (!user) throw new HttpError(401, 'Invalid credentials');
  const valid = await comparePassword(data.password, user.password);
  if (!valid) throw new HttpError(401, 'Invalid credentials');

  const organisationId =
    // when populated, pull the _id directly; otherwise it's already an ObjectId
    (user.organisation as any)?._id?.toString?.() ?? user.organisation.toString();

  const payload: AuthUser = {
    id: user._id.toString(),
    organisationId,
    role: user.role,
    email: user.email,
  };

  res.json({
    user: payload,
    organisation: user.organisation,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new HttpError(401, 'Missing refresh token');
  const payload = verifyRefresh(refreshToken);
  res.json({
    accessToken: signAccessToken(payload),
  });
};
