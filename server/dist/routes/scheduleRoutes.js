"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleRouter = void 0;
const express_1 = require("express");
const scheduleController_1 = require("../controllers/scheduleController");
const auth_1 = require("../middleware/auth");
exports.scheduleRouter = (0, express_1.Router)();
exports.scheduleRouter.use((0, auth_1.requireAuth)());
exports.scheduleRouter.get('/', scheduleController_1.listSchedules);
exports.scheduleRouter.post('/', scheduleController_1.createSchedule);
exports.scheduleRouter.put('/:id', scheduleController_1.updateSchedule);
exports.scheduleRouter.delete('/:id', scheduleController_1.deleteSchedule);
exports.scheduleRouter.post('/occasions', scheduleController_1.createOccasion);
exports.scheduleRouter.get('/occasions', scheduleController_1.listOccasions);
//# sourceMappingURL=scheduleRoutes.js.map