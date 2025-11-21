import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.redisUrl, {
  lazyConnect: true,
});

export const connectRedis = async () => {
  if (redis.status === 'ready' || redis.status === 'connecting') return;
  await redis.connect();
};
