import { z } from 'zod';

export const bulbUpdateSchema = z.object({
  label: z.string().min(1).optional(),
});

export const bulbToggleSchema = z.object({
  state: z.boolean(),
});

export const bulbScheduleSchema = z.object({
  bulbId: z.string(),
  onTime: z.string().regex(/^\d{2}:\d{2}$/),
  offTime: z.string().regex(/^\d{2}:\d{2}$/),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).nonempty(),
  active: z.boolean().optional(),
});
