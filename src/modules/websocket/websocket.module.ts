import { Global, Module } from '@nestjs/common';
import { WsaGateway } from './websocket.gateway';

@Global()
@Module({
  providers: [WsaGateway],
  exports: [WsaGateway],
})
export class WebsocketModule {}
