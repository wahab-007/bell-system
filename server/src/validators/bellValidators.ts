import { z } from 'zod';

export const bellSchema = z.object({
  label: z.string().min(2).trim(),
  blockId: z.string(),
  deviceId: z.string().min(4).trim(),
  deviceSecret: z.string().min(6).trim(),
  capabilities: z.array(z.string()).optional(),
});
