import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (!existsSync('.env')) {
  writeFileSync(
    '.env',
    readFileSync('.env.example', 'utf8').replace(
      'replace-with-a-random-secret-at-least-32-characters',
      randomBytes(32).toString('hex'),
    ),
  );
  console.log('.env lokal dibuat dengan secret acak.');
}
