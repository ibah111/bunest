import { Module } from '@nestjs/common';
import { WsaController } from './wsa.controller';
import { WsaService } from './wsa.service';

@Module({
  controllers: [WsaController],
  providers: [WsaService],
})
export class WsaModule {}
