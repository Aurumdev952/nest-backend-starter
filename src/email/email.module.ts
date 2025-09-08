import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobModule } from 'src/job/job.module';
import { JobService } from 'src/job/job.service';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [ConfigModule, forwardRef(() => JobModule)],
  providers: [EmailService, JobService],
  controllers: [],
  exports: [EmailService],
})
export class EmailModule {}
