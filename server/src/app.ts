import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins.length ? env.corsOrigins : '*',
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
  }),
);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', apiRouter);

app.use(errorHandler);

export { app };
