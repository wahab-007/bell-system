"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceRouter = void 0;
const express_1 = require("express");
const deviceController_1 = require("../controllers/deviceController");
exports.deviceRouter = (0, express_1.Router)();
exports.deviceRouter.post('/session', deviceController_1.requestSession);
//# sourceMappingURL=deviceRoutes.js.map