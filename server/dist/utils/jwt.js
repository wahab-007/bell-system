"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefresh = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const accessSecret = env_1.env.jwtAccessSecret;
const refreshSecret = env_1.env.jwtRefreshSecret;
const accessOptions = { expiresIn: env_1.env.jwtExpiry };
const refreshOptions = { expiresIn: env_1.env.refreshExpiry };
const signAccessToken = (payload) => jsonwebtoken_1.default.sign(payload, accessSecret, accessOptions);
exports.signAccessToken = signAccessToken;
const signRefreshToken = (payload) => jsonwebtoken_1.default.sign(payload, refreshSecret, refreshOptions);
exports.signRefreshToken = signRefreshToken;
const verifyRefresh = (token) => jsonwebtoken_1.default.verify(token, refreshSecret);
exports.verifyRefresh = verifyRefresh;
//# sourceMappingURL=jwt.js.map