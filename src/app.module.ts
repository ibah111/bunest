import { Module } from '@nestjs/common';
import { PagesModule } from './pages';

@Module({
  imports: [PagesModule],
})
export class AppModule {}
