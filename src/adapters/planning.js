import { generateCanonicalDocuments } from '../generation/documents.js';
import { findAgent } from '../session/agents.js';
import { claudeAdapter, copilotAdapter, geminiAdapter, ADAPTER_TEMPLATE_VERSION } from './templates.js';
import { artifactVisibility, getWorkspacePolicy } from '../visibility/policy.js';

const ADAPTERS = Object.freeze({
  'claude-code': { path: 'CLAUDE.md', content: claudeAdapter },
  'github-copilot': { path: '.github/copilot-instructions.md', content: copilotAdapter },
  'gemini-cli': { path: 'GEMINI.md', content: geminiAdapter },
});

export function selectedAgentIds(selectedAgents) {
  return [selectedAgents.primary, ...selectedAgents.secondary];
}

export function planSelectedAgentOutputs(selectedAgents, workspaceVisibility = 'local-planning') {
  const agents = selectedAgentIds(selectedAgents);
  const policy = getWorkspacePolicy(workspaceVisibility, selectedAgents);
  const artifacts = [];
  for (const agentId of agents) {
    if (!findAgent(agentId)) throw new Error(`Unsupported selected agent: ${agentId}.`);
    const adapter = ADAPTERS[agentId];
    if (adapter) {
      artifacts.push({
        agentId,
        path: adapter.path,
        content: adapter.content(workspaceVisibility),
        templateVersion: ADAPTER_TEMPLATE_VERSION,
        kind: 'native-adapter',
        visibility: artifactVisibility(policy, adapter.path),
        workspaceVisibility,
        selectedAgents,
      });
    }
  }
  return {
    canonicalPath: 'AGENTS.md',
    artifacts,
    optionalRuleDirectories: [],
    policy,
  };
}

export function generateSelectedAgentDocuments(specification, inspection) {
  const selectedAgents = specification.selectedAgents;
  if (!selectedAgents) throw new Error('Selected agents are required to generate native adapters.');
  return [...generateCanonicalDocuments(specification, inspection), ...planSelectedAgentOutputs(selectedAgents, specification.workspaceVisibility).artifacts];
}

export function expectedInstructionPaths(selectedAgents) {
  const plan = planSelectedAgentOutputs(selectedAgents);
  const paths = new Map(selectedAgentIds(selectedAgents).map((agentId) => [agentId, plan.canonicalPath]));
  for (const artifact of plan.artifacts) paths.set(artifact.agentId, artifact.path);
  return paths;
}
