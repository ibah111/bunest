import { Module } from '@nestjs/common';
import { AppPageController } from './app-page.controller';

@Module({
  controllers: [AppPageController],
  providers: [AppPageController],
})
export class AppPageModule {}
