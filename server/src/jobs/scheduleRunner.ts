import cron from 'node-cron';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ScheduleModel } from '../models/Schedule';
import { deviceGateway } from '../websocket/deviceGateway';
import { EventLogModel } from '../models/EventLog';
import { OrganisationModel } from '../models/Organisation';

dayjs.extend(utc);
dayjs.extend(timezone);

export const startScheduleRunner = () => {
  cron.schedule('* * * * *', async () => {
    const now = dayjs();
    const day = now.day(); // 0-6

    const activeSchedules = await ScheduleModel.find({
      active: true,
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
};
