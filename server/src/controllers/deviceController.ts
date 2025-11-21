import { Request, Response } from 'express';
import dayjs from 'dayjs';
import { BellModel } from '../models/Bell';
import { signPayload } from '../utils/crypto';
import { HttpError } from '../middleware/errorHandler';
import { createDeviceSession } from '../services/deviceSessionService';
import { OrganisationModel } from '../models/Organisation';

export const requestSession = async (req: Request, res: Response) => {
  const { deviceId, deviceSecret, timestamp, signature } = req.body;
  if (!deviceId || !deviceSecret || !timestamp || !signature) throw new HttpError(400, 'Invalid payload');
  const expected = signPayload(`${deviceId}:${deviceSecret}:${timestamp}`);
  if (expected !== signature) throw new HttpError(401, 'Invalid signature');

  const bell = await BellModel.findOne({ deviceId });
  if (!bell) throw new HttpError(404, 'Device not registered');
  if (bell.deviceSecret !== deviceSecret) throw new HttpError(401, 'Invalid device credentials');

  const organisation = await OrganisationModel.findById(bell.organisation);
  if (!organisation) throw new HttpError(400, 'Organisation missing');

  const sessionToken = await createDeviceSession({
    bellId: bell._id.toString(),
    organisationId: bell.organisation.toString(),
  });

  res.json({
    sessionToken,
    bell: { id: bell._id, label: bell.label },
    serverTime: dayjs().toISOString(),
    config: {
      timezone: organisation.timezone,
      defaultDuration: organisation.settings.bellDurationSec,
    },
  });
};
