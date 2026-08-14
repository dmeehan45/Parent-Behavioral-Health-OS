import { ALLOWLIST_FILE, approvalFor, loadAllowlist, scan, staleApprovals, unapproved } from "../lib/research/safety";
import { run } from "./report";

run(() => {
  const findings = scan();
  const allowlist = loadAllowlist();
  const stale = staleApprovals(findings, allowlist);
  const open = unapproved(findings, allowlist);

  if (stale.length) {
    console.log(`\n${stale.length} approval(s) in ${ALLOWLIST_FILE} no longer match anything and can be deleted:\n`);
    stale.forEach((entry) => console.log(`  ${entry.file}  ${entry.rule}  ${entry.match}`));
  }

  if (!open.length) {
    const approved = findings.length - open.length;
    console.log(
      `Scanned content/, research/, and docs/ for confidential material. Nothing unapproved` +
        `${approved ? `; ${approved} previously approved match(es) unchanged` : ""}.`,
    );
    return;
  }

  const lines = [
    "",
    `Found ${open.length} thing(s) that should not be in a public repository:`,
    "",
  ];
  for (const finding of open) {
    lines.push(`  ${finding.file}:${finding.line}  ${finding.rule} — ${finding.says}`, `      ${finding.preview}`, "");
  }
  lines.push(
    "Each one is either a real leak or a false positive.",
    "",
    "  Real: remove it from the file. If it is a live credential, rotate it — it is in Git history now.",
    `  False positive: approve it by adding this to \`approved:\` in ${ALLOWLIST_FILE}, then run this again.`,
    "",
  );
  open.forEach((finding) => lines.push(approvalFor(finding), ""));
  lines.push(
    "The match is recorded as a hash, never as text, so approving something never writes it into the",
    "repository a second time. An approval covers exactly one match in one file: edit the line and it",
    "is flagged again.",
  );
  throw new Error(lines.join("\n"));
});
