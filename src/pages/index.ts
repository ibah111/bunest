import { Module } from '@nestjs/common';
import { AppPageModule } from './healthcheck/healthcheck.module';
import { WsaModule } from './wsa/wsa.module';
import { TipsModule } from './tips/tips.module';

@Module({
  imports: [AppPageModule, WsaModule, TipsModule],
})
export class PagesModule { }
