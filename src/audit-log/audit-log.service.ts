import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AuditLog, Prisma } from 'db/client';

import { PrismaService } from 'src/db/prisma.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          details: entry.details
            ? JSON.parse(JSON.stringify(entry.details))
            : undefined,
          status: entry.status,
          errorMessage: entry.errorMessage,
        },
      });
    } catch (error) {
      this.logger.error('Failed to write audit log:', error);
    }
  }
  async findAllPaginated(queryDto: AuditLogQueryDto): Promise<{
    data: AuditLog[];
    count: number;
    totalPages: number;
    currentPage: number;
  }> {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      resource,
      status,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      search,
    } = queryDto;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }
    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }
    if (resource) {
      where.resource = { contains: resource, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }
    if (startDate) {
      where.timestamp = { gte: startDate };
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.timestamp = {
        ...(where.timestamp as { gte: Date }),
        lte: endOfDay,
      };
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { resourceId: { contains: search, mode: 'insensitive' } },
        { errorMessage: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    try {
      const auditLogs = await this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      });
      const count = await this.prisma.auditLog.count({ where });

      return {
        data: auditLogs,
        count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve audit logs:', error);
      throw new InternalServerErrorException('Failed to retrieve audit logs.');
    }
  }
  async getAuditLogTypes() {
    const logs = await this.prisma.auditLog.findMany({
      distinct: ['action'],
      select: {
        action: true,
      },
    });
    return logs.map((log) => log.action);
  }
}
