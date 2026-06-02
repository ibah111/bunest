const rawName = Bun.argv[2];

if (!rawName) {
  console.error('Usage: bun run migration:create <MigrationName>');
  process.exit(1);
}

const migrationName = toPascalCase(rawName);
const sequence = await getNextMigrationSequence();
const timestamp = Date.now();
const className = `${migrationName}${timestamp}`;
const filePath = `src/migrations/${sequence}-${migrationName}.ts`;

await Bun.write(
  filePath,
  `import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table } from 'typeorm';

export class ${className} implements MigrationInterface {
  name = '${className}';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'replace_me',
        columns: [],
      }),
      true,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('replace_me', true);
  }
}
`,
);

console.log(`Created ${filePath}`);
console.log('Add the class to src/migrations/index.ts before running it.');

async function getNextMigrationSequence(): Promise<string> {
  const migrationsDirectory = 'src/migrations';
  const entries = await Array.fromAsync(
    new Bun.Glob('*.ts').scan(migrationsDirectory),
  );
  const lastSequence = entries.reduce((max, entry) => {
    const match = /^(\d{3})-/.exec(entry);
    if (!match) {
      return max;
    }

    return Math.max(max, Number.parseInt(match[1], 10));
  }, 0);

  return String(lastSequence + 1).padStart(3, '0');
}

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
