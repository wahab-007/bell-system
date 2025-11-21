"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumeDeviceSession = exports.createDeviceSession = void 0;
const crypto_1 = require("crypto");
const redis_1 = require("../config/redis");
const SESSION_PREFIX = 'device:session';
const SESSION_TTL = 60 * 5;
const createDeviceSession = async (payload) => {
    await (0, redis_1.connectRedis)();
    const token = (0, crypto_1.randomUUID)();
    await redis_1.redis.setex(`${SESSION_PREFIX}:${token}`, SESSION_TTL, JSON.stringify(payload));
    return token;
};
exports.createDeviceSession = createDeviceSession;
const consumeDeviceSession = async (token) => {
    await (0, redis_1.connectRedis)();
    const key = `${SESSION_PREFIX}:${token}`;
    const raw = await redis_1.redis.get(key);
    if (!raw)
        return null;
    await redis_1.redis.del(key);
    return JSON.parse(raw);
};
exports.consumeDeviceSession = consumeDeviceSession;
//# sourceMappingURL=deviceSessionService.js.map