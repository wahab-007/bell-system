"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
/* eslint-disable no-console */
const dayjs_1 = __importDefault(require("dayjs"));
const env_1 = require("./env");
const log = (level, message, meta) => {
    const ts = (0, dayjs_1.default)().toISOString();
    const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
    if (meta) {
        console[level === 'info' ? 'log' : level](base, meta);
    }
    else {
        console[level === 'info' ? 'log' : level](base);
    }
};
exports.logger = {
    info: (msg, meta) => log('info', msg, meta),
    warn: (msg, meta) => log('warn', msg, meta),
    error: (msg, meta) => log('error', msg, meta),
    debug: (msg, meta) => {
        if (!env_1.isProd)
            log('debug', msg, meta);
    },
};
//# sourceMappingURL=logger.js.map