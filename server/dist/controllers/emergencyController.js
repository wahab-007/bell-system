"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateEmergency = exports.activateEmergency = exports.getEmergencyState = void 0;
const EmergencyState_1 = require("../models/EmergencyState");
const emergencyService_1 = require("../services/emergencyService");
const getEmergencyState = async (req, res) => {
    const state = await EmergencyState_1.EmergencyStateModel.findOne({ organisation: req.user.organisationId });
    res.json(state);
};
exports.getEmergencyState = getEmergencyState;
const activateEmergency = async (req, res) => {
    const state = await (0, emergencyService_1.setEmergencyState)(req.user.organisationId, req.user, true);
    res.json(state);
};
exports.activateEmergency = activateEmergency;
const deactivateEmergency = async (req, res) => {
    const state = await (0, emergencyService_1.setEmergencyState)(req.user.organisationId, req.user, false);
    res.json(state);
};
exports.deactivateEmergency = deactivateEmergency;
//# sourceMappingURL=emergencyController.js.map