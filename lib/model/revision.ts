import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const CONTENT_ROOT = path.join(process.cwd(), "content");

function contentFiles(dir: string, found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) contentFiles(full, found);
    else if (entry.name.endsWith(".md") || entry.name.endsWith(".yaml") || entry.name.endsWith(".yml")) found.push(full);
  }
  return found;
}

/**
 * A fingerprint of everything under `content/`.
 *
 * The browser polls this. When someone pushes a change — or edits a file
 * locally through Claude Code, Codex, or any other tool wired to the repo —
 * the hash moves and every open map pulls the new projection. Hashing file
 * *contents* rather than mtimes means a fresh clone or checkout of identical
 * content does not produce a spurious update.
 */
export function contentRevision(): string {
  const hash = createHash("sha1");
  for (const file of contentFiles(CONTENT_ROOT)) {
    hash.update(path.relative(CONTENT_ROOT, file));
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 16);
}

/** Fingerprint of a single projected node, used to highlight what changed. */
export function fingerprint(value: unknown): string {
  return createHash("sha1").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}
