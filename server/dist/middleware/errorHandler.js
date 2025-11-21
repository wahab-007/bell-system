"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.HttpError = void 0;
const logger_1 = require("../config/logger");
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.HttpError = HttpError;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err, _req, res, _next) => {
    logger_1.logger.error('API error', err);
    const status = err instanceof HttpError ? err.status : 500;
    const message = err.message || 'Unexpected error';
    res.status(status).json({ message });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map