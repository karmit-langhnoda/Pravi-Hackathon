import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().min(1, 'Role is required'),
  department: z.string().optional(),
  employeeId: z.string().optional(),
  scope: z
    .object({
      locations: z.array(z.string()).optional(),
      assetTypes: z.array(z.string()).optional(),
    })
    .optional(),
  status: z.enum(['active', 'disabled']).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.string().optional(),
  department: z.string().nullable().optional(),
  employeeId: z.string().optional(),
  scope: z
    .object({
      locations: z.array(z.string()).optional(),
      assetTypes: z.array(z.string()).optional(),
    })
    .optional(),
  status: z.enum(['active', 'disabled']).optional(),
});
