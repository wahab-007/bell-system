import { z } from 'zod';

export const blockSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});
