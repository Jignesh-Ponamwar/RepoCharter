export const ADAPTER_TEMPLATE_VERSION = 1;

function routing(workspaceVisibility) {
  return workspaceVisibility === 'shared-planning'
    ? 'Read public `AGENTS.md` before repository changes. Then read committed `PLAN.md` for durable decisions and committed `TODO.md` for the first relevant unchecked approved task. Make only scoped approved work and record observed verification evidence.'
    : 'Read public `AGENTS.md` before repository changes. Then use local `PLAN.md` and `TODO.md` when present. If they are absent, ask the developer to initialize or resume RepoCharter; do not create or commit planning files without approval.';
}

export function claudeAdapter(workspaceVisibility = 'local-planning') {
  return `# RepoCharter entry point\n\n@AGENTS.md\n\n${routing(workspaceVisibility)}\n`;
}

export function geminiAdapter(workspaceVisibility = 'local-planning') {
  return `# RepoCharter entry point\n\n@./AGENTS.md\n\n${routing(workspaceVisibility)}\n`;
}

export function copilotAdapter(workspaceVisibility = 'local-planning') {
  return `# RepoCharter entry point\n\n${routing(workspaceVisibility)}\n`;
}
