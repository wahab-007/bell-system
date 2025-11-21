"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduleRunner = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const Schedule_1 = require("../models/Schedule");
const deviceGateway_1 = require("../websocket/deviceGateway");
const EventLog_1 = require("../models/EventLog");
const Organisation_1 = require("../models/Organisation");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const startScheduleRunner = () => {
    node_cron_1.default.schedule('* * * * *', async () => {
        const now = (0, dayjs_1.default)();
        const day = now.day(); // 0-6
        const activeSchedules = await Schedule_1.ScheduleModel.find({
            active: true,
            $or: [{ 'repeatPattern.daysOfWeek': day }, { type: 'occasion' }],
        }).populate('bells');
        for (const schedule of activeSchedules) {
            const org = await Organisation_1.OrganisationModel.findById(schedule.organisation);
            const tzNow = org ? now.tz(org.timezone) : now;
            if (tzNow.format('HH:mm') !== schedule.time)
                continue;
            schedule.bells.forEach((bell) => {
                deviceGateway_1.deviceGateway.emitToBell(bell._id.toString(), 'ring', {
                    duration: schedule.durationSec,
                    scheduleId: schedule._id,
                });
                EventLog_1.EventLogModel.create({
                    organisation: schedule.organisation,
                    bell: bell._id,
                    type: 'bell_trigger',
                    payload: { scheduleId: schedule._id },
                }).catch(() => undefined);
            });
        }
    });
};
exports.startScheduleRunner = startScheduleRunner;
//# sourceMappingURL=scheduleRunner.js.map