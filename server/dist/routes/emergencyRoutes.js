"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emergencyRouter = void 0;
const express_1 = require("express");
const emergencyController_1 = require("../controllers/emergencyController");
const auth_1 = require("../middleware/auth");
exports.emergencyRouter = (0, express_1.Router)();
exports.emergencyRouter.use((0, auth_1.requireAuth)(['owner', 'admin']));
exports.emergencyRouter.get('/', emergencyController_1.getEmergencyState);
exports.emergencyRouter.post('/activate', emergencyController_1.activateEmergency);
exports.emergencyRouter.post('/deactivate', emergencyController_1.deactivateEmergency);
//# sourceMappingURL=emergencyRoutes.js.map