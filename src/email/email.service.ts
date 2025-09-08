import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import BaseEmailTemplate from 'emails/BaseEmailTemplate';
import * as nodemailer from 'nodemailer';
import { PrismaService } from 'src/db/prisma.service';
import { JobService } from 'src/job/job.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private frontendUrl: string;
  private emailFrom: string;

  constructor(
    private configService: ConfigService,
    private jobService: JobService,
    private prisma: PrismaService,
  ) {
    const emailConfig = this.configService.get<{
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
      from: string;
      frontendUrl: string;
    }>('email');

    if (emailConfig) {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth:
          emailConfig.auth?.user && emailConfig.auth.pass
            ? emailConfig.auth
            : undefined,
        tls: {
          rejectUnauthorized: false, // TODO: consider security implications
        },
      });
      this.frontendUrl = emailConfig.frontendUrl;
      this.emailFrom = emailConfig.from;
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.emailFrom,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} with subject "${subject}"`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${error.message}`,
        error.stack,
      );
      // Do not rethrow to prevent job retries for failed sends
    }
  }

  async sendEmail(email: string, text: string) {
    try {
      const emailHtml = await render(
        BaseEmailTemplate({
          text,
        }),
      );

      await this.jobService.sendEmail({
        to: email,
        subject: text,
        html: emailHtml,
      });
    } catch (error) {
      this.logger.error(
        `Failed to prepare or send email to ${email}: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Do not rethrow other errors to avoid breaking the calling process
    }
  }
}
