import { Module } from '@nestjs/common';
import { PagesModule } from './pages';
import { ModuleOfModules } from './modules';

@Module({
  imports: [PagesModule, ModuleOfModules],
})
export class AppModule {}
