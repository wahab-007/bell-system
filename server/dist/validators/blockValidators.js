"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockSchema = void 0;
const zod_1 = require("zod");
exports.blockSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
});
//# sourceMappingURL=blockValidators.js.map