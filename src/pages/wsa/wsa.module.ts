import { Module } from '@nestjs/common';
import { WsaController } from './wsa.controller';
import { WsaService } from './wsa.service';
import { WebsocketModule } from '../../modules/websocket/websocket.module';

@Module({
  controllers: [WsaController],
  providers: [WsaService],
})
export class WsaModule {}
