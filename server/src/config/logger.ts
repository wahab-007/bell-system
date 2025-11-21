/* eslint-disable no-console */
import dayjs from 'dayjs';
import { isProd } from './env';

type Level = 'info' | 'warn' | 'error' | 'debug';

const log = (level: Level, message: string, meta?: unknown) => {
  const ts = dayjs().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  if (meta) {
    console[level === 'info' ? 'log' : level](base, meta);
  } else {
    console[level === 'info' ? 'log' : level](base);
  }
};

export const logger = {
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  error: (msg: string, meta?: unknown) => log('error', msg, meta),
  debug: (msg: string, meta?: unknown) => {
    if (!isProd) log('debug', msg, meta);
  },
};
