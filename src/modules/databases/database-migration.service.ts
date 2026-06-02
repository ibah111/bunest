import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseMigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseMigrationService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    const hasPendingMigrations = await this.dataSource.showMigrations();
    if (!hasPendingMigrations) {
      this.logger.log('PostgreSQL migrations are up to date');
      return;
    }

    const migrations = await this.dataSource.runMigrations({
      transaction: 'each',
    });
    const names = migrations.map((migration) => migration.name).join(', ');
    this.logger.log(`Applied PostgreSQL migrations: ${names}`);
  }
}
