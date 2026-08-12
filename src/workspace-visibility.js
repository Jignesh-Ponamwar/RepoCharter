export const WORKSPACE_VISIBILITIES = Object.freeze(['local-planning', 'shared-planning']);

export function isWorkspaceVisibility(value) {
  return WORKSPACE_VISIBILITIES.includes(value);
}
