// Terminal log helpers: colors + level-prefixed lines.
// All output goes to stderr except the trailing ::summary:: line which goes to stdout.

const isTTY = process.stderr.isTTY;
const c = (code) => (s) => (isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);

export const dim = c("2");
export const bold = c("1");
export const red = c("31");
export const green = c("32");
export const yellow = c("33");
export const cyan = c("36");

export function step(n, title) {
  process.stderr.write(`\n${bold(cyan(`[${n}]`))} ${bold(title)}\n`);
}

export function info(msg) {
  process.stderr.write(`  ${dim("›")} ${msg}\n`);
}

export function ok(msg) {
  process.stderr.write(`  ${green("✓")} ${msg}\n`);
}

export function warn(msg) {
  process.stderr.write(`  ${yellow("!")} ${msg}\n`);
}

export function fail(msg) {
  process.stderr.write(`\n${red(bold("✗"))} ${red(msg)}\n`);
}

export function die(msg, code = 1) {
  fail(msg);
  process.exit(code);
}

// Print machine-readable summary on stdout for orchestrator/agent to parse.
// Each phase script ends with exactly one of these.
export function emitSummary(obj) {
  process.stdout.write(`::summary:: ${JSON.stringify(obj)}\n`);
}
