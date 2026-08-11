import { redactValue } from './redaction.js';

export const EVIDENCE_CLASSIFICATION = Object.freeze({
  OBSERVED: 'observed',
  DEVELOPER_APPROVED: 'developer-approved',
  UNKNOWN: 'unknown',
});

export function createEvidence({ fact, value, source, evidenceType, confidence = 'high', classification = EVIDENCE_CLASSIFICATION.OBSERVED }) {
  if (!Object.values(EVIDENCE_CLASSIFICATION).includes(classification)) {
    throw new Error(`Unsupported evidence classification: ${classification}`);
  }

  return {
    fact,
    value: redactValue(value),
    classification,
    confidence,
    evidenceType,
    source,
  };
}

export function createUnknownEvidence(fact, reason) {
  return createEvidence({
    fact,
    value: reason,
    classification: EVIDENCE_CLASSIFICATION.UNKNOWN,
    confidence: 'unknown',
    evidenceType: 'inspection-limit',
    source: { path: '.', freshness: { modifiedAt: null, sizeBytes: 0 } },
  });
}
