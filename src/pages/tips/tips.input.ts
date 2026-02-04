import { ApiProperty } from '@nestjs/swagger';

export interface ITipsInput {
    restraunt: string;
    waiter: string;
}

export class TipsInput implements ITipsInput {
    @ApiProperty({ description: 'Restaurant name', required: true })
    restraunt!: string;

    @ApiProperty({ description: 'Waiter name', required: true })
    waiter!: string;
}