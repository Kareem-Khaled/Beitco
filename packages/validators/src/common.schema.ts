import { z } from 'zod';

// ─── Pagination ─────────────────────────────────────

export const cursorPaginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;

// ─── Phone (Egyptian) ───────────────────────────────

export const egyptianPhoneSchema = z
  .string()
  .regex(/^\+20(10|11|12|15)\d{8}$/, 'Invalid Egyptian phone number');

// ─── Common Fields ──────────────────────────────────

export const uuidSchema = z.string().uuid();
