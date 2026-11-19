// Fixed fixtures for the kit's own tests (test/fixtures/kit/<name>): what a test of the MACHINERY builds on.
//
// Why: three times (2026-11-15/16) a scene's author changed a real fixture (kit/fixtures/…) — an incident script
// moved, a `passing` list arrived, an image line was added — and tests that had copied the real fixture and pinned
// its shape ("one incident", "controls are null / reference / incident", "this scene has a script") failed, although
// nothing they test had changed. So:
//   - a test of the machinery (cases, controls, named checks, the gate script) reads a TEMPLATE here, or a copy of
//     one with its own edits. A template changes only together with the tests that read it.
//   - a test that reads a REAL fixture asserts only what every fixture must satisfy (it loads in today's format,
//     its controls are graded as built, …) and pins no count, no scene id, no control name.
// test/kit-real-fixtures.test.mjs guards the second half: it fails when a kit test reads kit/fixtures by name
// outside the short list of generic loops.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { harborCases } from '../src/kit/harbor-cases.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
// the templates, as a path relative to the repository root (the gate script takes fixture paths that way) and absolute
export const TEMPLATES_REL = 'packages/pit-wall/test/fixtures/kit';
export const TEMPLATES = join(ROOT, TEMPLATES_REL);
export const templateRel = (name) => `${TEMPLATES_REL}/${name}`;
export const templateDir = (name) => join(TEMPLATES, name);
export const specPath = (role) => join(ROOT, 'kit/roles', `${role}.yaml`);
export const templateYaml = (name) => YAML.parse(readFileSync(join(TEMPLATES, name, 'fixture.yaml'), 'utf8'));
// the Harbor cases of a template (the role spec is the real one: the templates are fixtures, not specs)
export const loadTemplate = (name, role = 'dev') => harborCases(specPath(role), templateDir(name));

// A copy of a template under a temporary directory (same directory name, so case ids are the same), with
// `edit(fx)` applied to its yaml. Returns { dir, fx }. Call `cleanup()` (e.g. in test.after) to remove the copies.
const made = [];
export function copyTemplate(name, edit = () => {}) {
  const base = mkdtempSync(join(tmpdir(), 'kit-tpl-'));
  made.push(base);
  const dir = join(base, name);
  cpSync(templateDir(name), dir, { recursive: true });
  const fx = YAML.parse(readFileSync(join(dir, 'fixture.yaml'), 'utf8'));
  edit(fx);
  writeFileSync(join(dir, 'fixture.yaml'), YAML.stringify(fx));
  return { dir, fx };
}
export const cleanup = () => { for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true }); };
