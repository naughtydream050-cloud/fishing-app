const fs = require("fs");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const HTML_PATH = path.join(ROOT, "web", "oshi-activity-management", "share-card.html");
const OUTPUT_DIR = path.join(ROOT, "output", "share-cards");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "oshi-activity-management-A.png");
const WIDTH = 1080;
const HEIGHT = 1350;

function existingFile(candidate) {
  return candidate && fs.existsSync(candidate) ? candidate : null;
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.BROWSER_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  for (const candidate of candidates) {
    const found = existingFile(candidate);
    if (found) return found;
  }

  return null;
}

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error(`Generated file is not a PNG: ${filePath}`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function main() {
  if (!fs.existsSync(HTML_PATH)) {
    throw new Error(`Missing share-card HTML: ${HTML_PATH}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browserPath = findBrowser();
  if (!browserPath) {
    throw new Error("Chrome or Edge was not found. Set CHROME_PATH to a browser executable.");
  }

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "oshi-share-card-"));
  const fileUrl = pathToFileURL(HTML_PATH).href;
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--disable-features=Translate",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=1000",
    `--user-data-dir=${profileDir}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    "--force-device-scale-factor=1",
    `--screenshot=${OUTPUT_PATH}`,
    fileUrl,
  ];

  try {
    const result = spawnSync(browserPath, args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });

    if (result.status !== 0) {
      throw new Error(
        [
          `Browser screenshot failed with status ${result.status}.`,
          result.stderr.trim(),
          result.stdout.trim(),
        ]
          .filter(Boolean)
          .join("\n")
      );
    }
  } finally {
    if (profileDir.startsWith(os.tmpdir())) {
      fs.rmSync(profileDir, { recursive: true, force: true });
    }
  }

  const size = readPngSize(OUTPUT_PATH);
  if (size.width !== WIDTH || size.height !== HEIGHT) {
    throw new Error(`Unexpected PNG size: ${size.width}x${size.height}`);
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        output: path.relative(ROOT, OUTPUT_PATH).replace(/\\/g, "/"),
        width: size.width,
        height: size.height,
        browser: browserPath,
        safety: {
          dry_run: true,
          auto_post: false,
          threads_posting: false,
          external_api: false,
          db_auth_payment_rls: false,
        },
      },
      null,
      2
    )
  );
}

main();
