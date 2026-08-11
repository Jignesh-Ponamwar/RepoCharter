import { createHash } from 'node:crypto';

export const OWNERSHIP_KIND = 'repo-charter-ownership';
export const OWNERSHIP_SCHEMA_VERSION = 1;

export function hashContent(content) {
  return createHash('sha256').update(content).digest('hex');
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function ownershipPayload(managedArtifacts) {
  return {
    schemaVersion: OWNERSHIP_SCHEMA_VERSION,
    kind: OWNERSHIP_KIND,
    managedArtifacts,
  };
}

export function createManagedArtifact(path, content, templateVersion) {
  return {
    path,
    contentHash: hashContent(content),
    templateVersion,
  };
}

export function createOwnershipDocument(managedArtifacts = []) {
  const payload = ownershipPayload(managedArtifacts);
  return serialize({
    ...payload,
    payloadHash: hashContent(serialize(payload)),
  });
}

export function verifyOwnershipDocument(content) {
  let document;

  try {
    document = JSON.parse(content);
  } catch {
    return { valid: false, reason: 'Ownership document is not valid JSON.' };
  }

  if (document.schemaVersion !== OWNERSHIP_SCHEMA_VERSION || document.kind !== OWNERSHIP_KIND) {
    return { valid: false, reason: 'Ownership document has an unsupported marker.' };
  }

  if (!Array.isArray(document.managedArtifacts) || typeof document.payloadHash !== 'string') {
    return { valid: false, reason: 'Ownership document is missing required fields.' };
  }

  const expectedPayloadHash = hashContent(serialize(ownershipPayload(document.managedArtifacts)));
  if (document.payloadHash !== expectedPayloadHash) {
    return { valid: false, reason: 'Ownership document hash does not match its payload.' };
  }

  return { valid: true, document };
}
