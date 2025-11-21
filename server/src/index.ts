import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { connectDb } from './config/db';
import { logger } from './config/logger';
import { deviceGateway } from './websocket/deviceGateway';
import { startScheduleRunner } from './jobs/scheduleRunner';
import { ensureDefaultAdmin } from './services/adminSeed';

const server = http.createServer(app);

const start = async () => {
  await connectDb();
  await ensureDefaultAdmin();
  deviceGateway.init(server);
  startScheduleRunner();

  server.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });
};

start();
