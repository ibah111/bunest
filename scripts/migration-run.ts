import { postgresDataSource } from '../src/modules/databases/postgres.data-source';

await postgresDataSource.initialize();

try {
  const migrations = await postgresDataSource.runMigrations({
    transaction: 'each',
  });

  if (migrations.length === 0) {
    console.log('No pending migrations.');
  } else {
    console.log(
      `Applied migrations: ${migrations
        .map((migration) => migration.name)
        .join(', ')}`,
    );
  }
} finally {
  await postgresDataSource.destroy();
}
