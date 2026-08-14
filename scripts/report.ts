/**
 * Print a validation failure the way a person can act on it.
 *
 * These scripts are the only feedback a contributor gets, and for research
 * intake the documented fallback when a connector cannot read CI is that
 * somebody pastes this output back into a chat window. An uncaught throw wraps
 * one actionable line in fifteen lines of `node:internal` stack, which reads as
 * "the tool is broken" rather than "line 12 of your file is wrong".
 */
export function run(action: () => void) {
  try {
    action();
  } catch (error) {
    console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
