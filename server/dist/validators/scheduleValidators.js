"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.occasionSchema = exports.scheduleSchema = void 0;
const zod_1 = require("zod");
exports.scheduleSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    bellIds: zod_1.z.array(zod_1.z.string()).min(1),
    time: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    durationSec: zod_1.z.number().min(1).max(60),
    daysOfWeek: zod_1.z.array(zod_1.z.number().min(0).max(6)).default([1, 2, 3, 4, 5]),
    type: zod_1.z.enum(['regular', 'occasion']).default('regular'),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    active: zod_1.z.boolean().optional(),
});
exports.occasionSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    overrideSlots: zod_1.z.array(zod_1.z.object({
        time: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
        durationSec: zod_1.z.number().min(1).max(120),
    })),
});
//# sourceMappingURL=scheduleValidators.js.map