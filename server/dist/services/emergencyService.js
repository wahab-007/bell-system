"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setEmergencyState = void 0;
const EmergencyState_1 = require("../models/EmergencyState");
const EventLog_1 = require("../models/EventLog");
const deviceGateway_1 = require("../websocket/deviceGateway");
const setEmergencyState = async (organisationId, user, isActive) => {
    const state = await EmergencyState_1.EmergencyStateModel.findOneAndUpdate({ organisation: organisationId }, {
        active: isActive,
        activatedBy: user.id,
        startedAt: isActive ? new Date() : undefined,
    }, { upsert: true, new: true });
    await EventLog_1.EventLogModel.create({
        organisation: organisationId,
        type: 'emergency',
        payload: { isActive, user: user.id },
    });
    if (isActive) {
        deviceGateway_1.deviceGateway.broadcastToOrganisation(organisationId, 'emergency_on', {});
    }
    else {
        deviceGateway_1.deviceGateway.broadcastToOrganisation(organisationId, 'emergency_off', {});
    }
    return state;
};
exports.setEmergencyState = setEmergencyState;
//# sourceMappingURL=emergencyService.js.map