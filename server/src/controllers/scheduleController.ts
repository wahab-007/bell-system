import { Response } from 'express';
import dayjs from 'dayjs';
import { ScheduleModel } from '../models/Schedule';
import { AuthRequest } from '../middleware/auth';
import { scheduleSchema, occasionSchema } from '../validators/scheduleValidators';
import { HttpError } from '../middleware/errorHandler';
import { OccasionModel } from '../models/Occasion';

export const listSchedules = async (req: AuthRequest, res: Response) => {
  const schedules = await ScheduleModel.find({ organisation: req.user!.organisationId }).populate('bells');
  res.json(schedules);
};

export const createSchedule = async (req: AuthRequest, res: Response) => {
  const data = scheduleSchema.parse(req.body);
  const schedule = await ScheduleModel.create({
    organisation: req.user!.organisationId,
    name: data.name,
    bells: data.bellIds,
    time: data.time,
    durationSec: data.durationSec,
    repeatPattern: { daysOfWeek: data.daysOfWeek },
    type: data.type,
    startDate: data.startDate ? dayjs(data.startDate).toDate() : undefined,
    endDate: data.endDate ? dayjs(data.endDate).toDate() : undefined,
    active: data.active ?? true,
  });
  res.status(201).json(schedule);
};

export const updateSchedule = async (req: AuthRequest, res: Response) => {
  const data = scheduleSchema.partial().parse(req.body);
  const schedule = await ScheduleModel.findOneAndUpdate(
    { _id: req.params.id, organisation: req.user!.organisationId },
    {
      ...data,
      repeatPattern: data.daysOfWeek ? { daysOfWeek: data.daysOfWeek } : undefined,
    },
    { new: true },
  );
  if (!schedule) throw new HttpError(404, 'Schedule not found');
  res.json(schedule);
};

export const deleteSchedule = async (req: AuthRequest, res: Response) => {
  await ScheduleModel.deleteOne({ _id: req.params.id, organisation: req.user!.organisationId });
  res.status(204).end();
};

export const createOccasion = async (req: AuthRequest, res: Response) => {
  const data = occasionSchema.parse(req.body);
  const schedule = await ScheduleModel.findOne({
    _id: data.scheduleId,
    organisation: req.user!.organisationId,
  });
  if (!schedule) throw new HttpError(404, 'Schedule not found for this organisation');

  const slots =
    data.overrideSlots && data.overrideSlots.length
      ? data.overrideSlots
      : [{ time: schedule.time, durationSec: schedule.durationSec }];

  const occasion = await OccasionModel.create({
    organisation: req.user!.organisationId,
    name: data.name,
    startDate: dayjs(data.startDate).toDate(),
    endDate: dayjs(data.endDate).toDate(),
    schedule: schedule._id,
    overrideSlots: slots,
  });
  res.status(201).json(occasion);
};

export const listOccasions = async (req: AuthRequest, res: Response) => {
  const occasions = await OccasionModel.find({ organisation: req.user!.organisationId }).populate('schedule');
  res.json(occasions);
};

export const deleteOccasion = async (req: AuthRequest, res: Response) => {
  const deleted = await OccasionModel.findOneAndDelete({
    _id: req.params.id,
    organisation: req.user!.organisationId,
  });
  if (!deleted) throw new HttpError(404, 'Occasion not found');
  res.status(204).end();
};
