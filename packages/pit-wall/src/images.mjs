// Agent images: one Dockerfile per agent under docker/agent-<agent>/, built locally.
// Tags: pitwall/agent-<agent>:<agent version> and :latest. The version is read back
// from the built image, so the tag always says what is inside.

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCKER_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../docker');

const AGENTS = {
  'claude-code': { buildArg: 'CLAUDE_CODE_VERSION', versionCmd: ['claude', '--version'] },
};

export const imageName = (agent) => `pitwall/agent-${agent}`;

function docker(args, opts = {}) {
  const r = spawnSync('docker', args, { encoding: 'utf8', maxBuffer: 64 << 20, ...opts });
  if (r.error) throw new Error(`docker is not available: ${r.error.message}`);
  return r;
}

export function buildImage(agent, { version = 'latest' } = {}) {
  const spec = AGENTS[agent];
  const context = join(DOCKER_DIR, `agent-${agent}`);
  if (!spec || !existsSync(context)) throw new Error(`no agent image definition for ${agent} (known: ${Object.keys(AGENTS).join(', ')})`);
  const name = imageName(agent);
  const b = docker(['build', '--build-arg', `${spec.buildArg}=${version}`, '-t', `${name}:latest`, context], { stdio: 'inherit' });
  if (b.status !== 0) throw new Error(`docker build failed for ${agent}`);
  const v = docker(['run', '--rm', `${name}:latest`, ...spec.versionCmd]);
  const actual = (v.stdout.match(/\d+\.\d+\.\d+/) ?? [null])[0];
  if (!actual) throw new Error(`could not read the ${agent} version from the image: ${v.stderr}`);
  docker(['tag', `${name}:latest`, `${name}:${actual}`]);
  return { image: `${name}:${actual}`, version: actual };
}

// The image a run will use: an explicit tag, else :latest. Fails with the build
// command when it is missing, instead of silently installing per trial.
export function resolveImage(agent, tag = process.env.PITWALL_AGENT_IMAGE_TAG ?? 'latest') {
  const ref = `${imageName(agent)}:${tag}`;
  const r = docker(['image', 'inspect', '--format', '{{.Id}}', ref]);
  if (r.status !== 0) throw new Error(`agent image ${ref} not found. Build it with: pit-wall image build ${agent}${tag === 'latest' ? '' : ` --version ${tag}`}`);
  return { ref, id: r.stdout.trim() };
}
