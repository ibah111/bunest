import { Module } from '@nestjs/common';
import { AppPageModule } from './healthcheck/healthcheck.module';
import { WsaModule } from './wsa/wsa.module';

@Module({
  imports: [AppPageModule, WsaModule],
})
export class PagesModule {}
