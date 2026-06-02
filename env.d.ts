declare module 'bun' {
  interface Env {
    PORT?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
    APP_ROLE?: 'api' | 'consumer' | 'all';
    DATABASE_ENABLED?: string;
    DB_HOST?: string;
    DB_PORT?: string;
    DB_USERNAME?: string;
    DB_PASSWORD?: string;
    DB_NAME?: string;
    RABBITMQ_ENABLED?: string;
    RABBITMQ_URL?: string;
    RABBITMQ_EXCHANGE?: string;
    RABBITMQ_ROUTING_KEY?: string;
    RABBITMQ_QUEUE?: string;
    RABBITMQ_RETRY_QUEUE?: string;
    RABBITMQ_RETRY_DELAY_MS?: string;
    RABBITMQ_DEAD_EXCHANGE?: string;
    RABBITMQ_DEAD_ROUTING_KEY?: string;
    RABBITMQ_DEAD_QUEUE?: string;
    RABBITMQ_PREFETCH?: string;
    RABBITMQ_PUBLISH_RETRIES?: string;
    RABBITMQ_CONNECTION_RETRIES?: string;
    RABBITMQ_CONSUMER_MAX_RETRIES?: string;
    TELEGRAM_ENABLED?: string;
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_PROXY_URL?: string;
    TELEGRAM_REQUEST_TIMEOUT_SECONDS?: string;
  }
}
