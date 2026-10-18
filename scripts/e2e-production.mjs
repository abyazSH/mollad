import { spawn } from 'node:child_process';
const child = spawn(
  'npm',
  ['run', 'test:e2e', '--', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, E2E_PRODUCTION: '1' },
  },
);
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
