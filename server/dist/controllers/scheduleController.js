"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOccasions = exports.createOccasion = exports.deleteSchedule = exports.updateSchedule = exports.createSchedule = exports.listSchedules = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const Schedule_1 = require("../models/Schedule");
const scheduleValidators_1 = require("../validators/scheduleValidators");
const errorHandler_1 = require("../middleware/errorHandler");
const Occasion_1 = require("../models/Occasion");
const listSchedules = async (req, res) => {
    const schedules = await Schedule_1.ScheduleModel.find({ organisation: req.user.organisationId }).populate('bells');
    res.json(schedules);
};
exports.listSchedules = listSchedules;
const createSchedule = async (req, res) => {
    const data = scheduleValidators_1.scheduleSchema.parse(req.body);
    const schedule = await Schedule_1.ScheduleModel.create({
        organisation: req.user.organisationId,
        name: data.name,
        bells: data.bellIds,
        time: data.time,
        durationSec: data.durationSec,
        repeatPattern: { daysOfWeek: data.daysOfWeek },
        type: data.type,
        startDate: data.startDate ? (0, dayjs_1.default)(data.startDate).toDate() : undefined,
        endDate: data.endDate ? (0, dayjs_1.default)(data.endDate).toDate() : undefined,
        active: data.active ?? true,
    });
    res.status(201).json(schedule);
};
exports.createSchedule = createSchedule;
const updateSchedule = async (req, res) => {
    const data = scheduleValidators_1.scheduleSchema.partial().parse(req.body);
    const schedule = await Schedule_1.ScheduleModel.findOneAndUpdate({ _id: req.params.id, organisation: req.user.organisationId }, {
        ...data,
        repeatPattern: data.daysOfWeek ? { daysOfWeek: data.daysOfWeek } : undefined,
    }, { new: true });
    if (!schedule)
        throw new errorHandler_1.HttpError(404, 'Schedule not found');
    res.json(schedule);
};
exports.updateSchedule = updateSchedule;
const deleteSchedule = async (req, res) => {
    await Schedule_1.ScheduleModel.deleteOne({ _id: req.params.id, organisation: req.user.organisationId });
    res.status(204).end();
};
exports.deleteSchedule = deleteSchedule;
const createOccasion = async (req, res) => {
    const data = scheduleValidators_1.occasionSchema.parse(req.body);
    const schedule = await Schedule_1.ScheduleModel.create({
        organisation: req.user.organisationId,
        name: `${data.name} override`,
        bells: [],
        time: data.overrideSlots[0]?.time ?? '08:00',
        durationSec: data.overrideSlots[0]?.durationSec ?? 5,
        repeatPattern: { daysOfWeek: [] },
        type: 'occasion',
        startDate: (0, dayjs_1.default)(data.startDate).toDate(),
        endDate: (0, dayjs_1.default)(data.endDate).toDate(),
        active: true,
    });
    const occasion = await Occasion_1.OccasionModel.create({
        organisation: req.user.organisationId,
        name: data.name,
        startDate: (0, dayjs_1.default)(data.startDate).toDate(),
        endDate: (0, dayjs_1.default)(data.endDate).toDate(),
        schedule: schedule._id,
        overrideSlots: data.overrideSlots,
    });
    res.status(201).json(occasion);
};
exports.createOccasion = createOccasion;
const listOccasions = async (req, res) => {
    const occasions = await Occasion_1.OccasionModel.find({ organisation: req.user.organisationId });
    res.json(occasions);
};
exports.listOccasions = listOccasions;
//# sourceMappingURL=scheduleController.js.map