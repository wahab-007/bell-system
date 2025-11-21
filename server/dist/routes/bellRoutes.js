"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bellRouter = void 0;
const express_1 = require("express");
const bellController_1 = require("../controllers/bellController");
const auth_1 = require("../middleware/auth");
exports.bellRouter = (0, express_1.Router)();
exports.bellRouter.use((0, auth_1.requireAuth)());
exports.bellRouter.get('/', bellController_1.listBells);
exports.bellRouter.post('/', bellController_1.createBell);
exports.bellRouter.put('/:id', bellController_1.updateBell);
exports.bellRouter.delete('/:id', bellController_1.deleteBell);
//# sourceMappingURL=bellRoutes.js.map