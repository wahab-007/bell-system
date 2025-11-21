import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { BellModel } from '../models/Bell';
import { env } from '../config/env';
import { consumeDeviceSession } from '../services/deviceSessionService';
import { logger } from '../config/logger';

interface SocketContext {
  bellId: string;
  organisationId: string;
}

class DeviceGateway {
  private io?: Server;

  private socketsByBell = new Map<string, Socket>();

  private socketsByOrg = new Map<string, Set<Socket>>();

  init(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: env.corsOrigins.length ? env.corsOrigins : '*',
      },
    });

    this.io.on('connection', (socket) => {
      logger.info('Device connected', socket.id);
      socket.on('device:register', async ({ sessionToken }) => {
        const context = await consumeDeviceSession(sessionToken);
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

  private bindSocket(socket: Socket, context: SocketContext) {
    const { bellId, organisationId } = context;
    this.socketsByBell.set(bellId, socket);

    if (!this.socketsByOrg.has(organisationId)) {
      this.socketsByOrg.set(organisationId, new Set());
    }
    this.socketsByOrg.get(organisationId)!.add(socket);

    socket.data = context;
    socket.emit('device:ack', { bellId });
    BellModel.findByIdAndUpdate(bellId, { online: true, lastSeen: new Date() }).catch((err) =>
      logger.error('Failed to update bell', err),
    );
  }

  private unbindSocket(socket: Socket) {
    const ctx = socket.data as SocketContext | undefined;
    if (!ctx) return;
    if (this.socketsByBell.get(ctx.bellId) === socket) {
      this.socketsByBell.delete(ctx.bellId);
    }
    this.socketsByOrg.get(ctx.organisationId)?.delete(socket);
    BellModel.findByIdAndUpdate(ctx.bellId, { online: false }).catch((err) =>
      logger.error('Failed to mark bell offline', err),
    );
  }

  emitToBell(bellId: string, event: string, payload: unknown) {
    const socket = this.socketsByBell.get(bellId);
    if (socket) socket.emit(event, payload);
  }

  broadcastToOrganisation(organisationId: string, event: string, payload: unknown) {
    const sockets = this.socketsByOrg.get(organisationId);
    sockets?.forEach((socket) => socket.emit(event, payload));
  }
}

export const deviceGateway = new DeviceGateway();
