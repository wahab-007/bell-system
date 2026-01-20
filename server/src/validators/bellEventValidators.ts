import { z } from 'zod';

export const bellEventSchema = z.object({
  name: z.string().min(2),
  active: z.boolean().optional(),
});

export const bellEventUpdateSchema = z.object({
  name: z.string().min(2),
});
