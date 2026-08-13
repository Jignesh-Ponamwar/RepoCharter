import { createInterface } from 'node:readline/promises';
import { applyFoundationPlan, checkFoundation, planFoundationInitialization } from './foundation.js';
import { CliError } from './errors.js';
import { resolveTargetDirectory } from './filesystem/paths.js';
import { inspectRepository } from './inspection/index.js';
import { createPlanningHandoff } from './session/handoff.js';
import { createSessionManifest, readSessionManifest, setDriftAnchor, writeSessionManifest } from './session/manifest.js';
import { AGENT_REGISTRY, findAgent, selectAgents } from './session/agents.js';
import { inspectionSnapshot, refreshSessionSnapshot } from './session/snapshot.js';
import { validateRepositorySetup } from './validation/index.js';
import { createDriftAnchor, currentGitRevision, driftReport } from './drift/index.js';
import { runWorkflow } from './workflow.js';

const COMMANDS = new Set(['init', 'check', 'resume', 'drift-check', 'drift-acknowledge']);
const AGENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const HELP = `Usage: repo-charter <command> [path] [options]

Commands:
  init [path]              Inspect a repository and create or reuse a setup session.
  check [path]             Validate local state and inspect without writing.
  resume [path]            Reinspect and resume an incomplete setup session.
  drift-check [path]       Read-only planning-context drift report.
  drift-acknowledge [path] Record a new safe anchor after developer review.
  workflow <operation> ... Skill workflow preview or approved application.

Options:
  --dry-run                Preview init changes without writing.
  --primary-agent <agent>  Primary agent; prompted for a new interactive session.
  --agents <agent,...>     Optional secondary agents for a new setup session.
  --json                   Print structured output.
  --non-interactive        Require all future interactive decisions to be supplied.
  -h, --help               Show this help.

RepoCharter provides safe inspection/session state, planning handoff, document
preview/application through the skill workflow contract, validation, and read-only
context-drift checks. Agent behavior compatibility remains unverified.`;

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
  if (command === 'workflow') {
    const [operation, target = '.', specificationPath, approvalsPath, ...flags] = remaining;
    if (!['preview', 'apply'].includes(operation) || !specificationPath || (operation === 'apply' && !approvalsPath) || flags.some((flag) => flag !== '--json')) {
      throw new CliError('Usage: repo-charter workflow <preview|apply> <path> <approved-spec.json> [approvals.json] [--json]', 2);
    }
    return { command, target, operation, specificationPath, approvalsPath, json: flags.includes('--json') };
  }
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

function sameSelection(left, right) {
  return left.primary === right.primary
    && left.secondary.length === right.secondary.length
    && left.secondary.every((agent, index) => agent === right.secondary[index]);
}

function sessionWarnings(selectedAgents) {
  return [selectedAgents.primary, ...selectedAgents.secondary]
    .map((agentId) => findAgent(agentId))
    .filter((agent) => agent.compatibility !== 'verified')
    .map((agent) => `${agent.displayName} compatibility is ${agent.compatibility}; no support claim is made.`);
}

