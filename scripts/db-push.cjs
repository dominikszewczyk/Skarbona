const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const result = spawnSync('npm', ['run', 'db:push', '--workspace', '@skarbona/api'], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
