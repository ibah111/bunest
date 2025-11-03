import { Module } from '@nestjs/common';
import { AppPageModule } from './app-page/app-page.module';

@Module({
  imports: [AppPageModule],
})
export class PagesModule {}
