"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bellSchema = void 0;
const zod_1 = require("zod");
exports.bellSchema = zod_1.z.object({
    label: zod_1.z.string().min(2),
    blockId: zod_1.z.string(),
    deviceId: zod_1.z.string().min(4),
    capabilities: zod_1.z.array(zod_1.z.string()).optional(),
});
//# sourceMappingURL=bellValidators.js.map