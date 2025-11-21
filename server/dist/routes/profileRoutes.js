"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRouter = void 0;
const express_1 = require("express");
const profileController_1 = require("../controllers/profileController");
const auth_1 = require("../middleware/auth");
exports.profileRouter = (0, express_1.Router)();
exports.profileRouter.use((0, auth_1.requireAuth)());
exports.profileRouter.get('/', profileController_1.getProfile);
exports.profileRouter.put('/', profileController_1.updateProfile);
exports.profileRouter.put('/organisation', (0, auth_1.requireAuth)(['owner']), profileController_1.updateOrganisation);
//# sourceMappingURL=profileRoutes.js.map