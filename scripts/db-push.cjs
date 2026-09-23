const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const databaseHost = process.env.DB_HOST || 'localhost';
const databaseHostWithPort = databaseHost.includes(':') ? databaseHost : `${databaseHost}:${process.env.DB_PORT || '5432'}`;
const configuredDatabaseUrl = `postgresql://${process.env.DB_USER || 'skarbona'}:${process.env.DB_PASSWORD || 'skarbona'}@${databaseHostWithPort}/${process.env.DB_NAME || 'skarbona'}?schema=${process.env.DB_SCHEMA || 'skarbona'}`;
if (process.env.DB_USER || process.env.DB_PASSWORD || process.env.DB_HOST || process.env.DB_NAME || process.env.DB_SCHEMA) process.env.DATABASE_URL = configuredDatabaseUrl;
else process.env.DATABASE_URL ||= configuredDatabaseUrl;

const result = spawnSync('npm', ['run', 'db:push', '--workspace', '@skarbona/api'], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
