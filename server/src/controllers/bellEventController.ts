import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { BellEventModel } from '../models/BellEvent';
import { ScheduleModel } from '../models/Schedule';
import { HttpError } from '../middleware/errorHandler';
import { bellEventSchema, bellEventUpdateSchema } from '../validators/bellEventValidators';
import { backfillSchedulesForEvent, ensureDefaultEvent } from '../services/bellEventService';

export const listBellEvents = async (req: AuthRequest, res: Response) => {
  const defaultEvent = await ensureDefaultEvent(req.user!.organisationId);
  await backfillSchedulesForEvent(req.user!.organisationId, defaultEvent._id.toString());

  const events = await BellEventModel.find({ organisation: req.user!.organisationId }).sort({
    isDefault: -1,
    active: -1,
    name: 1,
  });
  res.json(events);
};

export const createBellEvent = async (req: AuthRequest, res: Response) => {
  const data = bellEventSchema.parse(req.body);
  if (data.active) {
    await BellEventModel.updateMany({ organisation: req.user!.organisationId }, { $set: { active: false } });
  }
  const event = await BellEventModel.create({
    organisation: req.user!.organisationId,
    name: data.name,
    active: data.active ?? false,
    isDefault: false,
  });
  res.status(201).json(event);
};

export const updateBellEvent = async (req: AuthRequest, res: Response) => {
  const data = bellEventUpdateSchema.parse(req.body);
  const event = await BellEventModel.findOneAndUpdate(
    { _id: req.params.id, organisation: req.user!.organisationId },
    { name: data.name },
    { new: true },
  );
  if (!event) throw new HttpError(404, 'Event not found');
  res.json(event);
};

export const activateBellEvent = async (req: AuthRequest, res: Response) => {
  const event = await BellEventModel.findOne({ _id: req.params.id, organisation: req.user!.organisationId });
  if (!event) throw new HttpError(404, 'Event not found');

  await BellEventModel.updateMany({ organisation: req.user!.organisationId }, { $set: { active: false } });
  event.active = true;
  await event.save();

  res.json(event);
};

export const deleteBellEvent = async (req: AuthRequest, res: Response) => {
  const event = await BellEventModel.findOne({ _id: req.params.id, organisation: req.user!.organisationId });
  if (!event) throw new HttpError(404, 'Event not found');
  if (event.isDefault) throw new HttpError(400, 'Default event cannot be deleted');

  const scheduleCount = await ScheduleModel.countDocuments({ organisation: req.user!.organisationId, event: event._id });
  if (scheduleCount > 0) {
    throw new HttpError(400, 'Remove schedules from this event before deleting it.');
  }

  if (event.active) {
    const defaultEvent = await ensureDefaultEvent(req.user!.organisationId);
    await BellEventModel.updateMany({ organisation: req.user!.organisationId }, { $set: { active: false } });
    await BellEventModel.updateOne({ _id: defaultEvent._id }, { $set: { active: true } });
  }

  await event.deleteOne();
  res.status(204).end();
};
