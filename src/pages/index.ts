import { Module } from '@nestjs/common';
import { AppPageModule } from './healthcheck/healthcheck.module';

@Module({
  imports: [AppPageModule],
})
export class PagesModule {}
