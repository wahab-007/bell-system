import { BellModel } from '../models/Bell';
import { BulbModel } from '../models/Bulb';
import { deviceGateway } from '../websocket/deviceGateway';
import { HttpError } from '../middleware/errorHandler';
import { BulbScheduleModel } from '../models/BulbSchedule';

export const ensureBlockBulbs = async (organisationId: string, blockId: string) => {
  const existing = await BulbModel.countDocuments({ organisation: organisationId, block: blockId });
  if (existing >= 3) return;
  const docs = [];
  for (let channel = 1; channel <= 3; channel++) {
    docs.push({
      organisation: organisationId,
      block: blockId,
      channel,
      label: `Bulb ${channel}`,
    });
  }
  await BulbModel.insertMany(docs);
};

const findControllerBell = async (organisationId: string, blockId: string) => {
  const bell = await BellModel.findOne({ organisation: organisationId, block: blockId });
  if (!bell) {
    throw new HttpError(400, 'No bell/device found for this block. Add a bell with a device to control bulbs.');
  }
  return bell;
};

export const sendBulbState = async (organisationId: string, blockId: string, channel: number, state: boolean) => {
  const bell = await findControllerBell(organisationId, blockId);
  deviceGateway.emitToBell(bell._id.toString(), 'bulb:set', { channel, state });
};

export const cleanupBulbDataForBlock = async (organisationId: string, blockId: string) => {
  await BulbModel.deleteMany({ organisation: organisationId, block: blockId });
  await BulbScheduleModel.deleteMany({ organisation: organisationId, block: blockId });
};
