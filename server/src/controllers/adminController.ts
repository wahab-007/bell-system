import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { redis } from '../config/redis';
import { BlockModel } from '../models/Block';
import { BellModel } from '../models/Bell';
import { ScheduleModel } from '../models/Schedule';
import { EventLogModel } from '../models/EventLog';
import { OrganisationModel } from '../models/Organisation';
import { UserModel } from '../models/User';
import { hashPassword } from '../utils/password';
import { HttpError } from '../middleware/errorHandler';
import { slugify } from '../utils/slugify';

export const adminHealth = async (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState === 1 ? 'ok' : 'down';
  let redisStatus = 'down';
  try {
    await redis.ping();
    redisStatus = 'ok';
  } catch {
    redisStatus = 'down';
  }

  const [users, blocks, bells, schedules] = await Promise.all([
    UserModel.countDocuments(),
    BlockModel.countDocuments(),
    BellModel.countDocuments(),
    ScheduleModel.countDocuments(),
  ]);

  res.json({
    status: 'ok',
    uptimeSec: Math.round(process.uptime()),
    db: dbState,
    redis: redisStatus,
    counts: { users, blocks, bells, schedules },
    timestamp: new Date().toISOString(),
  });
};

export const listLogs = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const logs = await EventLogModel.find().sort({ timestamp: -1 }).limit(limit).lean();
  res.json(logs);
};

export const listUsers = async (_req: Request, res: Response) => {
  const users = await UserModel.find().populate('organisation', 'name').lean();
  res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
  const { email, password, role, name, organisationId } = req.body;
  if (!email || !password || !role || !organisationId || !name) {
    throw new HttpError(400, 'Missing required fields');
  }
  const org = await OrganisationModel.findById(organisationId);
  if (!org) throw new HttpError(404, 'Organisation not found');
  const hashed = await hashPassword(password);
  const user = await UserModel.create({
    organisation: organisationId,
    name,
    email,
    password: hashed,
    role,
  });
  res.status(201).json(user);
};

export const updateUser = async (req: Request, res: Response) => {
  const { email, password, role, name } = req.body;
  const update: Record<string, unknown> = {};
  if (email) update.email = email;
  if (role) update.role = role;
  if (name) update.name = name;
  if (password) update.password = await hashPassword(password);
  const user = await UserModel.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) throw new HttpError(404, 'User not found');
  res.json(user);
};

export const deleteUser = async (req: Request, res: Response) => {
  await UserModel.findByIdAndDelete(req.params.id);
  res.status(204).end();
};

export const listBlocksAdmin = async (_req: Request, res: Response) => {
  const blocks = await BlockModel.find().lean();
  res.json(blocks);
};

export const createBlockAdmin = async (req: Request, res: Response) => {
  const { name, organisationId, description } = req.body;
  if (!name || !organisationId) throw new HttpError(400, 'Missing required fields');
  const org = await OrganisationModel.findById(organisationId);
  if (!org) throw new HttpError(404, 'Organisation not found');
  const block = await BlockModel.create({ name, description, organisation: organisationId });
  res.status(201).json(block);
};

export const updateBlockAdmin = async (req: Request, res: Response) => {
  const block = await BlockModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!block) throw new HttpError(404, 'Block not found');
  res.json(block);
};

export const deleteBlockAdmin = async (req: Request, res: Response) => {
  await BlockModel.findByIdAndDelete(req.params.id);
  res.status(204).end();
};

export const listBellsAdmin = async (_req: Request, res: Response) => {
  const bells = await BellModel.find().populate('block organisation', 'name').lean();
  res.json(bells);
};

export const createBellAdmin = async (req: Request, res: Response) => {
  const { organisationId, blockId, label, deviceId, deviceSecret, capabilities } = req.body;
  if (!organisationId || !blockId || !label || !deviceId || !deviceSecret) {
    throw new HttpError(400, 'Missing required fields');
  }
  const bell = await BellModel.create({
    organisation: organisationId,
    block: blockId,
    label,
    deviceId,
    deviceSecret,
    capabilities: capabilities ?? [],
  });
  res.status(201).json(bell);
};

export const updateBellAdmin = async (req: Request, res: Response) => {
  const bell = await BellModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!bell) throw new HttpError(404, 'Bell not found');
  res.json(bell);
};

export const deleteBellAdmin = async (req: Request, res: Response) => {
  await BellModel.findByIdAndDelete(req.params.id);
  res.status(204).end();
};

export const listSchedulesAdmin = async (_req: Request, res: Response) => {
  const schedules = await ScheduleModel.find().populate('bells organisation', 'label name').lean();
  res.json(schedules);
};

export const createScheduleAdmin = async (req: Request, res: Response) => {
  const { organisationId, name, time, durationSec, bellIds, daysOfWeek, active } = req.body;
  if (!organisationId || !name || !time || !durationSec || !bellIds) {
    throw new HttpError(400, 'Missing required fields');
  }
  const schedule = await ScheduleModel.create({
    organisation: organisationId,
    name,
    time,
    durationSec,
    bells: bellIds,
    repeatPattern: { daysOfWeek: daysOfWeek ?? [1, 2, 3, 4, 5] },
    active: active ?? true,
  });
  res.status(201).json(schedule);
};

export const updateScheduleAdmin = async (req: Request, res: Response) => {
  const schedule = await ScheduleModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!schedule) throw new HttpError(404, 'Schedule not found');
  res.json(schedule);
};

export const deleteScheduleAdmin = async (req: Request, res: Response) => {
  await ScheduleModel.findByIdAndDelete(req.params.id);
  res.status(204).end();
};

export const listOrganisations = async (_req: Request, res: Response) => {
  const orgs = await OrganisationModel.find().lean();
  res.json(orgs);
};

export const createOrganisation = async (req: Request, res: Response) => {
  const { name, contactEmail, contactPhone, timezone } = req.body;
  if (!name || !contactEmail) throw new HttpError(400, 'Missing required fields');
  const org = await OrganisationModel.create({
    name,
    contactEmail,
    contactPhone,
    timezone: timezone || 'UTC',
    slug: slugify(name),
  });
  res.status(201).json(org);
};

export const updateOrganisationAdmin = async (req: Request, res: Response) => {
  const org = await OrganisationModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!org) throw new HttpError(404, 'Organisation not found');
  res.json(org);
};

export const deleteOrganisation = async (req: Request, res: Response) => {
  await OrganisationModel.findByIdAndDelete(req.params.id);
  res.status(204).end();
};
