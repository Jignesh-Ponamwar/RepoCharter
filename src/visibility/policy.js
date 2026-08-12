import { isWorkspaceVisibility } from '../workspace-visibility.js';

const ADAPTER_PATHS = Object.freeze({
  'claude-code': 'CLAUDE.md',
  'github-copilot': '.github/copilot-instructions.md',
  'gemini-cli': 'GEMINI.md',
});

const RULE_PATHS = Object.freeze({
  'claude-code': '.claude/rules/',
  cursor: '.cursor/rules/',
  windsurf: '.windsurf/rules/',
});

const ALWAYS_PUBLIC = Object.freeze(['AGENTS.md']);
const ALWAYS_LOCAL = Object.freeze(['.repo-charter/']);

function selectedAgentIds(selectedAgents) {
  if (!selectedAgents?.primary || !Array.isArray(selectedAgents.secondary)) {
    throw new Error('Workspace visibility requires selected agents.');
  }
  return [selectedAgents.primary, ...selectedAgents.secondary];
}

export function getWorkspacePolicy(workspaceVisibility, selectedAgents) {
  if (!isWorkspaceVisibility(workspaceVisibility)) {
    throw new Error('Workspace visibility must be local-planning or shared-planning.');
  }

  const agents = selectedAgentIds(selectedAgents);
  const adapters = agents.flatMap((agent) => ADAPTER_PATHS[agent] ? [ADAPTER_PATHS[agent]] : []);
  const rules = agents.flatMap((agent) => RULE_PATHS[agent] ? [RULE_PATHS[agent]] : []);
  const workspaceArtifacts = ['PLAN.md', 'TODO.md', ...adapters, ...rules];
  const localArtifacts = workspaceVisibility === 'local-planning'
    ? [...ALWAYS_LOCAL, ...workspaceArtifacts]
    : [...ALWAYS_LOCAL];
  const publicArtifacts = workspaceVisibility === 'shared-planning'
    ? [...ALWAYS_PUBLIC, ...workspaceArtifacts]
    : [...ALWAYS_PUBLIC];

  return {
    workspaceVisibility,
    publicArtifacts,
    localArtifacts,
    adapterPaths: adapters,
    rulePaths: rules,
    workspaceArtifacts,
  };
}

export function artifactVisibility(policy, relativePath) {
  if (policy.publicArtifacts.includes(relativePath)) return 'public';
  if (policy.localArtifacts.includes(relativePath)) return 'local';
  return 'unmanaged';
}
