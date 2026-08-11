import { applyFoundationPlan, checkFoundation, planFoundationInitialization } from './foundation.js';
import { CliError } from './errors.js';
import { resolveTargetDirectory } from './filesystem/paths.js';

const COMMANDS = new Set(['init', 'check', 'resume']);
const AGENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const HELP = `Usage: repo-charter <command> [path] [options]

Commands:
  init [path]              Initialize the Phase 1 foundation safely.
  check [path]             Validate foundation ownership state without writing.
  resume [path]            Report resumable setup state (available from Phase 3).

Options:
  --dry-run                Preview init changes without writing.
  --primary-agent <agent>  Record a requested primary-agent value for a future session.
  --agents <agent,...>     Record requested secondary-agent values for a future session.
  --json                   Print structured output.
  --non-interactive        Require all future interactive decisions to be supplied.
  -h, --help               Show this help.

Phase 1 only creates and validates .repo-charter/ownership.json. It does not inspect
the repository, select agents, create a session, or generate project documents.`;

function parseAgentId(value, optionName) {
  if (!AGENT_ID_PATTERN.test(value)) {
    throw new CliError(`${optionName} must be a lowercase agent identifier such as codex.`, 2);
  }
  return value;
}

function parseAgentList(value) {
  const agents = value.split(',');
  if (agents.length === 0 || agents.some((agent) => agent.length === 0)) {
    throw new CliError('--agents must be a comma-separated list without empty values.', 2);
  }

  const normalized = agents.map((agent) => parseAgentId(agent, '--agents'));
  if (new Set(normalized).size !== normalized.length) {
    throw new CliError('--agents must not contain duplicates.', 2);
  }

  return normalized;
}

function optionValue(argumentsList, index, optionName) {
  const value = argumentsList[index + 1];
  if (!value || value.startsWith('-')) {
    throw new CliError(`${optionName} requires a value.`, 2);
  }
  return value;
}

export function parseArguments(argumentsList) {
  if (argumentsList.length === 0 || argumentsList.includes('--help') || argumentsList.includes('-h')) {
    return { help: true };
  }

  const [command, ...remaining] = argumentsList;
  if (!COMMANDS.has(command)) {
    throw new CliError(`Unknown command: ${command}. Run with --help for usage.`, 2);
  }

  const options = {
    command,
    target: '.',
    dryRun: false,
    json: false,
    nonInteractive: false,
    primaryAgent: undefined,
    agents: [],
  };
  let targetProvided = false;

  for (let index = 0; index < remaining.length; index += 1) {
    const argument = remaining[index];

    if (argument === '--dry-run') {
      options.dryRun = true;
    } else if (argument === '--json') {
      options.json = true;
    } else if (argument === '--non-interactive') {
      options.nonInteractive = true;
    } else if (argument === '--primary-agent') {
      if (options.primaryAgent) {
        throw new CliError('--primary-agent may only be provided once.', 2);
      }
      options.primaryAgent = parseAgentId(optionValue(remaining, index, argument), argument);
      index += 1;
    } else if (argument.startsWith('--primary-agent=')) {
      if (options.primaryAgent) {
        throw new CliError('--primary-agent may only be provided once.', 2);
      }
      options.primaryAgent = parseAgentId(argument.slice('--primary-agent='.length), '--primary-agent');
    } else if (argument === '--agents') {
      if (options.agents.length > 0) {
        throw new CliError('--agents may only be provided once.', 2);
      }
      options.agents = parseAgentList(optionValue(remaining, index, argument));
      index += 1;
    } else if (argument.startsWith('--agents=')) {
      if (options.agents.length > 0) {
        throw new CliError('--agents may only be provided once.', 2);
      }
      options.agents = parseAgentList(argument.slice('--agents='.length));
    } else if (argument.startsWith('-')) {
      throw new CliError(`Unknown option: ${argument}. Run with --help for usage.`, 2);
    } else if (targetProvided) {
      throw new CliError('Only one target directory may be provided.', 2);
    } else {
      options.target = argument;
      targetProvided = true;
    }
  }

  if (options.command !== 'init' && options.dryRun) {
    throw new CliError('--dry-run is only valid with init.', 2);
  }

  if (options.command !== 'init' && (options.primaryAgent || options.agents.length > 0 || options.nonInteractive)) {
    throw new CliError('--primary-agent, --agents, and --non-interactive are only valid with init.', 2);
  }

  if (options.agents.length > 0 && !options.primaryAgent) {
    throw new CliError('--agents requires --primary-agent.', 2);
  }

  if (options.primaryAgent && options.agents.includes(options.primaryAgent)) {
    throw new CliError('--agents must not include the primary agent.', 2);
  }

  return options;
}

function foundationWarnings(options) {
  if (!options.primaryAgent) {
    return [];
  }

  return ['Agent selections are parsed but are not persisted until the Phase 3 session implementation.'];
}

export async function run(argumentsList, cwd = process.cwd()) {
  const options = parseArguments(argumentsList);
  if (options.help) {
    return { exitCode: 0, output: { type: 'help', text: HELP } };
  }

  let targetPath;
  try {
    targetPath = await resolveTargetDirectory(options.target, cwd);
  } catch (error) {
    throw new CliError(error.message, 1);
  }

  if (options.command === 'resume') {
    throw new CliError('No resumable setup session exists. Session support begins in Phase 3.', 1);
  }

  if (options.command === 'check') {
    const result = await checkFoundation(targetPath);
    return {
      exitCode: result.valid ? 0 : 1,
      output: {
        type: 'check',
        target: targetPath,
        diagnostics: result.diagnostics,
      },
    };
  }

  const plan = await planFoundationInitialization(targetPath);
  if (plan.conflicts.length > 0) {
    throw new CliError(`Initialization blocked: ${plan.conflicts[0].path}: ${plan.conflicts[0].reason}`, 1);
  }

  if (!options.dryRun) {
    await applyFoundationPlan(targetPath, plan);
  }

  return {
    exitCode: 0,
    output: {
      type: 'init',
      target: targetPath,
      dryRun: options.dryRun,
      changes: plan.changes.map(({ path, status }) => ({ path, status })),
      warnings: foundationWarnings(options),
    },
  };
}

function humanOutput(output) {
  if (output.type === 'help') {
    return output.text;
  }

  const lines = [`repo-charter ${output.type}`, `Target: ${output.target}`];
  if (output.dryRun) {
    lines.push('Dry run: no files were written.');
  }

  if (output.changes) {
    for (const change of output.changes) {
      lines.push(`${change.status}: ${change.path}`);
    }
  }

  for (const diagnostic of output.diagnostics ?? []) {
    lines.push(`${diagnostic.severity}: ${diagnostic.message}`);
  }

  for (const warning of output.warnings ?? []) {
    lines.push(`warning: ${warning}`);
  }

  return lines.join('\n');
}

export async function main(argumentsList, io = process) {
  const jsonRequested = argumentsList.includes('--json');

  try {
    const result = await run(argumentsList);
    io.stdout.write(`${result.output.type === 'help' || jsonRequested
      ? (jsonRequested ? JSON.stringify(result.output) : humanOutput(result.output))
      : humanOutput(result.output)}\n`);
    io.exitCode = result.exitCode;
    return result;
  } catch (error) {
    const cliError = error instanceof CliError ? error : new CliError(error.message, 1);
    const output = { error: cliError.message };
    (jsonRequested ? io.stdout : io.stderr).write(`${jsonRequested ? JSON.stringify(output) : cliError.message}\n`);
    io.exitCode = cliError.exitCode;
    return { exitCode: cliError.exitCode, output };
  }
}
