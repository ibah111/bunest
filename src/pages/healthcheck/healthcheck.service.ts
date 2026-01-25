import { Injectable } from '@nestjs/common';

@Injectable()
export class AppPageService {
  getHello(): { message: string } {
    return { message: 'Hello World!' };
  }
}
