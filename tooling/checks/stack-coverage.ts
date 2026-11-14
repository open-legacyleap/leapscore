/**
 * tooling/checks/stack-coverage.ts — the committed stack manifest must match
 * its inputs (stack-coverage-surface design D1/D8).
 *
 * Regenerates `apps/site/lib/generated/stacks.ts` into memory and requires byte
 * equality with the committed copy. The inputs are the vendored datasets, the
 * scanner's recognition tables, the identity framework signatures, and the
 * scanner package version; a dataset refresh or a table edit without a
 * regeneration fails here, naming the drifted field.
 *
 *   npm run check:stack-coverage
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  buildStackManifest,
  buildStackManifestData,
} from '../../apps/site/scripts/build-stack-manifest';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const COMMITTED = join(ROOT, 'apps/site/lib/generated/stacks.ts');

function quote(value: unknown): string {
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

/** The first property path that differs, so the failure names a field, not a diff. */
function firstDifference(
  committed: unknown,
  generated: unknown,
  path = 'manifest',
): string | null {
  if (Object.is(committed, generated)) return null;

  if (
    typeof committed !== 'object' ||
    committed === null ||
    typeof generated !== 'object' ||
    generated === null
  ) {
    return `${path}: committed ${quote(committed)} ≠ generated ${quote(generated)}`;
  }

  if (Array.isArray(committed) !== Array.isArray(generated)) {
    return `${path}: committed ${Array.isArray(committed) ? 'array' : 'object'} ≠ generated ${Array.isArray(generated) ? 'array' : 'object'}`;
  }

  if (Array.isArray(committed) && Array.isArray(generated)) {
    if (committed.length !== generated.length) {
      return `${path}.length: committed ${committed.length} ≠ generated ${generated.length}`;
    }
    for (let index = 0; index < committed.length; index += 1) {
      const difference = firstDifference(
        committed[index],
        generated[index],
        `${path}[${index}]`,
      );
      if (difference) return difference;
    }
    return null;
  }

  const committedObject = committed as Record<string, unknown>;
  const generatedObject = generated as Record<string, unknown>;
  const keys = [
    ...new Set([...Object.keys(committedObject), ...Object.keys(generatedObject)]),
  ].sort();
  for (const key of keys) {
    if (!(key in committedObject)) return `${path}.${key}: missing in committed file`;
    if (!(key in generatedObject)) return `${path}.${key}: no longer generated`;
    const difference = firstDifference(
      committedObject[key],
      generatedObject[key],
      `${path}.${key}`,
    );
    if (difference) return difference;
  }
  return null;
}

async function main(): Promise<void> {
  if (!existsSync(COMMITTED)) {
    console.error(
      `stack-coverage: FAIL — ${relative(ROOT, COMMITTED)} is missing; run the site prebuild`,
    );
    process.exit(1);
  }

  const expected = buildStackManifest();
  const actual = readFileSync(COMMITTED, 'utf-8');

  if (actual === expected) {
    console.log(
      'stack-coverage: ok (the committed manifest matches a fresh generation)',
    );
    return;
  }

  const committedModule = (await import(pathToFileURL(COMMITTED).href)) as {
    STACK_MANIFEST?: unknown;
  };
  const field = firstDifference(
    committedModule.STACK_MANIFEST,
    buildStackManifestData(),
  );

  const actualLines = actual.split('\n');
  const expectedLines = expected.split('\n');
  const firstLine = actualLines.findIndex(
    (line, index) => line !== expectedLines[index],
  );
  const lineDetail =
    firstLine === -1
      ? 'the files differ in trailing content'
      : `first differing line ${firstLine + 1}: committed ${quote(actualLines[firstLine] ?? '<eof>')} ≠ generated ${quote(expectedLines[firstLine] ?? '<eof>')}`;

  console.error(
    `stack-coverage: FAIL — ${relative(ROOT, COMMITTED)} is stale.\n` +
      `  drifted field: ${field ?? 'formatting only (values match)'}\n` +
      `  ${lineDetail}\n` +
      '  run: npm run prebuild --workspace @leapscore/site',
  );
  process.exit(1);
}

void main();
