export const ADAPTER_TEMPLATE_VERSION = 1;

const ROUTING = 'Read `AGENTS.md` before repository changes. Then read `PLAN.md` for durable decisions and `TODO.md` for the first relevant unchecked approved task. Make only scoped approved work and record observed verification evidence.';

export function claudeAdapter() {
  return `# RepoCharter entry point\n\n@AGENTS.md\n\n${ROUTING}\n`;
}

export function geminiAdapter() {
  return `# RepoCharter entry point\n\n@./AGENTS.md\n\n${ROUTING}\n`;
}

export function copilotAdapter() {
  return `# RepoCharter entry point\n\n${ROUTING}\n`;
}
