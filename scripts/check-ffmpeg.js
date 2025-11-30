const { execSync } = require("child_process");
const { existsSync } = require("fs");

// FORCE /usr/local/bin/ffmpeg - never use env vars or MacPorts
const ffmpegPath = "/usr/local/bin/ffmpeg";

// CRITICAL: Detect and block MacPorts FFmpeg
if (existsSync("/opt/local/bin/ffmpeg")) {
  console.error("═══════════════════════════════════════════════════════════");
  console.error(" ❌ MacPorts FFmpeg DETECTED");
  console.error("═══════════════════════════════════════════════════════════");
  console.error("");
  console.error("The old MacPorts FFmpeg at /opt/local/bin/ffmpeg will break");
  console.error("filter_complex and cause rendering failures.");
  console.error("");
  console.error("Please disable it by running:");
  console.error("");
  console.error("  sudo mv /opt/local/bin/ffmpeg /opt/local/bin/ffmpeg_backup");
  console.error("");
  console.error("Then restart the dev server.");
  console.error("═══════════════════════════════════════════════════════════");
  process.exit(1);
}

try {
  if (!existsSync(ffmpegPath)) {
    console.error("──────────────────────────────────────────────");
    console.error(" FFmpeg Startup Verification FAILED");
    console.error(" Binary not found at:", ffmpegPath);
    console.error(" Run: npm run install-ffmpeg");
    console.error("──────────────────────────────────────────────");
    process.exit(1);
  }

  const ff = execSync(`${ffmpegPath} -version`).toString();
  const versionLine = ff.split("\n")[0];
  
  // Validate version - must be ≥ 6.x
  const versionMatch = versionLine.match(/ffmpeg version (\d+)\./);
  if (!versionMatch || parseInt(versionMatch[1]) < 6) {
    console.error("──────────────────────────────────────────────");
    console.error(" FFmpeg Startup Verification FAILED");
    console.error(" Version must be ≥ 6.x");
    console.error(" Current:", versionLine);
    console.error(" Run: npm run install-ffmpeg");
    console.error("──────────────────────────────────────────────");
    process.exit(1);
  }

  // Check for MacPorts
  const isMacPorts = ff.includes("/opt/local") ||
                     ff.includes("MacPorts") ||
                     ff.includes("mp4v2");
  
  if (isMacPorts) {
    console.error("──────────────────────────────────────────────");
    console.error(" FFmpeg Startup Verification FAILED");
    console.error(" Old MacPorts binary detected!");
    console.error(" Run: npm run install-ffmpeg");
    console.error("──────────────────────────────────────────────");
    process.exit(1);
  }

  console.log("──────────────────────────────────────────────");
  console.log(" FFmpeg OK: using", ffmpegPath);
  console.log(" Version:", versionLine);
  console.log("──────────────────────────────────────────────");
} catch (e) {
  console.error("──────────────────────────────────────────────");
  console.error(" FFmpeg FAILED to run");
  console.error(" Error:", e.message);
  console.error(" Run: npm run install-ffmpeg");
  console.error("──────────────────────────────────────────────");
  process.exit(1);
}
