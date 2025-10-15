import { execSync } from 'node:child_process';

require('dotenv').config({
  path: '.env.test',
  quiet: true
});

export default function setup() {
  const env = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL
  };

  execSync('pnpm db:generate', {
    stdio: 'inherit',
    env
  });

  execSync('pnpm db:migrate', {
    stdio: 'inherit',
    env
  });
}

