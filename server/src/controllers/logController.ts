import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { EventLogModel } from '../models/EventLog';

export const listOrgLogs = async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 20), 200);
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const sinceRaw = typeof req.query.since === 'string' ? req.query.since : undefined;
  const since = sinceRaw ? new Date(sinceRaw) : undefined;

  const query: Record<string, unknown> = { organisation: req.user!.organisationId };
  if (type) query.type = type;
  if (since && !Number.isNaN(since.getTime())) {
    query.timestamp = { $gt: since };
  }

  const logs = await EventLogModel.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate({
      path: 'bell',
      select: 'label block',
      populate: { path: 'block', select: 'name' },
    })
    .lean();

  res.json(logs);
};
