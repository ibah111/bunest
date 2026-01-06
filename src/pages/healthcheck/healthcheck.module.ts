import { Module } from '@nestjs/common';
import { AppPageController } from './healthcheck.controller';
import { AppPageService } from './healthcheck.service';

@Module({
  controllers: [AppPageController],
  providers: [AppPageService],
})
export class AppPageModule {}