async function sessionForInit(options, targetPath, inspection) {
  const existing = await readSessionManifest(targetPath);
  if (!existing) {
    if (!options.primaryAgent) {
      throw new CliError('A new setup session requires --primary-agent <agent> when input is non-interactive.', 2);
    }
    let selectedAgents;
    try {
      selectedAgents = selectAgents(options.primaryAgent, options.agents);
    } catch (error) {
      throw new CliError(error.message, 2);
    }
    return {
      manifest: createSessionManifest(selectedAgents, inspectionSnapshot(inspection)),
      change: 'create',
      changedPaths: [],
    };
  }

  if (options.primaryAgent) {
    let requestedSelection;
    try {
      requestedSelection = selectAgents(options.primaryAgent, options.agents);
    } catch (error) {
      throw new CliError(error.message, 2);
    }
    if (!sameSelection(requestedSelection, existing.selectedAgents)) {
      throw new CliError('Requested agents do not match the existing setup session. Use resume or the persisted selection.', 2);
    }
  }

  const refreshed = refreshSessionSnapshot(existing, inspectionSnapshot(inspection));
  return {
    manifest: refreshed.manifest,
    change: refreshed.changed ? 'update' : 'unchanged',
    changedPaths: refreshed.changedPaths,
  };
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

  if (options.command === 'workflow') {
    const output = await runWorkflow(targetPath, options.operation, options.specificationPath, options.approvalsPath);
    return { exitCode: 0, output };
  }

  const inspection = await inspectRepository(targetPath);

  if (options.command === 'drift-acknowledge') {
    let session;
    try {
      session = await readSessionManifest(targetPath);
    } catch (error) {
      throw new CliError(error.message, 1);
    }
    if (!session?.driftAnchor) {
      throw new CliError('No drift anchor exists to acknowledge. Apply an approved setup first.', 1);
    }
    const anchor = await createDriftAnchor(
      targetPath,
      inspection.snapshot,
      'developer-acknowledged-drift',
      await currentGitRevision(targetPath),
    );
    await writeSessionManifest(targetPath, setDriftAnchor(session, anchor));
    return { exitCode: 0, output: { type: 'drift-acknowledge', target: targetPath, anchor } };
  }

  if (options.command === 'drift-check') {
    let session;
    try {
      session = await readSessionManifest(targetPath);
    } catch (error) {
      throw new CliError(error.message, 1);
    }
    const report = await driftReport(targetPath, inspection, session?.driftAnchor);
    return { exitCode: report.status === 'in-sync' || report.status === 'drift-detected' ? 0 : 1, output: { type: 'drift-check', target: targetPath, report } };
  }

  if (options.command === 'check') {
    const foundation = await checkFoundation(targetPath);
    const diagnostics = [...foundation.diagnostics];
    let session;
    try {
      session = await readSessionManifest(targetPath);
    } catch (error) {
      diagnostics.push({ severity: 'error', message: error.message });
    }
    const validation = await validateRepositorySetup(targetPath, inspection, session);
    diagnostics.push(...validation.diagnostics);
    const valid = foundation.valid && !diagnostics.some((diagnostic) => diagnostic.severity === 'error');
    return {
      exitCode: valid ? 0 : 1,
      output: { type: 'check', target: targetPath, diagnostics, inspection, session, report: validation.report },
    };
  }

  if (options.command === 'resume') {
    let manifest;
    try {
      manifest = await readSessionManifest(targetPath);
    } catch (error) {
      throw new CliError(error.message, 1);
    }
    if (!manifest) {
      throw new CliError('No resumable setup session exists. Run init with --primary-agent first.', 1);
    }

    const refreshed = refreshSessionSnapshot(manifest, inspectionSnapshot(inspection));
    if (refreshed.changed) {
      await writeSessionManifest(targetPath, refreshed.manifest);
    }
    return {
      exitCode: 0,
      output: {
        type: 'resume',
        target: targetPath,
        inspection,
        session: refreshed.manifest,
        changedPaths: refreshed.changedPaths,
        handoff: createPlanningHandoff(refreshed.manifest, inspection),
        warnings: sessionWarnings(refreshed.manifest.selectedAgents),
      },
    };
  }

  if (options.nonInteractive) {
    throw new CliError('--non-interactive cannot create a session until every planning decision can be supplied in a later phase.', 2);
  }

  const plan = await planFoundationInitialization(targetPath);
  if (plan.conflicts.length > 0) {
    throw new CliError(`Initialization blocked: ${plan.conflicts[0].path}: ${plan.conflicts[0].reason}`, 1);
  }

  let session;
  try {
    session = await sessionForInit(options, targetPath, inspection);
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError(error.message, 1);
  }

  if (!options.dryRun) {
    await applyFoundationPlan(targetPath, plan);
    if (session.change !== 'unchanged') {
      await writeSessionManifest(targetPath, session.manifest);
    }
  }

  const changes = [
    ...plan.changes.map(({ path, status }) => ({ path, status })),
    { path: '.repo-charter/manifest.json', status: session.change },
  ];
  return {
    exitCode: 0,
    output: {
      type: 'init',
      target: targetPath,
      dryRun: options.dryRun,
      changes,
      inspection,
      session: session.manifest,
      changedPaths: session.changedPaths,
      handoff: createPlanningHandoff(session.manifest, inspection),
      warnings: sessionWarnings(session.manifest.selectedAgents),
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

  if (output.session) {
    lines.push(`Session stage: ${output.session.stage}`);
    lines.push(`Primary agent: ${output.session.selectedAgents.primary}`);
    if (output.changedPaths?.length > 0) {
      lines.push(`Reinspected changed paths: ${output.changedPaths.join(', ')}`);
    }
  }

  if (output.inspection) {
    const values = (fact) => output.inspection.evidence
      .filter((item) => item.fact === fact && item.classification === 'observed')
      .map((item) => item.value)
      .filter((value, index, list) => list.indexOf(value) === index);
    const languages = values('language');
    const frameworks = values('framework');
    lines.push(`Inspection: ${output.inspection.evidence.length} evidence records; ${output.inspection.skipped.length} skipped paths.`);
    if (languages.length > 0) lines.push(`Languages: ${languages.join(', ')}`);
    if (frameworks.length > 0) lines.push(`Frameworks: ${frameworks.join(', ')}`);
    for (const command of output.inspection.commands) {
      lines.push(`Candidate ${command.kind}: ${command.command}`);
    }
  }

  if (output.type === 'drift-acknowledge') {
    lines.push('Drift anchor acknowledged and refreshed.');
  }

  if (output.type === 'drift-check') {
    lines.push(`Drift status: ${output.report.status}`);
    for (const item of output.report.classifications) lines.push(`${item.classification}: ${item.path}`);
  }

  if (output.report && output.type !== 'drift-check') {
    lines.push('Final change report:');
    for (const artifact of output.report.artifacts) lines.push(`${artifact.status}: ${artifact.path}`);
    for (const blocker of output.report.blockers) lines.push(`blocker: ${blocker}`);
    if (output.report.nextTask) lines.push(`Next approved task: ${output.report.nextTask}`);
  }

  if (output.handoff) {
    lines.push('', 'Planning handoff:', output.handoff.trimEnd());
  }

  return lines.join('\n');
}

function canPromptForPrimaryAgent(argumentsList, io) {
  return argumentsList[0] === 'init'
    && !argumentsList.some((argument) => argument === '--primary-agent' || argument.startsWith('--primary-agent='))
    && !argumentsList.includes('--json')
    && !argumentsList.includes('--non-interactive')
    && io.stdin?.isTTY
    && io.stdout?.isTTY;
}

export async function promptForPrimaryAgent(io) {
  io.stdout.write('Select the primary coding agent:\n');
  for (const [index, agent] of AGENT_REGISTRY.entries()) {
    io.stdout.write(`${index + 1}. ${agent.displayName}\n`);
  }

  const prompt = createInterface({ input: io.stdin, output: io.stdout, terminal: false });
  try {
    while (true) {
      const answer = (await prompt.question(`Select [1-${AGENT_REGISTRY.length}]: `)).trim();
      const selected = AGENT_REGISTRY[Number(answer) - 1];
      if (selected) return selected.id;
      io.stdout.write(`Enter a number from 1 to ${AGENT_REGISTRY.length}.\n`);
    }
  } finally {
    prompt.close();
  }
}

export async function main(argumentsList, io = process) {
  const jsonRequested = argumentsList.includes('--json');

  try {
    let result;
    try {
      result = await run(argumentsList);
    } catch (error) {
      if (!(error instanceof CliError)
        || !error.message.startsWith('A new setup session requires --primary-agent')
        || !canPromptForPrimaryAgent(argumentsList, io)) {
        throw error;
      }
      const primaryAgent = await promptForPrimaryAgent(io);
      result = await run([...argumentsList, '--primary-agent', primaryAgent]);
    }
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
