"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProd = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const required = (value, key) => {
    if (!value) {
        throw new Error(`Missing required env var ${key}`);
    }
    return value;
};
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 5000),
    mongoUri: required(process.env.MONGO_URI, 'MONGO_URI'),
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    jwtAccessSecret: required(process.env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET'),
    jwtRefreshSecret: required(process.env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET'),
    jwtExpiry: process.env.JWT_EXPIRY ?? '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
    corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
    deviceHmacSecret: required(process.env.DEVICE_HMAC_SECRET, 'DEVICE_HMAC_SECRET'),
    deviceAesSecret: required(process.env.DEVICE_AES_SECRET, 'DEVICE_AES_SECRET'),
    dashboardUrl: process.env.DASHBOARD_URL ?? 'http://localhost:5173',
};
exports.isProd = exports.env.nodeEnv === 'production';
//# sourceMappingURL=env.js.map