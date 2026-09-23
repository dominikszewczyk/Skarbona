const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

process.env.DATABASE_URL ||= `postgresql://${process.env.DB_USER || 'skarbona'}:${process.env.DB_PASSWORD || 'skarbona'}@${process.env.DB_HOST || 'localhost'}:5432/${process.env.DB_NAME || 'skarbona'}?schema=${process.env.DB_SCHEMA || 'skarbona'}`;

const result = spawnSync('npm', ['run', 'db:push', '--workspace', '@skarbona/api'], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
