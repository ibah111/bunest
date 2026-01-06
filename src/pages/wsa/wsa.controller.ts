import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { WsaService } from './wsa.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import type { WsaInput } from './wsa.input';

@ApiTags('WSA')
@Controller('wsa')
export class WsaController {
  constructor(private readonly wsaService: WsaService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event received',
  })
  @Post('/event')
  async getHello(@Body() body: object) {
    await this.wsaService.eventHandler(body);
    return HttpStatus.OK;
  }
}
