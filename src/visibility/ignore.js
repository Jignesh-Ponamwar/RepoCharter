const START = '# repo-charter: workspace visibility';
const END = '# end repo-charter: workspace visibility';

function normalizedLines(paths) {
  return [...new Set(paths)].sort((left, right) => left.localeCompare(right));
}

export function managedIgnoreBlock(localArtifacts) {
  return [START, ...normalizedLines(localArtifacts), END].join('\n');
}

export function reconcileIgnoreContent(currentContent, localArtifacts) {
  const block = managedIgnoreBlock(localArtifacts);
  if (currentContent === undefined) return { content: `${block}\n`, status: 'create' };

  const start = currentContent.indexOf(START);
  const end = currentContent.indexOf(END);
  if (start === -1 && end === -1) {
    const separator = currentContent.length === 0 || currentContent.endsWith('\n') ? '' : '\n';
    return { content: `${currentContent}${separator}${block}\n`, status: 'append' };
  }
  if (start === -1 || end === -1 || end < start) {
    return { reason: 'RepoCharter workspace-visibility ignore block is malformed.', status: 'blocked' };
  }

  const afterEnd = end + END.length;
  const next = `${currentContent.slice(0, start)}${block}${currentContent.slice(afterEnd)}`;
  return { content: next.endsWith('\n') ? next : `${next}\n`, status: next === currentContent ? 'unchanged' : 'replace' };
}

export function managedIgnorePaths(content) {
  const start = content?.indexOf(START) ?? -1;
  const end = content?.indexOf(END) ?? -1;
  if (start === -1 || end === -1 || end < start) return undefined;
  return content.slice(start + START.length, end).split('\n').map((line) => line.trim()).filter(Boolean);
}
