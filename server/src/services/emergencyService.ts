import { EmergencyStateModel } from '../models/EmergencyState';
import { EventLogModel } from '../models/EventLog';
import { AuthUser } from '../types';
import { deviceGateway } from '../websocket/deviceGateway';

export const setEmergencyState = async (organisationId: string, user: AuthUser, isActive: boolean) => {
  const state = await EmergencyStateModel.findOneAndUpdate(
    { organisation: organisationId },
    {
      active: isActive,
      activatedBy: user.id,
      startedAt: isActive ? new Date() : undefined,
    },
    { upsert: true, new: true },
  );

  await EventLogModel.create({
    organisation: organisationId,
    type: 'emergency',
    payload: { isActive, user: user.id },
  });

  if (isActive) {
    deviceGateway.broadcastToOrganisation(organisationId, 'emergency_on', {});
  } else {
    deviceGateway.broadcastToOrganisation(organisationId, 'emergency_off', {});
  }

  return state;
};
