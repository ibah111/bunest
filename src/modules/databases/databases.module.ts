import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { readBooleanEnv } from '@/config/env.helpers';
import { DatabaseMigrationService } from './database-migration.service';
import { createPostgresDataSourceOptions } from './postgres.data-source';

const databaseEnabled = readBooleanEnv(process.env.DATABASE_ENABLED);

@Module({
  imports: databaseEnabled
    ? [
        TypeOrmModule.forRootAsync({
          useFactory: createPostgresDataSourceOptions,
        }),
      ]
    : [],
  providers: databaseEnabled ? [DatabaseMigrationService] : [],
  exports: databaseEnabled ? [TypeOrmModule] : [],
})
export class DatabasesModule {}
