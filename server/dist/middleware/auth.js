"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errorHandler_1 = require("./errorHandler");
const requireAuth = (roles) => (req, _res, next) => {
    try {
        const token = extractToken(req);
        if (!token)
            throw new errorHandler_1.HttpError(401, 'Missing auth token');
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtAccessSecret);
        req.user = decoded;
        if (roles && !roles.includes(decoded.role)) {
            throw new errorHandler_1.HttpError(403, 'Insufficient permissions');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireAuth = requireAuth;
const extractToken = (req) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        return header.split(' ')[1];
    }
    if (req.cookies?.accessToken) {
        return req.cookies.accessToken;
    }
    return undefined;
};
//# sourceMappingURL=auth.js.map