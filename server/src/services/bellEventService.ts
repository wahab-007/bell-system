import { BellEventModel } from '../models/BellEvent';
import { ScheduleModel } from '../models/Schedule';

export const ensureDefaultEvent = async (organisationId: string) => {
  let defaultEvent = await BellEventModel.findOne({ organisation: organisationId, isDefault: true });
  if (!defaultEvent) {
    const hasActive = await BellEventModel.exists({ organisation: organisationId, active: true });
    defaultEvent = await BellEventModel.create({
      organisation: organisationId,
      name: 'Normal',
      active: !hasActive,
      isDefault: true,
    });
  }

  const hasActive = await BellEventModel.exists({ organisation: organisationId, active: true });
  if (!defaultEvent.active && !hasActive) {
    await BellEventModel.updateMany({ organisation: organisationId }, { $set: { active: false } });
    defaultEvent.active = true;
    await defaultEvent.save();
  }

  return defaultEvent;
};

export const backfillSchedulesForEvent = async (organisationId: string, eventId: string) => {
  await ScheduleModel.updateMany(
    { organisation: organisationId, $or: [{ event: { $exists: false } }, { event: null }] },
    { $set: { event: eventId } },
  );
};
