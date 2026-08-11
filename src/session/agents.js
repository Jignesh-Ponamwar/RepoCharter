export const AGENT_REGISTRY = Object.freeze([
  {
    id: 'codex',
    displayName: 'Codex',
    nativeSurface: 'AGENTS.md',
    compatibility: 'unverified',
    testedVersions: [],
    limitations: ['Behavior evaluation has not been completed.'],
    adapterTemplateVersion: null,
  },
  {
    id: 'claude-code',
    displayName: 'Claude Code',
    nativeSurface: 'CLAUDE.md',
    compatibility: 'unverified',
    testedVersions: [],
    limitations: ['Behavior evaluation has not been completed.'],
    adapterTemplateVersion: 1,
  },
  {
    id: 'github-copilot',
    displayName: 'GitHub Copilot',
    nativeSurface: '.github/copilot-instructions.md',
    compatibility: 'unverified',
    testedVersions: [],
    limitations: ['Behavior evaluation has not been completed.'],
    adapterTemplateVersion: 1,
  },
  {
    id: 'cursor',
    displayName: 'Cursor',
    nativeSurface: 'AGENTS.md',
    compatibility: 'unverified',
    testedVersions: [],
    limitations: ['Behavior evaluation has not been completed.'],
    adapterTemplateVersion: null,
  },
  {
    id: 'windsurf',
    displayName: 'Windsurf',
    nativeSurface: 'AGENTS.md',
    compatibility: 'unverified',
    testedVersions: [],
    limitations: ['Behavior evaluation has not been completed.'],
    adapterTemplateVersion: null,
  },
  {
    id: 'gemini-cli',
    displayName: 'Gemini CLI',
    nativeSurface: 'GEMINI.md',
    compatibility: 'unverified',
    testedVersions: [],
    limitations: ['Behavior evaluation has not been completed.'],
    adapterTemplateVersion: 1,
  },
  {
    id: 'generic',
    displayName: 'Generic AGENTS.md consumer',
    nativeSurface: 'AGENTS.md',
    compatibility: 'unverified',
    testedVersions: [],
    limitations: ['Behavior evaluation has not been completed.'],
    adapterTemplateVersion: null,
  },
]);

export function findAgent(agentId) {
  return AGENT_REGISTRY.find((agent) => agent.id === agentId);
}

export function selectAgents(primary, secondary = []) {
  if (!primary) {
    throw new Error('A primary agent is required for a new setup session.');
  }
  if (!findAgent(primary)) {
    throw new Error(`Unsupported primary agent: ${primary}.`);
  }
  if (new Set(secondary).size !== secondary.length || secondary.includes(primary)) {
    throw new Error('Secondary agents must be unique and must not include the primary agent.');
  }
  for (const agentId of secondary) {
    if (!findAgent(agentId)) {
      throw new Error(`Unsupported secondary agent: ${agentId}.`);
    }
  }

  return { primary, secondary };
}
