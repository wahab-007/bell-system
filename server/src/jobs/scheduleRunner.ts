import cron from 'node-cron';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ScheduleModel } from '../models/Schedule';
import { deviceGateway } from '../websocket/deviceGateway';
import { EventLogModel } from '../models/EventLog';
import { OrganisationModel } from '../models/Organisation';
import { BulbScheduleModel } from '../models/BulbSchedule';
import { sendBulbState } from '../services/bulbControlService';
import { BulbModel } from '../models/Bulb';
import { logger } from '../config/logger';
import { BellEventModel } from '../models/BellEvent';
import { backfillSchedulesForEvent, ensureDefaultEvent } from '../services/bellEventService';

dayjs.extend(utc);
dayjs.extend(timezone);

export const startScheduleRunner = () => {
  const seedDefaultEvents = async () => {
    const orgs = await OrganisationModel.find().select('_id').lean();
    for (const org of orgs) {
      const defaultEvent = await ensureDefaultEvent(org._id.toString());
      await backfillSchedulesForEvent(org._id.toString(), defaultEvent._id.toString());
    }
  };

  seedDefaultEvents().catch((err) => logger.error('Failed to seed default events', err));

  cron.schedule('* * * * *', async () => {
    const now = dayjs();
    const day = now.day(); // 0-6
    const activeEvents = await BellEventModel.find({ active: true }).select('_id').lean();
    const activeEventIds = activeEvents.map((event) => event._id);

    const activeSchedules = await ScheduleModel.find({
      active: true,
      event: { $in: activeEventIds },
      $or: [{ 'repeatPattern.daysOfWeek': day }, { type: 'occasion' }],
    }).populate('bells');

    for (const schedule of activeSchedules) {
      const org = await OrganisationModel.findById(schedule.organisation);
      const tzNow = org ? now.tz(org.timezone) : now;
      if (tzNow.format('HH:mm') !== schedule.time) continue;
      schedule.bells.forEach((bell: any) => {
        deviceGateway.emitToBell(bell._id.toString(), 'ring', {
          duration: schedule.durationSec,
          scheduleId: schedule._id,
        });
        EventLogModel.create({
          organisation: schedule.organisation,
          bell: bell._id,
          type: 'bell_trigger',
          payload: { scheduleId: schedule._id },
        }).catch(() => undefined);
      });
    }
  });

  cron.schedule('* * * * *', async () => {
    const now = dayjs();
    const day = now.day();

    const bulbSchedules = await BulbScheduleModel.find({
      active: true,
      'repeatPattern.daysOfWeek': day,
    });

    for (const schedule of bulbSchedules) {
      const org = await OrganisationModel.findById(schedule.organisation);
      const tzNow = org ? now.tz(org.timezone) : now;
      const hhmm = tzNow.format('HH:mm');

      if (hhmm === schedule.onTime) {
        try {
          await sendBulbState(schedule.organisation.toString(), schedule.block.toString(), schedule.channel, true);
          await BulbModel.findByIdAndUpdate(schedule.bulb, { state: true, lastToggledAt: new Date() }).catch(() => undefined);
          await EventLogModel.create({
            organisation: schedule.organisation,
            type: 'bulb_on',
            payload: { scheduleId: schedule._id, channel: schedule.channel, block: schedule.block },
          }).catch(() => undefined);
        } catch (err) {
          logger.error('Failed to turn bulb on', err);
        }
      }

      if (hhmm === schedule.offTime) {
        try {
          await sendBulbState(schedule.organisation.toString(), schedule.block.toString(), schedule.channel, false);
          await BulbModel.findByIdAndUpdate(schedule.bulb, { state: false, lastToggledAt: new Date() }).catch(() => undefined);
          await EventLogModel.create({
            organisation: schedule.organisation,
            type: 'bulb_off',
            payload: { scheduleId: schedule._id, channel: schedule.channel, block: schedule.block },
          }).catch(() => undefined);
        } catch (err) {
          logger.error('Failed to turn bulb off', err);
        }
      }
    }
  });
};
