import {
  Body,
  Controller,
  Headers,
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
  @Post('/event')
  async handleEvent(
    @Body() body: WsaInput,
    @Headers() headers: Record<string, string>,
  ) {
    try {
      await this.wsaService.eventHandler(body, headers);
    } catch (error) {
      console.log('error'.red, error);
    }
    return { success: true };
  }
}
