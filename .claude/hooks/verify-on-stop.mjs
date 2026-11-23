// Stop hook: before Claude finishes a turn, run tests, lint and type-check.
// - Skips when the working tree hasn't changed since the last green run.
// - On failure, exits 2 so Claude sees the errors and keeps fixing.
// - Gives up after MAX_ATTEMPTS failed rounds per session and tells the user.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const MAX_ATTEMPTS = 3;
const OUTPUT_LIMIT = 4000;
const CHECKS = [
  ["tests", ["test"]],
  ["lint", ["lint"]],
  ["type-check", ["exec", "tsc", "--noEmit", "-p", "."]],
];

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const repoKey = createHash("sha1").update(projectDir).digest("hex").slice(0, 12);
const greenFile = path.join(os.tmpdir(), `claude-verify-${repoKey}-green`);
const attemptsFile = path.join(
  os.tmpdir(),
  `claude-verify-${repoKey}-${input.session_id ?? "default"}-attempts`,
);

const run = (cmd, args) =>
  spawnSync(cmd, args, {
    cwd: projectDir,
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 64 * 1024 * 1024,
  });

const read = (file) => (existsSync(file) ? readFileSync(file, "utf8") : "");

/** Hash of every uncommitted change, including untracked files. */
const fingerprint = () => {
  const hash = createHash("sha1");
  hash.update(run("git", ["rev-parse", "HEAD"]).stdout ?? "");
  hash.update(run("git", ["diff", "HEAD"]).stdout ?? "");
  const untracked = (run("git", ["ls-files", "--others", "--exclude-standard"]).stdout ?? "")
    .split("\n")
    .filter(Boolean);
  for (const file of untracked) {
    hash.update(file);
    hash.update(read(path.join(projectDir, file)));
  }
  return hash.digest("hex");
};

const before = fingerprint();
if (before === read(greenFile)) process.exit(0);

const failures = [];
for (const [name, args] of CHECKS) {
  const result = run("pnpm", args);
  if (result.status !== 0) {
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    failures.push(`### ${name} failed\n${output.slice(-OUTPUT_LIMIT)}`);
  }
}

if (failures.length === 0) {
  writeFileSync(greenFile, before);
  writeFileSync(attemptsFile, "0");
  process.exit(0);
}

const attempts = Number(read(attemptsFile) || "0") + 1;
if (attempts > MAX_ATTEMPTS) {
  writeFileSync(attemptsFile, "0");
  process.stdout.write(
    JSON.stringify({
      systemMessage: `Checks still failing after ${MAX_ATTEMPTS} repair attempts; stopping so you can take a look.`,
    }),
  );
  process.exit(0);
}

writeFileSync(attemptsFile, String(attempts));
process.stderr.write(
  `Checks failed (repair attempt ${attempts}/${MAX_ATTEMPTS}). Find the root cause and fix it. ` +
    `Don't skip or weaken tests, add eslint-disable, or use \`any\` to get green. ` +
    `If the fix needs a decision from the user, stop and explain instead.\n\n` +
    failures.join("\n\n"),
);
process.exit(2);
