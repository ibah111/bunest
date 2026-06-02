import { postgresDataSource } from '../src/modules/databases/postgres.data-source';

await postgresDataSource.initialize();

try {
  const hasPendingMigrations = await postgresDataSource.showMigrations();
  console.log(
    hasPendingMigrations
      ? 'There are pending migrations.'
      : 'Migrations are up to date.',
  );
} finally {
  await postgresDataSource.destroy();
}
