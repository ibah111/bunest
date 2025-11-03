import { Injectable } from '@nestjs/common';

@Injectable()
export class AppPageService {
  getHello(): string {
    return 'Hello World!';
  }
}
