#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import process from 'node:process';

function run(command) {
  execSync(command, { stdio: 'inherit' });
}

function getOutput(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
  const params = argv.filter((arg) => !arg.startsWith('--'));
  return {
    version: params[0],
    skipPush: flags.has('--no-push'),
    skipChecks: flags.has('--skip-checks'),
  };
}

function readPackageVersion() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  return pkg.version;
}

function assertCleanTree() {
  const status = getOutput('git status --porcelain');
  if (status.length > 0) {
    throw new Error(
      'Working tree is not clean. Commit or stash changes before running release:prepare.'
    );
  }
}

function bumpVersionIfNeeded(targetVersion) {
  const current = readPackageVersion();
  if (current === targetVersion) {
    console.log(`package.json already at v${targetVersion}; skipping version bump.`);
    return;
  }
  run(`pnpm version ${targetVersion} --no-git-tag-version`);
}

function stageLockfiles() {
  run('git add package.json');
  if (existsSync('pnpm-lock.yaml')) run('git add pnpm-lock.yaml');
  if (existsSync('package-lock.json')) run('git add package-lock.json');
}

function tagExists(version) {
  try {
    getOutput(`git rev-parse v${version}`);
    return true;
  } catch {
    return false;
  }
}

function main() {
  const { version, skipPush, skipChecks } = parseArgs(process.argv.slice(2));
  if (!version) {
    throw new Error(
      'Missing version. Usage: pnpm release:prepare -- <version> [--no-push] [--skip-checks]'
    );
  }

  assertCleanTree();

  if (!skipChecks) {
    run('pnpm typecheck');
    run('pnpm test');
    run('pnpm build');
  }

  const current = readPackageVersion();
  const needsCommit = current !== version;

  bumpVersionIfNeeded(version);

  if (needsCommit) {
    stageLockfiles();
    run(`git commit -m "chore(release): v${version}"`);
  } else {
    console.log('No version bump commit needed.');
  }

  if (tagExists(version)) {
    console.log(`Tag v${version} already exists; skipping tag creation.`);
  } else {
    run(`git tag v${version}`);
  }

  if (!skipPush) {
    if (needsCommit) run('git push');
    run(`git push origin v${version}`);
  }

  console.log('');
  console.log(`Release prepared for v${version}.`);
  if (skipPush) {
    console.log('Tag and commit were created locally only (--no-push).');
  } else {
    console.log('Changes and tag pushed. npm publish workflow should trigger from tag.');
  }
}

try {
  main();
} catch (error) {
  console.error('');
  console.error('[release:prepare] failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
