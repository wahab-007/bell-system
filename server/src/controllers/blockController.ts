import { Response } from 'express';
import { BlockModel } from '../models/Block';
import { BellModel } from '../models/Bell';
import { AuthRequest } from '../middleware/auth';
import { blockSchema } from '../validators/blockValidators';
import { HttpError } from '../middleware/errorHandler';

export const listBlocks = async (req: AuthRequest, res: Response) => {
  const blocks = await BlockModel.find({ organisation: req.user!.organisationId });
  res.json(blocks);
};

export const createBlock = async (req: AuthRequest, res: Response) => {
  const data = blockSchema.parse(req.body);
  const block = await BlockModel.create({
    organisation: req.user!.organisationId,
    ...data,
  });
  res.status(201).json(block);
};

export const updateBlock = async (req: AuthRequest, res: Response) => {
  const data = blockSchema.partial().parse(req.body);
  const block = await BlockModel.findOneAndUpdate(
    { _id: req.params.id, organisation: req.user!.organisationId },
    data,
    { new: true },
  );
  if (!block) throw new HttpError(404, 'Block not found');
  res.json(block);
};

export const deleteBlock = async (req: AuthRequest, res: Response) => {
  const inUse = await BellModel.exists({ block: req.params.id, organisation: req.user!.organisationId });
  if (inUse) {
    throw new HttpError(400, 'Cannot delete block while bells are assigned. Delete bell timings and bells first.');
  }
  await BlockModel.deleteOne({ _id: req.params.id, organisation: req.user!.organisationId });
  res.status(204).end();
};
