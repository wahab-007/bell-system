"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const logger_1 = require("./config/logger");
const deviceGateway_1 = require("./websocket/deviceGateway");
const scheduleRunner_1 = require("./jobs/scheduleRunner");
const server = http_1.default.createServer(app_1.app);
const start = async () => {
    await (0, db_1.connectDb)();
    deviceGateway_1.deviceGateway.init(server);
    (0, scheduleRunner_1.startScheduleRunner)();
    server.listen(env_1.env.port, () => {
        logger_1.logger.info(`Server running on port ${env_1.env.port}`);
    });
};
start();
//# sourceMappingURL=index.js.map