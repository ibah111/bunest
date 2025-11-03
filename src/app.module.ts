import { Module } from '@nestjs/common';
import { DatabaseModule } from './databases';
import { PagesModule } from './pages';


@Module({
  imports: [DatabaseModule, PagesModule],
})
export class AppModule {}
