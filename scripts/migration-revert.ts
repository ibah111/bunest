import { postgresDataSource } from '../src/modules/databases/postgres.data-source';

await postgresDataSource.initialize();

try {
  await postgresDataSource.undoLastMigration({
    transaction: 'each',
  });
  console.log('Reverted last migration.');
} finally {
  await postgresDataSource.destroy();
}
