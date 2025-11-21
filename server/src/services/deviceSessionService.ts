import { randomUUID } from 'crypto';
import { redis, connectRedis } from '../config/redis';

const SESSION_PREFIX = 'device:session';
const SESSION_TTL = 60 * 5;

interface DeviceSessionPayload {
  bellId: string;
  organisationId: string;
}

export const createDeviceSession = async (payload: DeviceSessionPayload) => {
  await connectRedis();
  const token = randomUUID();
  await redis.setex(`${SESSION_PREFIX}:${token}`, SESSION_TTL, JSON.stringify(payload));
  return token;
};

export const consumeDeviceSession = async (token: string): Promise<DeviceSessionPayload | null> => {
  await connectRedis();
  const key = `${SESSION_PREFIX}:${token}`;
  const raw = await redis.get(key);
  if (!raw) return null;
  await redis.del(key);
  return JSON.parse(raw) as DeviceSessionPayload;
};
