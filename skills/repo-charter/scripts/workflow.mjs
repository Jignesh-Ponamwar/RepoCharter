import { spawnSync } from 'node:child_process';

const cli = process.env.REPO_CHARTER_CLI ?? 'repo-charter';
const cliArguments = process.env.REPO_CHARTER_CLI_ARGS?.split(' ').filter(Boolean) ?? [];
const result = spawnSync(cli, [...cliArguments, 'workflow', ...process.argv.slice(2), '--json'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

const missingCli = result.error?.code === 'ENOENT'
  || /(?:not recognized as an internal|command not found)/i.test(result.stderr);
if (missingCli) {
  process.stderr.write('RepoCharter CLI is required. Install it or explicitly run npx repo-charter@0.1.1; npx may download the package.\n');
  process.exitCode = 1;
} else {
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.status ?? 1;
}
