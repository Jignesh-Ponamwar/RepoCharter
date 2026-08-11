import { findAgent } from '../session/agents.js';
import { expectedInstructionPaths, planSelectedAgentOutputs, selectedAgentIds } from './planning.js';

const OPTIONAL_RULE_PREFIXES = ['.claude/rules/', '.cursor/rules/', '.windsurf/rules/'];

export function diagnoseAdapterCompatibility(selectedAgents, files = {}) {
  const paths = new Set(Object.keys(files));
  const diagnostics = [];
  let status = 'unverified';
  const expected = expectedInstructionPaths(selectedAgents);
  const plan = planSelectedAgentOutputs(selectedAgents);

  for (const agentId of selectedAgentIds(selectedAgents)) {
    const agent = findAgent(agentId);
    if (!agent) {
      diagnostics.push({ severity: 'error', status: 'unsupported', agentId, message: 'Selected agent is not in the registry.' });
      status = 'unsupported';
      continue;
    }
    if (!paths.has('AGENTS.md')) {
      diagnostics.push({ severity: 'error', status: 'degraded', agentId, message: 'Canonical AGENTS.md is missing.' });
      status = 'degraded';
      continue;
    }
    const expectedPath = expected.get(agentId);
    if (!paths.has(expectedPath)) {
      diagnostics.push({ severity: 'error', status: 'degraded', agentId, message: `Expected native entry point is missing: ${expectedPath}.` });
      status = 'degraded';
      continue;
    }
    const adapter = plan.artifacts.find((artifact) => artifact.agentId === agentId);
    if (adapter && files[adapter.path] !== adapter.content) {
      diagnostics.push({ severity: 'warning', status: 'stale', agentId, message: `Native adapter differs from template version ${adapter.templateVersion}: ${adapter.path}.` });
      if (status === 'unverified') status = 'stale';
      continue;
    }
    diagnostics.push({
      severity: 'warning',
      status: 'unverified',
      agentId,
      message: `${agent.displayName} entry point is documented but has no recorded behavior evaluation.`,
    });
  }

  for (const prefix of OPTIONAL_RULE_PREFIXES) {
    for (const path of paths) {
      if (path.startsWith(prefix)) {
        diagnostics.push({ severity: 'warning', status: 'unnecessary', path, message: 'Optional rule directory is present without a confirmed scoped-rule requirement.' });
      }
    }
  }

  for (const adapter of planSelectedAgentOutputs({ primary: 'claude-code', secondary: ['github-copilot', 'gemini-cli'] }).artifacts) {
    if (!plan.artifacts.some((expectedAdapter) => expectedAdapter.path === adapter.path) && paths.has(adapter.path)) {
      diagnostics.push({ severity: 'warning', status: 'unexpected', path: adapter.path, message: 'Native adapter exists for an unselected agent.' });
    }
  }

  return { status, diagnostics };
}
