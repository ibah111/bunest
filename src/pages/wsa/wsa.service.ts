import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WsaService {
  private readonly logger: Logger = new Logger();
  constructor() {}

  async eventHandler(body: any) {
    this.logger.verbose('Event handler touched');
    console.log(body);
  }
}
