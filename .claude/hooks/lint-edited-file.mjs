// PostToolUse hook: lint the .ts/.tsx file Claude just edited.
// Exit 2 feeds ESLint errors back to Claude so it fixes them right away.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const filePath = input.tool_input?.file_path ?? input.tool_response?.filePath;
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

if (
  !filePath ||
  !/\.(ts|tsx)$/.test(filePath) ||
  filePath.includes("node_modules") ||
  !existsSync(filePath) ||
  path.relative(projectDir, filePath).startsWith("..")
) {
  process.exit(0);
}

const result = spawnSync("pnpm", ["exec", "eslint", filePath], {
  cwd: projectDir,
  encoding: "utf8",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.stderr.write(
    `ESLint errors in ${path.relative(projectDir, filePath)}. Fix the root cause; don't disable the rule:\n` +
      `${result.stdout}${result.stderr}`,
  );
  process.exit(2);
}
