import { Response } from 'express';
import { BulbModel } from '../models/Bulb';
import { BlockModel } from '../models/Block';
import { AuthRequest } from '../middleware/auth';
import { bulbToggleSchema, bulbUpdateSchema } from '../validators/bulbValidators';
import { HttpError } from '../middleware/errorHandler';
import { ensureBlockBulbs, sendBulbState } from '../services/bulbControlService';
import { EventLogModel } from '../models/EventLog';

export const listBulbs = async (req: AuthRequest, res: Response) => {
  const blocks = await BlockModel.find({ organisation: req.user!.organisationId });
  await Promise.all(blocks.map((block) => ensureBlockBulbs(req.user!.organisationId, block._id.toString())));
  const bulbs = await BulbModel.find({ organisation: req.user!.organisationId }).populate('block');
  res.json(bulbs);
};

export const updateBulb = async (req: AuthRequest, res: Response) => {
  const data = bulbUpdateSchema.parse(req.body);
  const bulb = await BulbModel.findOneAndUpdate(
    { _id: req.params.id, organisation: req.user!.organisationId },
    data,
    { new: true },
  );
  if (!bulb) throw new HttpError(404, 'Bulb not found');
  res.json(bulb);
};

export const toggleBulb = async (req: AuthRequest, res: Response) => {
  const data = bulbToggleSchema.parse(req.body);
  const bulb = await BulbModel.findOne({ _id: req.params.id, organisation: req.user!.organisationId });
  if (!bulb) throw new HttpError(404, 'Bulb not found');

  await sendBulbState(req.user!.organisationId, bulb.block.toString(), bulb.channel, data.state);
  bulb.state = data.state;
  bulb.lastToggledAt = new Date();
  await bulb.save();
  EventLogModel.create({
    organisation: req.user!.organisationId,
    type: 'bulb_toggle',
    payload: { bulbId: bulb._id, channel: bulb.channel, state: data.state, user: req.user!.id },
  }).catch(() => undefined);
  res.json(bulb);
};
