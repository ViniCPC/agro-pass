import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DATABASE_URL =
  'postgresql://agro_pass_test:agro_pass_test@localhost:55432/agro_pass_test';
const backendRoot = fileURLToPath(new URL('..', import.meta.url));
const env = {
  ...process.env,
  DATABASE_URL: process.env.TEST_DATABASE_URL ?? TEST_DATABASE_URL,
};

function run(modulePath, args, nodeArgs = []) {
  const result = spawnSync(process.execPath, [...nodeArgs, modulePath, ...args], {
    cwd: backendRoot,
    env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('./node_modules/prisma/build/index.js', ['migrate', 'deploy']);
run('./node_modules/jest/bin/jest.js', [
  '--config',
  './test/jest-e2e.json',
  '--runInBand',
], ['--experimental-vm-modules']);
