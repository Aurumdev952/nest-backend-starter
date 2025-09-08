import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'db/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: ['info', 'query', 'warn'],
      errorFormat: 'pretty',
      adapter: adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
