# Bun Nest RabbitMQ Telegram Service

NestJS 11 + Bun microservice demo with RabbitMQ producer/consumer flow,
PostgreSQL persistence through TypeORM migrations, and Telegram notifications
through grammY.

## Services

- `producer`: HTTP API. Accepts notification events and publishes them to
  RabbitMQ with an idempotency UUID.
- `consumer`: RabbitMQ worker. Manually acknowledges messages, retries failures
  through a TTL retry queue, and sends Telegram notifications.
- `postgres`: stores event processing state.
- `rabbitmq`: broker with management UI.

## Environment

Copy `.env.example` to `.env` and adjust values.

Telegram delivery is enabled only when:

```bash
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_PROXY_URL=http://user:password@proxy-host:3128
```

When `TELEGRAM_ENABLED=false`, the consumer runs in dry-run mode and logs the
notification instead of calling Telegram.

## Run With Docker

```bash
bun install
docker compose up --build
```

Swagger is available at:

```text
http://localhost:35700/docs
```

RabbitMQ management UI:

```text
http://localhost:15672
```

## Send An Event

```bash
curl -X POST http://localhost:35700/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order.created",
    "telegramChatId": "-1001234567890",
    "message": "Order #42 was created",
    "payload": { "orderId": 42 }
  }'
```

You may pass `eventId` explicitly to make retries/idempotency deterministic.
If it is omitted, the API generates a UUID.

## Local Commands

```bash
bun run dev
bun run build
bun run prod
bun run lint
bun run format
bun test
bun run test:e2e
```

## Migrations

The application checks and runs pending PostgreSQL migrations on startup when
`DATABASE_ENABLED=true`.

```bash
bun run migration:show
bun run migration:run
bun run migration:revert
bun run migration:create AddNewTable
```

New migrations live in `src/migrations` and use the `001-MigrationName.ts`
file naming format. Create tables and indexes through TypeORM migration APIs
such as `Table` and `TableIndex`, then register the class in
`src/migrations/index.ts`.
