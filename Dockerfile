FROM oven/bun:alpine AS base
WORKDIR /usr/src/app
COPY package.json bun.lock ./

FROM base AS dev_deps
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=dev_deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS release
COPY .env .env
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/src ./src
COPY --from=build /usr/src/app/tsconfig.json ./tsconfig.json
# RUN bun install swagger-ui-dist --no-save
EXPOSE ${PORT}
CMD ["bun", "start:prod"]
