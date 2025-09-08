import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AuditLogQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    userId: z.uuid().optional(),
    action: z.string().optional(),
    resource: z.string().optional(),
    status: z.enum(['SUCCESS', 'FAILURE']).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    sortBy: z.string().optional().default('timestamp'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    search: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate && data.endDate < data.startDate) {
        return false;
      }
      return true;
    },
    {
      message: 'End date cannot be before start date',
      path: ['endDate'],
    },
  );

export class AuditLogQueryDto extends createZodDto(AuditLogQuerySchema) {}
