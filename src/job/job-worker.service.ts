import { PgBoss, ProcessQueue } from '@nestjs-enhanced/pg-boss';
import { Injectable, Logger } from '@nestjs/common';
import pgBoss from 'pg-boss';
import { PrismaService } from 'src/db/prisma.service';
import { EmailService } from 'src/email/email.service';

import { SEND_EMAIL_JOB, SendEmailJobPayload } from './job.service';

@Injectable()
export class JobWorker {
  public logger = new Logger(JobWorker.name);
  constructor(
    private boss: PgBoss,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}
  @ProcessQueue(SEND_EMAIL_JOB)
  async sendEmail(job: pgBoss.Job<SendEmailJobPayload>) {
    try {
      const { to, subject, html } = job.data;
      await this.emailService.sendMail(to, subject, html);
    } catch (error) {
      this.logger.error('Error sending email', error);
      throw error;
    }
  }
}
