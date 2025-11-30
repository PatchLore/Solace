const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function log(section, msg) {
  console.log(`\n[${section}] ${msg}`);
}

function findFfmpegZip() {
  const files = fs.readdirSync(process.cwd());
  // Accept any ffmpeg ZIP file (snapshot or release)
  return files.find(f => 
    f.toLowerCase().startsWith("ffmpeg") && 
    f.toLowerCase().endsWith(".zip")
  );
}

(async () => {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  FFmpeg Installer");
  console.log("═══════════════════════════════════════════════════════════");

  const zipName = findFfmpegZip();

  if (!zipName) {
    console.error("\n❌ ERROR: No FFmpeg ZIP found in project root.");
    console.error("Place an FFmpeg ZIP file in the project folder.\n");
    process.exit(1);
  }

  log("ZIP", `Using file: ${zipName}`);

  const tempDir = path.join(process.cwd(), "ffmpeg-install-temp");
  execSync(`rm -rf "${tempDir}"`);
  execSync(`mkdir -p "${tempDir}"`);

  log("Extract", "Extracting ZIP...");
  execSync(`unzip -o "${zipName}" -d "${tempDir}"`);

  // Find ffmpeg binary (may be nested)
  function findBinary(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        const found = findBinary(fullPath);
        if (found) return found;
      } else if (entry === "ffmpeg" || entry.startsWith("ffmpeg-")) {
        return fullPath;
      }
    }
    return null;
  }

  const ffmpegPath = findBinary(tempDir);
  if (!ffmpegPath) {
    console.error("\n❌ ERROR: ZIP does not contain 'ffmpeg' binary.");
    process.exit(1);
  }

  log("Backup", "Backing up existing FFmpeg (if exists)...");
  const target = "/usr/local/bin/ffmpeg";
  if (fs.existsSync(target)) {
    execSync(`sudo mv "${target}" "/usr/local/bin/ffmpeg_old"`);
  }

  log("Install", "Installing FFmpeg…");
  execSync(`sudo cp "${ffmpegPath}" "${target}"`);
  execSync(`sudo chmod +x "${target}"`);

  log("Quarantine", "Removing quarantine flags...");
  try {
    execSync(`sudo xattr -dr com.apple.quarantine "${target}"`);
  } catch {}

  log("Validate", "Checking installed version...");
  const version = execSync(`${target} -version`).toString();
  console.log(version);

  // Simple validation: just check it's version 6.x or above
  const versionMatch = version.match(/ffmpeg version (\d+)\./);
  if (!versionMatch || parseInt(versionMatch[1]) < 6) {
    console.error("❌ ERROR: FFmpeg version must be ≥ 6.x");
    process.exit(1);
  }

  log("Success", "FFmpeg installed successfully!");
  console.log(`✅ Version: ${version.split('\n')[0]}`);
  
  // Update .env.local if it exists
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (!envContent.includes("FFMPEG_PATH")) {
      envContent += `\nFFMPEG_PATH=${target}\n`;
      fs.writeFileSync(envPath, envContent);
      log("Config", "Updated .env.local with FFMPEG_PATH");
    }
  }
})();
