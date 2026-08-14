import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { ZodError } from "zod";
import { safetyAllowlistSchema, type SafetyAllowlist } from "./schema";

export const ALLOWLIST_FILE = path.join("research", "safety-allowlist.yaml");

/** Directories a contributor writes into. Code and docs are not scanned. */
const SCANNED = ["content", "research", "docs"];

/**
 * How much damage the match would do if it is real.
 *
 * `secret` matches are masked everywhere they are reported. Printing a leaked
 * credential into a public CI log to announce that it leaked would publish it a
 * second time, more durably.
 */
type Sensitivity = "secret" | "personal" | "marker";

type Rule = {
  id: string;
  sensitivity: Sensitivity;
  pattern: RegExp;
  says: string;
};

/**
 * Cheap, deterministic, and deliberately literal.
 *
 * These rules look for the shapes of things that must not be in a public
 * repository, not for meaning. They will miss a confidential paragraph written
 * in plain prose — nothing regex-shaped catches that, and pretending otherwise
 * would be worse than the honest gap. What they do catch is the common way it
 * actually happens: a credential, a contact detail, or a paste out of an
 * internal document that kept its header.
 */
const RULES: Rule[] = [
  { id: "private-key", sensitivity: "secret", pattern: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/g, says: "a private key" },
  { id: "api-key", sensitivity: "secret", pattern: /\b(?:sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,})\b/g, says: "an API key or access token" },
  { id: "jwt", sensitivity: "secret", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, says: "a signed token" },
  { id: "bearer-token", sensitivity: "secret", pattern: /\b(?:authorization|bearer|api[_-]?key|secret|password|passwd)\s*[:=]\s*["']?[A-Za-z0-9_\-.]{12,}["']?/gi, says: "a credential assigned to a name" },
  { id: "connection-string", sensitivity: "secret", pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s/@:]+:[^\s/@]+@/g, says: "a connection string with a password in it" },
  { id: "email-address", sensitivity: "personal", pattern: /\b[A-Za-z0-9._%+-]+@(?!example\.(?:com|org|net)\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, says: "an email address" },
  { id: "phone-number", sensitivity: "personal", pattern: /(?:\+1[ .-]?)?\(\d{3}\)[ .-]?\d{3}[ .-]\d{4}\b|\b(?:\+1[ .-])?\d{3}[ .-]\d{3}[ .-]\d{4}\b/g, says: "a phone number" },
  { id: "national-id", sensitivity: "personal", pattern: /\b\d{3}-\d{2}-\d{4}\b/g, says: "something shaped like a national ID number" },
  { id: "patient-identifier", sensitivity: "personal", pattern: /\b(?:MRN|DOB|date of birth|member id|policy number)\b\s*[:#]\s*\S+/gi, says: "a patient or member identifier with a value" },
  { id: "confidential-marker", sensitivity: "marker", pattern: /\b(?:strictly confidential|company confidential|internal use only|internal only|do not distribute|proprietary and confidential|attorney[- ]client privileged)\b/gi, says: "a confidentiality marker carried over from another document" },
  { id: "internal-host", sensitivity: "marker", pattern: /\bhttps?:\/\/[^\s"'<>]*\.(?:internal|intranet|corp|local)\b/gi, says: "a link to an internal host" },
];

export type Finding = {
  file: string;
  line: number;
  rule: string;
  says: string;
  sensitivity: Sensitivity;
  /** Masked for secrets, verbatim otherwise. Safe to print. */
  preview: string;
  /** Stable identifier for the approval, and never the matched text itself. */
  hash: string;
};

/** Enough to recognise, not enough to use. */
function mask(value: string) {
  if (value.length <= 8) return `${value.slice(0, 2)}${"•".repeat(6)}`;
  return `${value.slice(0, 4)}${"•".repeat(Math.min(12, value.length - 6))}${value.slice(-2)}`;
}

export function matchHash(file: string, rule: string, match: string) {
  return crypto.createHash("sha256").update(`${file}\0${rule}\0${match}`).digest("hex").slice(0, 16);
}

function scannedFiles(root: string): string[] {
  const found: string[] = [];
  const walk = (directory: string) => {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(?:md|ya?ml|json|txt)$/.test(entry.name)) found.push(path.relative(root, full));
    }
  };
  SCANNED.forEach((directory) => walk(path.join(root, directory)));
  return found;
}

export function loadAllowlist(root = process.cwd()): SafetyAllowlist {
  const absolute = path.join(root, ALLOWLIST_FILE);
  if (!fs.existsSync(absolute)) return { approved: [] };
  try {
    return safetyAllowlistSchema.parse(yaml.load(fs.readFileSync(absolute, "utf8")) ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(error.issues.map((issue) => `${ALLOWLIST_FILE}: ${issue.path.join(".") || "document"}: ${issue.message}`).join("\n"));
    }
    throw new Error(`${ALLOWLIST_FILE}: not valid YAML: ${(error as Error).message}`);
  }
}

export function scan(root = process.cwd()): Finding[] {
  const findings: Finding[] = [];
  for (const file of scannedFiles(root)) {
    // The allowlist records hashes of flagged matches, so scanning it finds
    // every rule quoting itself.
    if (file === ALLOWLIST_FILE) continue;
    const lines = fs.readFileSync(path.join(root, file), "utf8").split("\n");
    lines.forEach((text, index) => {
      for (const rule of RULES) {
        rule.pattern.lastIndex = 0;
        for (const match of text.matchAll(rule.pattern)) {
          findings.push({
            file,
            line: index + 1,
            rule: rule.id,
            says: rule.says,
            sensitivity: rule.sensitivity,
            preview: rule.sensitivity === "secret" ? mask(match[0]) : match[0],
            hash: matchHash(file, rule.id, match[0]),
          });
        }
      }
    });
  }
  return findings;
}

/** Findings the reviewer has not already looked at and approved. */
export function unapproved(findings: Finding[], allowlist: SafetyAllowlist) {
  const approved = new Set(allowlist.approved.map((entry) => `${entry.file}\0${entry.rule}\0${entry.match}`));
  return findings.filter((finding) => !approved.has(`${finding.file}\0${finding.rule}\0${finding.hash}`));
}

/**
 * Approvals that no longer match anything.
 *
 * An approval outliving the line it approved is how a blanket exemption gets
 * built by accident: the file is edited, the match moves or changes, and the
 * entry stays behind covering something nobody looked at.
 */
export function staleApprovals(findings: Finding[], allowlist: SafetyAllowlist) {
  const live = new Set(findings.map((finding) => `${finding.file}\0${finding.rule}\0${finding.hash}`));
  return allowlist.approved.filter((entry) => !live.has(`${entry.file}\0${entry.rule}\0${entry.match}`));
}

/** The block a reviewer pastes into the allowlist to approve a finding. */
export function approvalFor(finding: Finding) {
  return [
    `  - file: ${finding.file}`,
    `    rule: ${finding.rule}`,
    `    match: ${finding.hash}`,
    `    approvedBy: your name or handle`,
    `    reason: why this is safe in a public repository`,
  ].join("\n");
}
