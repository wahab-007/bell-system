"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
exports.app = app;
app.set('trust proxy', 1);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.corsOrigins.length ? env_1.env.corsOrigins : '*',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
if (env_1.env.nodeEnv !== 'test') {
    app.use((0, morgan_1.default)('dev'));
}
app.use((0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    limit: 120,
}));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes_1.apiRouter);
app.use(errorHandler_1.errorHandler);
//# sourceMappingURL=app.js.map