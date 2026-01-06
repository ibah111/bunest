import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';

interface WsaEventPayload {
  responseEventCommon?: {
    objectId?: number | string;
  };
  [key: string]: unknown;
}

@WebSocketGateway({
  namespace: '/wsa',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class WsaGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WsaGateway.name);

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway инициализирован');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Клиент подключен: ${client.id}`);

    client.emit('wsa.connected', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Клиент отключен: ${client.id}`);
  }

  @SubscribeMessage('wsa.subscribe')
  handleSubscribe(client: Socket, payload: { objectId: number | string }) {
    try {
      if (!payload?.objectId) {
        client.emit('wsa.error', {
          message: 'objectId обязателен для подписки',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { objectId } = payload;
      const room = `object:${objectId}`;
      client.join(room);
      this.logger.log(`Клиент ${client.id} подписан на объект: ${objectId}`);

      client.emit('wsa.subscribed', {
        objectId,
        room,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Ошибка при подписке: ${error}`);
      client.emit('wsa.error', {
        message: 'Ошибка при подписке',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('wsa.unsubscribe')
  handleUnsubscribe(client: Socket, payload: { objectId: number | string }) {
    try {
      if (!payload?.objectId) {
        client.emit('wsa.error', {
          message: 'objectId обязателен для отписки',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { objectId } = payload;
      const room = `object:${objectId}`;
      client.leave(room);
      this.logger.log(`Клиент ${client.id} отписан от объекта: ${objectId}`);

      client.emit('wsa.unsubscribed', {
        objectId,
        room,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Ошибка при отписке: ${error}`);
      client.emit('wsa.error', {
        message: 'Ошибка при отписке',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  emitEvent(payload: WsaEventPayload): void {
    try {
      this.server.emit('wsa.event', {
        ...payload,
        timestamp: new Date().toISOString(),
      });
      this.logger.debug('Событие отправлено всем клиентам');
    } catch (error) {
      this.logger.error(`Ошибка при отправке события: ${error}`);
      throw error;
    }
  }

  emitByObject(objectId: number | string, payload: WsaEventPayload): void {
    try {
      const room = `object:${objectId}`;
      this.server.to(room).emit('wsa.event', {
        ...payload,
        objectId,
        timestamp: new Date().toISOString(),
      });
      this.logger.debug(`Событие отправлено в комнату: ${room}`);
    } catch (error) {
      this.logger.error(
        `Ошибка при отправке события для объекта ${objectId}: ${error}`,
      );
      throw error;
    }
  }

  emitToClient(clientId: string, payload: WsaEventPayload): void {
    try {
      this.server.to(clientId).emit('wsa.event', {
        ...payload,
        timestamp: new Date().toISOString(),
      });
      this.logger.debug(`Событие отправлено клиенту: ${clientId}`);
    } catch (error) {
      this.logger.error(
        `Ошибка при отправке события клиенту ${clientId}: ${error}`,
      );
      throw error;
    }
  }

  getConnectedClientsCount(): number {
    return this.server.sockets.sockets.size;
  }
}
