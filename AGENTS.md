# AGENTS.md

These instructions apply to the whole repository.

## Project Overview

- This is a Bun-powered NestJS 11 application written in TypeScript and ESM (`"type": "module"`).
- Runtime entrypoint: `src/main.ts`.
- Root Nest module: `src/app.module.ts`.
- Public/page-level HTTP modules live under `src/pages`.
- Domain/shared application modules live under `src/modules`.
- Shared constants and utilities live under `src/consts` and `src/utils`.
- TypeScript path alias `@/*` points to `src/*`.
- Swagger is configured in `src/utils/swagger-setup.ts` and served at `/docs`.
- The current healthcheck/root endpoint is `GET /`.

## Package Manager And Runtime

- Use Bun for dependency, script, build, and test commands.
- Do not introduce npm, yarn, or pnpm lockfiles.
- Keep `bun.lock` as the source of dependency lock state.

Common commands:

```bash
bun install
bun run dev
bun run start
bun run build
bun run prod
bun run lint
bun run format
bun test
bun run test:e2e
bun run test:cov
```

Notes:

- `bun run lint` runs ESLint with `--fix`, so it may modify files.
- `bun run format` runs Prettier over `src/**/*.ts` and `test/**/*.ts`.
- Use the scripts in `package.json` as the source of truth if README or Docker examples drift.

## Environment And Deployment

- The app expects `PORT` to be set; see `.env.example`.
- `NODE_ENV` is set by the package scripts for development and production flows.
- `docker-compose.yml` defaults `PORT` to `35700` when it is not provided.
- The Docker release image is intended to run the built app from `dist`.

## Code Style

- Follow the existing Prettier config:
  - single quotes
  - trailing commas
- Keep TypeScript strict-compatible.
- Prefer explicit, typed NestJS APIs and type-only imports for TypeScript-only symbols.
- Prefer the existing `@/*` alias for imports that cross feature boundaries.
- Keep comments sparse and useful; avoid comments that restate the code.
- Do not commit generated build output or dependency directories unless explicitly requested.

## NestJS Architecture

- Organize features by Nest module, not by technical layer.
- Keep controllers thin. Put business logic in injectable services.
- Use constructor injection for dependencies.
- Avoid circular module dependencies. If sharing is needed, export providers from the owning module and import that module where required.
- Keep module ownership clear:
  - add user-facing/page-style routes under `src/pages/<feature>`
  - add reusable/domain modules under `src/modules/<feature>`
- Prefer focused services over broad "god services".
- Use NestJS HTTP exceptions instead of returning ad hoc error objects.
- Validate and transform external input with DTOs and pipes when adding request bodies, params, or query parameters.
- Add guards/interceptors/filters for cross-cutting concerns instead of duplicating logic in controllers.
- Use the detailed rule files in `.agents/rules` for larger NestJS changes.

## Testing Guidance

- Use Bun's test runner (`bun test`) for tests.
- E2E tests live under `test` and use `@nestjs/testing` with `supertest`.
- For new controllers or behavior changes, add or update focused tests near the existing testing pattern.
- For changes that affect startup, routing, Swagger, environment handling, or module wiring, run at least:

```bash
bun run build
bun run test:e2e
```

- For narrow service-only changes, run the smallest relevant test command and mention any broader tests not run.

## Before Finishing

- Check `git status --short` and keep unrelated user changes intact.
- Run formatting/linting/tests that match the change risk.
- If a command fails because existing project state is inconsistent, report the exact command and failure instead of hiding it.
- Keep edits scoped to the requested task and avoid opportunistic refactors.

