import { Controller, Get } from '@nestjs/common';
import { AppPageService } from './app-page.service';

@Controller()
export class AppPageController {
  constructor(private readonly appService: AppPageService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
