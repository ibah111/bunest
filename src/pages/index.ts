import { Module } from '@nestjs/common';
import { AppPageModule } from './healthcheck/healthcheck.module';
import { TipsModule } from './tips/tips.module';

@Module({
  imports: [AppPageModule, TipsModule],
})
export class PagesModule { }
