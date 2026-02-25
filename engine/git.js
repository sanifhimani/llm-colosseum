import { resolve } from 'path';
import { existsSync } from 'fs';

let pushing = false;

function enabled() {
  return process.env.GIT_AUTO_PUSH === 'true';
}

async function git(args, cwd) {
  const proc = Bun.spawn(['git', ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`git ${args.join(' ')} failed (${exitCode}): ${stderr.trim()}`);
  }

  return stdout.trim();
}

async function hasStagedChanges(cwd) {
  const proc = Bun.spawn(['git', 'diff', '--cached', '--quiet'], {
    cwd,
    stdout: 'ignore',
    stderr: 'ignore',
  });
  return (await proc.exited) !== 0;
}

export async function initGit(repoRoot) {
  if (!enabled()) {
    console.log('[git] auto-push disabled');
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;

  if (!token || !repo) {
    console.error('[git] GITHUB_TOKEN or GITHUB_REPO not set, disabling auto-push');
    return;
  }

  try {
    if (!existsSync(resolve(repoRoot, '.git'))) {
      await git(['init'], repoRoot);
      console.log('[git] initialized repo');
    }

    const remoteUrl = `https://github.com/${repo}.git`;
    const authHeader = `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`;

    const remotes = await git(['remote'], repoRoot);
    if (remotes.includes('origin')) {
      await git(['remote', 'set-url', 'origin', remoteUrl], repoRoot);
    } else {
      await git(['remote', 'add', 'origin', remoteUrl], repoRoot);
    }

    await git(['config', 'http.extraheader', authHeader], repoRoot);

    await git(['fetch', 'origin', 'main'], repoRoot);
    await git(['reset', '--mixed', 'origin/main'], repoRoot);

    await git(['config', 'user.email', 'engine@llm-colosseum.dev'], repoRoot);
    await git(['config', 'user.name', 'LLM Colosseum Engine'], repoRoot);

    console.log('[git] initialized and synced with origin/main');
  } catch (err) {
    console.error('[git] init error:', err.message);
  }
}

export async function commitAndPush(repoRoot, message) {
  if (!enabled()) return;
  if (pushing) {
    console.log('[git] push already in progress, skipping');
    return;
  }

  pushing = true;

  try {
    await git(['add', 'data/'], repoRoot);

    if (!(await hasStagedChanges(repoRoot))) {
      console.log('[git] no changes to commit');
      return;
    }

    await git(['commit', '-m', message], repoRoot);
    await git(['pull', '--rebase', 'origin', 'main'], repoRoot);
    await git(['push', 'origin', 'main'], repoRoot);

    console.log(`[git] pushed: ${message}`);
  } catch (err) {
    console.error('[git] commit/push error:', err.message);
  } finally {
    pushing = false;
  }
}
