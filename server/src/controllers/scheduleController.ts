import { Response } from 'express';
import dayjs from 'dayjs';
import { ScheduleModel } from '../models/Schedule';
import { AuthRequest } from '../middleware/auth';
import { scheduleSchema, occasionSchema } from '../validators/scheduleValidators';
import { HttpError } from '../middleware/errorHandler';
import { OccasionModel } from '../models/Occasion';
import { backfillSchedulesForEvent, ensureDefaultEvent } from '../services/bellEventService';
import { BellEventModel } from '../models/BellEvent';

export const listSchedules = async (req: AuthRequest, res: Response) => {
  const defaultEvent = await ensureDefaultEvent(req.user!.organisationId);
  await backfillSchedulesForEvent(req.user!.organisationId, defaultEvent._id.toString());
  const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : undefined;
  const query = {
    organisation: req.user!.organisationId,
    ...(eventId ? { event: eventId } : {}),
  };
  const schedules = await ScheduleModel.find(query).populate('bells').populate('event', 'name active isDefault');
  res.json(schedules);
};

export const createSchedule = async (req: AuthRequest, res: Response) => {
  const data = scheduleSchema.parse(req.body);
  const defaultEvent = await ensureDefaultEvent(req.user!.organisationId);
  const eventId = data.eventId ?? defaultEvent._id.toString();
  const event = await BellEventModel.findOne({ _id: eventId, organisation: req.user!.organisationId });
  if (!event) throw new HttpError(404, 'Event not found for this organisation');
  const schedule = await ScheduleModel.create({
    organisation: req.user!.organisationId,
    event: event._id,
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
  const update: Record<string, unknown> = { ...data };
  delete update.eventId;
  if (data.eventId) {
    const event = await BellEventModel.findOne({ _id: data.eventId, organisation: req.user!.organisationId });
    if (!event) throw new HttpError(404, 'Event not found for this organisation');
    update.event = event._id;
  }
  if (data.daysOfWeek) update.repeatPattern = { daysOfWeek: data.daysOfWeek };
  const schedule = await ScheduleModel.findOneAndUpdate(
    { _id: req.params.id, organisation: req.user!.organisationId },
    update,
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
