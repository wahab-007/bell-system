"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceGateway = void 0;
const socket_io_1 = require("socket.io");
const Bell_1 = require("../models/Bell");
const env_1 = require("../config/env");
const deviceSessionService_1 = require("../services/deviceSessionService");
const logger_1 = require("../config/logger");
class DeviceGateway {
    constructor() {
        this.socketsByBell = new Map();
        this.socketsByOrg = new Map();
    }
    init(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: env_1.env.corsOrigins.length ? env_1.env.corsOrigins : '*',
            },
        });
        this.io.on('connection', (socket) => {
            logger_1.logger.info('Device connected', socket.id);
            socket.on('device:register', async ({ sessionToken }) => {
                const context = await (0, deviceSessionService_1.consumeDeviceSession)(sessionToken);
                if (!context) {
                    socket.emit('device:error', { message: 'invalid_session' });
                    socket.disconnect(true);
                    return;
                }
                this.bindSocket(socket, context);
            });
            socket.on('disconnect', () => {
                this.unbindSocket(socket);
            });
        });
    }
    bindSocket(socket, context) {
        const { bellId, organisationId } = context;
        this.socketsByBell.set(bellId, socket);
        if (!this.socketsByOrg.has(organisationId)) {
            this.socketsByOrg.set(organisationId, new Set());
        }
        this.socketsByOrg.get(organisationId).add(socket);
        socket.data = context;
        socket.emit('device:ack', { bellId });
        Bell_1.BellModel.findByIdAndUpdate(bellId, { online: true, lastSeen: new Date() }).catch((err) => logger_1.logger.error('Failed to update bell', err));
    }
    unbindSocket(socket) {
        const ctx = socket.data;
        if (!ctx)
            return;
        if (this.socketsByBell.get(ctx.bellId) === socket) {
            this.socketsByBell.delete(ctx.bellId);
        }
        this.socketsByOrg.get(ctx.organisationId)?.delete(socket);
        Bell_1.BellModel.findByIdAndUpdate(ctx.bellId, { online: false }).catch((err) => logger_1.logger.error('Failed to mark bell offline', err));
    }
    emitToBell(bellId, event, payload) {
        const socket = this.socketsByBell.get(bellId);
        if (socket)
            socket.emit(event, payload);
    }
    broadcastToOrganisation(organisationId, event, payload) {
        const sockets = this.socketsByOrg.get(organisationId);
        sockets?.forEach((socket) => socket.emit(event, payload));
    }
}
exports.deviceGateway = new DeviceGateway();
//# sourceMappingURL=deviceGateway.js.map