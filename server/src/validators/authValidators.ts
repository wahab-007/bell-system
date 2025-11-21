import { z } from 'zod';

export const signupSchema = z.object({
  organisationName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  timezone: z.string().default('UTC'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
