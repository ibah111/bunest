import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Bot, type BotConfig, type Context } from 'grammy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { telegramConfig } from '@/config';
import type { NotificationEventMessage } from '@/modules/notifications/notification-event.types';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Bot | null = null;

  constructor(
    @Inject(telegramConfig.KEY)
    private readonly config: ConfigType<typeof telegramConfig>,
  ) {}

  async sendNotification(event: NotificationEventMessage): Promise<void> {
    if (!this.config.enabled) {
      this.logger.log(
        `Telegram is disabled. Dry-run notification for event ${event.eventId}`,
      );
      return;
    }

    try {
      await this.getBot().api.sendMessage(
        event.telegramChatId,
        this.formatMessage(event),
        {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
        },
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Failed to send Telegram notification for event ${event.eventId}: ${error.message}`);
    }
  }

  private getBot(): Bot {
    if (this.bot) {
      return this.bot;
    }

    const agent = new HttpsProxyAgent(this.config.proxyUrl);
    const client = {
      baseFetchConfig: {
        agent,
      },
      timeoutSeconds: this.config.requestTimeoutSeconds,
    } as unknown as NonNullable<BotConfig<Context>['client']>;

    this.bot = new Bot(this.config.botToken, {
      client,
    });

    return this.bot;
  }

  private formatMessage(event: NotificationEventMessage): string {
    const payload =
      Object.keys(event.payload).length > 0
        ? `\nPayload: <code>${this.#escapeTelegramHtml(JSON.stringify(event.payload))}</code>`
        : '';

    return [
      `<b>${this.#escapeTelegramHtml(event.type)}</b>`,
      `Event: <code>${this.#escapeTelegramHtml(event.eventId)}</code>`,
      `Occurred at: ${this.#escapeTelegramHtml(event.occurredAt)}`,
      '',
      this.#escapeTelegramHtml(event.message),
      payload,
    ]
      .filter((line) => line !== '')
      .join('\n');
  }
  
  #escapeTelegramHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }
}

