#!/usr/bin/env node

/**
 * File size checker script
 * Enforces maximum line counts for different file types
 */

import { readFileSync, statSync } from "fs";
import { extname, join, relative } from "path";
import pkg from "glob";

const { glob } = pkg;

const MAX_LINES = {
  component: 200, // .tsx files in components/
  hook: 150, // .ts files in hooks/
  utility: 150, // .ts files in lib/ or utils/
  route: 500, // .tsx files in routes/
};

const RULES = [
  {
    pattern: "src/components/**/*.tsx",
    maxLines: MAX_LINES.component,
    type: "component",
  },
  {
    pattern: "src/hooks/**/*.ts",
    maxLines: MAX_LINES.hook,
    type: "hook",
  },
  {
    pattern: "src/lib/**/*.ts",
    maxLines: MAX_LINES.utility,
    type: "utility",
  },
  {
    pattern: "src/routes/**/*.tsx",
    maxLines: MAX_LINES.route,
    type: "route",
  },
];

function countLines(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8");
    return content.split("\n").length;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return 0;
  }
}

async function checkFileSizes() {
  const errors = [];
  const cwd = process.cwd();

  for (const rule of RULES) {
    const files = await glob(rule.pattern, {
      cwd,
      ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/routeTree.gen.ts"],
    });

    for (const file of files) {
      const fullPath = join(cwd, file);
      const lineCount = countLines(fullPath);
      const relativePath = relative(cwd, fullPath);

      if (lineCount > rule.maxLines) {
        errors.push({
          file: relativePath,
          type: rule.type,
          lines: lineCount,
          maxLines: rule.maxLines,
          over: lineCount - rule.maxLines,
        });
      }
    }
  }

  if (errors.length > 0) {
    console.error("\n❌ File size violations found:\n");
    errors.forEach(({ file, type, lines, maxLines, over }) => {
      console.error(`  ${file}`);
      console.error(`    Type: ${type}`);
      console.error(`    Lines: ${lines} (max: ${maxLines}, over by: ${over})\n`);
    });
    console.error(`\nTotal violations: ${errors.length}`);
    process.exit(1);
  } else {
    console.log("✅ All files are within size limits");
    process.exit(0);
  }
}

checkFileSizes().catch((error) => {
  console.error("Error checking file sizes:", error);
  process.exit(1);
});
