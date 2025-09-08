import { PgBoss } from '@nestjs-enhanced/pg-boss';
import { Injectable } from '@nestjs/common';

export const SEND_EMAIL_JOB = 'send-email';
export interface SendEmailJobPayload {
  to: string;
  subject: string;
  html: string;
}

export const IMAGE_CONVERSION_JOB = 'image-conversion';

@Injectable()
export class JobService {
  constructor(private boss: PgBoss) {}

  async sendEmail(data: SendEmailJobPayload) {
    return this.boss.send(SEND_EMAIL_JOB, data);
  }
}
