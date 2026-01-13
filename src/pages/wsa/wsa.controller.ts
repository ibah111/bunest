import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { WsaService } from './wsa.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { WsaInput } from './wsa.input';

@ApiTags('WSA')
@Controller('wsa')
export class WsaController {
  constructor(private readonly wsaService: WsaService) {}

  @ApiOperation({
    summary: 'For WSA events',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event received',
  })
  @HttpCode(200)
  @Post('/event')
  async handleEvent(@Body() body: WsaInput, @Res() res: Response) {
    const headers = res.headers;
    await this.wsaService.eventHandler(body, headers);
    return { success: true };
  }
}
