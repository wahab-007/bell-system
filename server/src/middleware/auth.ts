import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser, OrgRole } from '../types';
import { HttpError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const requireAuth =
  (roles?: OrgRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);
      if (!token) throw new HttpError(401, 'Missing auth token');
      const decoded = jwt.verify(token, env.jwtAccessSecret) as AuthUser;
      req.user = decoded;
      if (roles && !roles.includes(decoded.role)) {
        throw new HttpError(403, 'Insufficient permissions');
      }
      next();
    } catch (error) {
      next(error);
    }
  };

const extractToken = (req: Request): string | undefined => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.split(' ')[1];
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return undefined;
};
