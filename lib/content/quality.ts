type EvidenceRecord = {
  file: string;
  authority?: "reference" | "proposed" | "validated" | "policy";
  confidence?: "low" | "medium" | "high";
  kind?: "reported" | "observed" | "inference" | "assumption" | "hypothesis";
  dataStatus?: "unknown" | "available" | "partially-available" | "not-measured";
  provenance?: { source?: string; references: string[] };
  researchTrace?: unknown[];
  purpose?: string;
  activity?: string;
  rules?: unknown[];
  exceptions?: unknown[];
};

function hasRecordedEvidence(record: EvidenceRecord) {
  return Boolean(record.provenance?.references.length || record.researchTrace?.length);
}

/**
 * Reject objective evidence-contract contradictions without trying to judge
 * whether prose is true. Semantic quality remains a reviewer's job.
 */
export function checkContentQuality(records: EvidenceRecord[]) {
  for (const record of records) {
    const source = record.provenance?.source?.trim();

    if (record.provenance?.references.length && !source) {
      throw new Error(
        `Invalid provenance in ${record.file}: references are recorded without a provenance.source. ` +
          `Name why the record is believed, or remove references that are not evidence for it.`,
      );
    }

    if (["reference", "validated", "policy"].includes(record.authority ?? "") && !hasRecordedEvidence(record)) {
      throw new Error(
        `Unsupported authority in ${record.file}: authority '${record.authority}' requires a provenance reference ` +
          `or an accepted researchTrace. Use 'proposed' when the record is author reasoning.`,
      );
    }

    if (["reported", "observed"].includes(record.kind ?? "") && !hasRecordedEvidence(record)) {
      throw new Error(
        `Unsupported Claim kind in ${record.file}: '${record.kind}' requires a provenance reference or an accepted ` +
          `researchTrace. Use 'inference', 'assumption', or 'hypothesis' when no report or observation is recorded.`,
      );
    }

    if (record.confidence === "high" && !hasRecordedEvidence(record)) {
      throw new Error(
        `Unsupported confidence in ${record.file}: high confidence requires a provenance reference or an accepted ` +
          `researchTrace. Lower confidence or record the evidence.`,
      );
    }

    if (["available", "partially-available"].includes(record.dataStatus ?? "") && !hasRecordedEvidence(record)) {
      throw new Error(
        `Unsupported data status in ${record.file}: '${record.dataStatus}' requires a provenance reference or an ` +
          `accepted researchTrace showing what data exists.`,
      );
    }

    if (record.purpose?.trim() && record.purpose.trim() === record.activity?.trim()) {
      throw new Error(
        `Duplicated Step meaning in ${record.file}: activity restates purpose verbatim. ` +
          `Describe the actual work, or omit activity while it is unknown.`,
      );
    }

    for (const field of ["rules", "exceptions"] as const) {
      if (record[field] && record[field]?.length === 0) {
        throw new Error(
          `Empty optional field in ${record.file}: '${field}: []' implies completeness without adding knowledge. ` +
            `Omit the field until it is understood.`,
        );
      }
    }
  }
}
