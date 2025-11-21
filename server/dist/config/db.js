"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("./logger");
const connectDb = async () => {
    try {
        await mongoose_1.default.connect(env_1.env.mongoUri, {
            autoIndex: env_1.env.nodeEnv !== 'production',
        });
        logger_1.logger.info('MongoDB connected');
    }
    catch (error) {
        logger_1.logger.error('Mongo connection failed', error);
        process.exit(1);
    }
};
exports.connectDb = connectDb;
//# sourceMappingURL=db.js.map