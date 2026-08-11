import { buildDecisionFrontier, formatFrontierQuestions } from '../grill/decision-tree.js';
import { findAgent } from './agents.js';

export function createPlanningHandoff(manifest, inspection) {
  const selected = [manifest.selectedAgents.primary, ...manifest.selectedAgents.secondary].map((id) => {
    const agent = findAgent(id);
    return { id, displayName: agent.displayName, nativeSurface: agent.nativeSurface, compatibility: agent.compatibility };
  });
  const frontier = buildDecisionFrontier({
    evidence: inspection.evidence,
    decisions: manifest.confirmedDecisions,
  });
  const payload = {
    schemaVersion: 1,
    selectedAgents: selected,
    stage: manifest.stage,
    evidence: inspection.evidence,
    candidateCommands: inspection.commands,
    skippedPaths: inspection.skipped,
    limits: inspection.limits,
  };

  return `# RepoCharter planning handoff\n\nYou are the selected primary coding agent for this repository. Read the structured inspection evidence below before asking questions.\n\n## Required interview procedure\n\n1. Treat observed evidence as repository facts, developer-approved decisions as intent, and unknowns as unresolved.\n2. Do not ask for facts already established by the evidence. Ask the complete currently unblocked decision frontier in rounds, recommend an answer, and wait for the developer.\n3. Surface contradictions, vague success criteria, and future requirements that affect current architecture.\n4. Produce a shared-understanding summary. Do not propose durable project files until the developer explicitly confirms it.\n5. Do not persist raw conversation transcripts, repository source bodies, credentials, or secrets.\n6. After confirmation, create a validated approved setup specification. Later phases will preview every generated/reconciled file and require approval before applying changes.\n\n## Current decision frontier\n\n${formatFrontierQuestions(frontier) || 'No interview questions remain; prepare the shared-understanding summary for explicit developer confirmation.'}\n\n## Selected agents and safe inspection evidence\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n`;
}
