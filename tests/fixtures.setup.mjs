// Before the browser checks: builds the local-only fixture sites of tests/scaling.spec.mjs, the real
// site plus fake apps until there are 4, 6 and 8 (scripts/fixture.mjs), in a temporary folder that
// is never published and is removed after the run. The tests find it in TUTOSAPP_FIXTURES.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const SIZES = [4, 6, 8];

export default function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'tutosapp-fixtures-'));
  for (const n of SIZES) execFileSync(process.execPath, ['scripts/fixture.mjs', String(n), join(dir, `n${n}`)], { stdio: 'pipe' });
  process.env.TUTOSAPP_FIXTURES = dir;
  return () => rmSync(dir, { recursive: true, force: true });
}
