import { Response } from 'express';
import { BellModel } from '../models/Bell';
import { BlockModel } from '../models/Block';
import { AuthRequest } from '../middleware/auth';
import { bellSchema } from '../validators/bellValidators';
import { HttpError } from '../middleware/errorHandler';
import { ScheduleModel } from '../models/Schedule';

export const listBells = async (req: AuthRequest, res: Response) => {
  const bells = await BellModel.find({ organisation: req.user!.organisationId }).populate('block');
  res.json(bells);
};

export const createBell = async (req: AuthRequest, res: Response) => {
  const data = bellSchema.parse(req.body);
  const block = await BlockModel.findOne({ _id: data.blockId, organisation: req.user!.organisationId });
  if (!block) throw new HttpError(404, 'Block not found');

  const bell = await BellModel.create({
    organisation: req.user!.organisationId,
    block: block._id,
    label: data.label,
    deviceId: data.deviceId,
    deviceSecret: data.deviceSecret,
    capabilities: data.capabilities ?? [],
  });
  res.status(201).json(bell);
};

export const updateBell = async (req: AuthRequest, res: Response) => {
  const data = bellSchema.partial().parse(req.body);
  const bell = await BellModel.findOneAndUpdate(
    { _id: req.params.id, organisation: req.user!.organisationId },
    data,
    { new: true },
  );
  if (!bell) throw new HttpError(404, 'Bell not found');
  res.json(bell);
};

export const deleteBell = async (req: AuthRequest, res: Response) => {
  const inUse = await ScheduleModel.exists({
    organisation: req.user!.organisationId,
    bells: req.params.id,
  });
  if (inUse) {
    throw new HttpError(400, 'Cannot delete bell while it is used in bell timings. Remove it from schedules first.');
  }
  await BellModel.deleteOne({ _id: req.params.id, organisation: req.user!.organisationId });
  res.status(204).end();
};
