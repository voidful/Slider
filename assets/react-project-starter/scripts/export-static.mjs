import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const outDir = resolve(args.has("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "dist");
const pdfPath = resolve(args.has("--pdf-path") ? process.argv[process.argv.indexOf("--pdf-path") + 1] : "deck.pdf");

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function findChrome() {
  const envPath = process.env.CHROME_PATH;
  const candidates = [
    envPath,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "google-chrome",
    "chromium",
    "chromium-browser",
  ].filter(Boolean);
  return candidates.find((candidate) => candidate && (candidate.includes("/") ? existsSync(candidate) : true));
}

run("npx", ["vite", "build", "--outDir", outDir]);

const manifest = {
  exportedAt: new Date().toISOString(),
  staticDir: outDir,
  entry: `${outDir}/index.html`,
};
writeFileSync(resolve(outDir, "slider-export-manifest.json"), JSON.stringify(manifest, null, 2));

if (!args.has("--pdf")) process.exit(0);

const chrome = findChrome();
if (!chrome) {
  console.error("Chrome/Chromium was not found. Set CHROME_PATH or run npm run export:static and print dist/index.html manually.");
  process.exit(1);
}

mkdirSync(resolve(pdfPath, ".."), { recursive: true });
run(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--print-to-pdf-no-header",
  `--print-to-pdf=${pdfPath}`,
  `file://${resolve(outDir, "index.html")}`,
]);
