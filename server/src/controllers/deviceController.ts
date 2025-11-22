import { Request, Response } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { BellModel } from '../models/Bell';
import { signPayload } from '../utils/crypto';
import { HttpError } from '../middleware/errorHandler';
import { createDeviceSession } from '../services/deviceSessionService';
import { OrganisationModel } from '../models/Organisation';
import { ScheduleModel } from '../models/Schedule';

dayjs.extend(utc);
dayjs.extend(timezone);

const findNextBellMinutes = async (organisationId: string, bellId: string, tz: string) => {
  const schedules = await ScheduleModel.find({ organisation: organisationId, active: true, bells: bellId });
  const now = dayjs().tz(tz);
  let best: dayjs.Dayjs | null = null;

  for (const schedule of schedules) {
    const [hour, minute] = schedule.time.split(':').map(Number);
    for (let offset = 0; offset < 7; offset++) {
      const candidate = now
        .add(offset, 'day')
        .set('hour', hour)
        .set('minute', minute)
        .set('second', 0)
        .set('millisecond', 0);

      if (!schedule.repeatPattern?.daysOfWeek?.includes(candidate.day())) continue;
      if (schedule.startDate && candidate.isBefore(dayjs(schedule.startDate).tz(tz), 'day')) continue;
      if (schedule.endDate && candidate.isAfter(dayjs(schedule.endDate).tz(tz), 'day')) continue;
      if (candidate.isBefore(now)) continue;

      if (!best || candidate.isBefore(best)) {
        best = candidate;
      }
    }
  }

  if (!best) return null;
  const minutes = Math.ceil(best.diff(now, 'minute', true));
  return { at: best.toISOString(), minutes };
};

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
  const nextBell = await findNextBellMinutes(bell.organisation.toString(), bell._id.toString(), organisation.timezone);

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
    nextBell,
  });
};
