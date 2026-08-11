export function inspectionSnapshot(inspection) {
  return inspection.snapshot;
}

export function changedSnapshotPaths(previousSnapshot, currentSnapshot) {
  const previous = new Map(previousSnapshot.files.map((file) => [file.path, file.freshness]));
  const current = new Map(currentSnapshot.files.map((file) => [file.path, file.freshness]));
  const paths = new Set([...previous.keys(), ...current.keys()]);

  return [...paths].filter((path) => {
    const before = previous.get(path);
    const after = current.get(path);
    return !before || !after || before.modifiedAt !== after.modifiedAt || before.sizeBytes !== after.sizeBytes;
  }).sort();
}

export function refreshSessionSnapshot(manifest, currentSnapshot) {
  const changedPaths = changedSnapshotPaths(manifest.repositorySnapshot, currentSnapshot);
  if (changedPaths.length === 0) {
    return { manifest, changedPaths, changed: false };
  }

  return {
    manifest: {
      ...manifest,
      stage: ['inspected', 'agents-selected', 'handoff-ready'].includes(manifest.stage) ? manifest.stage : 'handoff-ready',
      repositorySnapshot: currentSnapshot,
    },
    changedPaths,
    changed: true,
  };
}
