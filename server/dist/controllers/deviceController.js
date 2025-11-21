"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestSession = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const Bell_1 = require("../models/Bell");
const crypto_1 = require("../utils/crypto");
const errorHandler_1 = require("../middleware/errorHandler");
const deviceSessionService_1 = require("../services/deviceSessionService");
const Organisation_1 = require("../models/Organisation");
const requestSession = async (req, res) => {
    const { deviceId, timestamp, signature } = req.body;
    if (!deviceId || !timestamp || !signature)
        throw new errorHandler_1.HttpError(400, 'Invalid payload');
    const expected = (0, crypto_1.signPayload)(`${deviceId}:${timestamp}`);
    if (expected !== signature)
        throw new errorHandler_1.HttpError(401, 'Invalid signature');
    const bell = await Bell_1.BellModel.findOne({ deviceId });
    if (!bell)
        throw new errorHandler_1.HttpError(404, 'Device not registered');
    const organisation = await Organisation_1.OrganisationModel.findById(bell.organisation);
    if (!organisation)
        throw new errorHandler_1.HttpError(400, 'Organisation missing');
    const sessionToken = await (0, deviceSessionService_1.createDeviceSession)({
        bellId: bell._id.toString(),
        organisationId: bell.organisation.toString(),
    });
    res.json({
        sessionToken,
        bell: { id: bell._id, label: bell.label },
        serverTime: (0, dayjs_1.default)().toISOString(),
        config: {
            timezone: organisation.timezone,
            defaultDuration: organisation.settings.bellDurationSec,
        },
    });
};
exports.requestSession = requestSession;
//# sourceMappingURL=deviceController.js.map