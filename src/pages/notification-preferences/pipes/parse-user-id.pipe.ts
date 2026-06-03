import { Injectable, type PipeTransform } from '@nestjs/common';
import { parseUserId } from './notification-input.parsers';

@Injectable()
export class ParseUserIdPipe implements PipeTransform<unknown, string> {
  transform(value: unknown): string {
    return parseUserId(value, 'id');
  }
}
