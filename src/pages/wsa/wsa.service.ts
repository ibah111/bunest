import { Injectable, Logger } from '@nestjs/common';
import { WsaGateway } from '../../modules/websocket/websocket.gateway';

@Injectable()
export class WsaService {
  private readonly logger = new Logger(WsaService.name);

  constructor(private readonly wsaGateway: WsaGateway) {}

  async eventHandler(body: any) {
    this.logger.verbose('Event handler touched');
    console.log(body);
    try {
      const objectId = body?.responseEventCommon?.objectId;

      this.wsaGateway.emitEvent(body);

      if (objectId) {
        this.wsaGateway.emitByObject(objectId, body);
        this.logger.debug(`Событие отправлено для объекта: ${objectId}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка при обработке события: ${error}`, error);
      throw error;
    }
  }
}
