import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { TipsService } from './tips.service';
import type { TipsInput } from './tips.input';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Tips')
@Controller('tips')
export class TipsController {
    constructor(private readonly tipsService: TipsService) { }

    @ApiOperation({
        summary: 'Get tips page',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Tips page',
    })
    @Get()
    async getTipsPage(
        @Query() query: TipsInput,
    ): Promise<any> {
        return await this.tipsService.getTipsPage(query);
    }
}