import { Response } from 'express';
import dayjs from 'dayjs';
import { BulbScheduleModel } from '../models/BulbSchedule';
import { AuthRequest } from '../middleware/auth';
import { bulbScheduleSchema } from '../validators/bulbValidators';
import { HttpError } from '../middleware/errorHandler';
import { BulbModel } from '../models/Bulb';

export const listBulbSchedules = async (req: AuthRequest, res: Response) => {
  const schedules = await BulbScheduleModel.find({ organisation: req.user!.organisationId }).populate('bulb');
  res.json(schedules);
};

export const createBulbSchedule = async (req: AuthRequest, res: Response) => {
  const data = bulbScheduleSchema.parse(req.body);
  const bulb = await BulbModel.findOne({ _id: data.bulbId, organisation: req.user!.organisationId });
  if (!bulb) throw new HttpError(404, 'Bulb not found');

  const schedule = await BulbScheduleModel.create({
    organisation: req.user!.organisationId,
    block: bulb.block,
    bulb: bulb._id,
    channel: bulb.channel,
    onTime: data.onTime,
    offTime: data.offTime,
    repeatPattern: { daysOfWeek: data.daysOfWeek },
    active: data.active ?? true,
  });
  res.status(201).json(schedule);
};

export const updateBulbSchedule = async (req: AuthRequest, res: Response) => {
  const data = bulbScheduleSchema.partial().parse(req.body);
  const schedule = await BulbScheduleModel.findOneAndUpdate(
    { _id: req.params.id, organisation: req.user!.organisationId },
    {
      ...data,
      repeatPattern: data.daysOfWeek ? { daysOfWeek: data.daysOfWeek } : undefined,
      bulb: undefined,
      channel: undefined,
    },
    { new: true },
  );
  if (!schedule) throw new HttpError(404, 'Bulb schedule not found');
  res.json(schedule);
};

export const deleteBulbSchedule = async (req: AuthRequest, res: Response) => {
  await BulbScheduleModel.deleteOne({ _id: req.params.id, organisation: req.user!.organisationId });
  res.status(204).end();
};
