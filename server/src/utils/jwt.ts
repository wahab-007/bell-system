import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser } from '../types';

const accessSecret: Secret = env.jwtAccessSecret;
const refreshSecret: Secret = env.jwtRefreshSecret;
const accessOptions: SignOptions = { expiresIn: env.jwtExpiry as SignOptions['expiresIn'] };
const refreshOptions: SignOptions = { expiresIn: env.refreshExpiry as SignOptions['expiresIn'] };

export const signAccessToken = (payload: AuthUser) => jwt.sign(payload, accessSecret, accessOptions);

export const signRefreshToken = (payload: AuthUser) => jwt.sign(payload, refreshSecret, refreshOptions);

export const verifyRefresh = (token: string) => jwt.verify(token, refreshSecret) as AuthUser;
