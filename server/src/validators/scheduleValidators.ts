import { z } from 'zod';

export const scheduleSchema = z.object({
  name: z.string().min(2),
  bellIds: z.array(z.string()).min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationSec: z.number().min(1).max(60),
  daysOfWeek: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]),
  type: z.enum(['regular', 'occasion']).default('regular'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  active: z.boolean().optional(),
});

export const occasionSchema = z.object({
  name: z.string().min(2),
  startDate: z.string(),
  endDate: z.string(),
  scheduleId: z.string(),
  overrideSlots: z
    .array(
      z.object({
        time: z.string().regex(/^\d{2}:\d{2}$/),
        durationSec: z.number().min(1).max(120),
      }),
    )
    .optional()
    .default([]),
});
