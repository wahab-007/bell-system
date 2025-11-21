"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
exports.redis = new ioredis_1.default(env_1.env.redisUrl, {
    lazyConnect: true,
});
const connectRedis = async () => {
    if (exports.redis.status === 'ready' || exports.redis.status === 'connecting')
        return;
    await exports.redis.connect();
};
exports.connectRedis = connectRedis;
//# sourceMappingURL=redis.js.map