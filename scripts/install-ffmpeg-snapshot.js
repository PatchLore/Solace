const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const unzip = require("extract-zip");
const os = require("os");

function log(section, msg) {
  console.log(`\n[${section}] ${msg}`);
}

function findFfmpegZip(projectRoot) {
  const files = fs.readdirSync(projectRoot);
  
  // Accept any ffmpeg ZIP file (snapshot or release)
  const zipFiles = files
    .filter(f => {
      const lower = f.toLowerCase();
      return lower.startsWith("ffmpeg") && lower.endsWith(".zip");
    })
    .map(f => ({
      name: f,
      path: path.join(projectRoot, f),
      stats: fs.statSync(path.join(projectRoot, f))
    }))
    .sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs); // Newest first
  
  if (zipFiles.length > 0) {
    return zipFiles[0];
  }
  
  return null;
}

function checkDownloadsFolder() {
  const downloadsPath = path.join(os.homedir(), "Downloads");
  if (!fs.existsSync(downloadsPath)) {
    return null;
  }
  
  const files = fs.readdirSync(downloadsPath);
  const zipFiles = files
    .filter(f => {
      const lower = f.toLowerCase();
      return lower.startsWith("ffmpeg") && lower.endsWith(".zip");
    })
    .map(f => ({
      name: f,
      path: path.join(downloadsPath, f),
      stats: fs.statSync(path.join(downloadsPath, f))
    }))
    .sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);
  
  if (zipFiles.length > 0) {
    return zipFiles[0];
  }
  
  return null;
}

function findFfmpegBinary(tempDir) {
  const files = fs.readdirSync(tempDir);
  
  // Look for ffmpeg binary
  const binary = files.find(f => {
    const fullPath = path.join(tempDir, f);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) return false;
    
    return f === "ffmpeg" || f.startsWith("ffmpeg-");
  });
  
  if (binary) {
    return path.join(tempDir, binary);
  }
  
  // Fallback: search recursively
  function searchRecursive(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        const found = searchRecursive(fullPath);
        if (found) return found;
      } else if (entry === "ffmpeg" || entry.startsWith("ffmpeg-")) {
        return fullPath;
      }
    }
    return null;
  }
  
  return searchRecursive(tempDir);
}

async function installSnapshot() {
  const projectRoot = process.cwd();
  const tempDir = path.join(projectRoot, "ffmpeg-temp");

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  FFmpeg Installer");
  console.log("═══════════════════════════════════════════════════════════");

  // Step 1: Find FFmpeg ZIP
  log("Detect", "Searching for FFmpeg ZIP...");
  
  let zipFile = null;
  let zipPath = null;
  
  // Search project root
  const found = findFfmpegZip(projectRoot);
  if (found) {
    zipFile = found.name;
    zipPath = found.path;
    log("Detect", `✅ Found: ${zipFile}`);
  } else {
    // Check Downloads folder
    log("Detect", "Not found in project, checking Downloads folder...");
    const downloadsZip = checkDownloadsFolder();
    if (downloadsZip) {
      log("Detect", `Found in Downloads: ${downloadsZip.name}`);
      log("Move", "Moving to project root...");
      const targetPath = path.join(projectRoot, downloadsZip.name);
      fs.renameSync(downloadsZip.path, targetPath);
      zipPath = targetPath;
      zipFile = downloadsZip.name;
    }
  }

  if (!zipPath || !fs.existsSync(zipPath)) {
    console.error("\n❌ No FFmpeg ZIP found.");
    console.error("Place an FFmpeg ZIP file in the project root or Downloads folder.\n");
    process.exit(1);
  }

  log("ZIP", `Using: ${zipFile}`);

  // Step 2: Cleanup and extract
  log("Cleanup", "Preparing temp directory...");
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  log("Extract", "Extracting ZIP...");
  try {
    await unzip(zipPath, { dir: tempDir });
  } catch (err) {
    console.error("❌ Extraction failed:", err.message);
    process.exit(1);
  }

  // Step 3: Find FFmpeg binary
  log("Locate", "Searching for FFmpeg binary...");
  const snapshotPath = findFfmpegBinary(tempDir);
  
  if (!snapshotPath || !fs.existsSync(snapshotPath)) {
    console.error("❌ Could not detect FFmpeg binary.");
    console.error("Files found in temp dir:", fs.readdirSync(tempDir));
    process.exit(1);
  }

  const snapshotFileName = path.basename(snapshotPath);
  log("Locate", `✅ Binary found: ${snapshotFileName}`);

  // Step 4: Backup and install
  const target = "/usr/local/bin/ffmpeg";
  
  log("Backup", "Backing up existing FFmpeg (if exists)...");
  if (fs.existsSync(target)) {
    try {
      execSync(`sudo mv "${target}" "/usr/local/bin/ffmpeg_old"`, { stdio: 'inherit' });
      log("Backup", "✅ Existing FFmpeg backed up to /usr/local/bin/ffmpeg_old");
    } catch (err) {
      console.warn("⚠️  Could not backup existing FFmpeg (may not exist)");
    }
  }

  log("Install", "Installing FFmpeg...");
  try {
    execSync(`sudo cp "${snapshotPath}" "${target}"`, { stdio: 'inherit' });
    execSync(`sudo chmod +x "${target}"`, { stdio: 'inherit' });
    log("Install", "✅ FFmpeg installed to /usr/local/bin/ffmpeg");
  } catch (err) {
    console.error("❌ Installation failed:", err.message);
    process.exit(1);
  }

  // Step 5: Remove quarantine
  log("Quarantine", "Removing quarantine flags...");
  try {
    execSync(`sudo xattr -dr com.apple.quarantine "${target}"`, { stdio: 'inherit' });
    log("Quarantine", "✅ Quarantine flags removed");
  } catch (err) {
    console.warn("⚠️  Could not remove quarantine flags");
  }

  // Step 6: Validate
  log("Validate", "Validating installed FFmpeg...");
  let versionOutput;
  try {
    versionOutput = execSync(`${target} -version`, { encoding: 'utf-8' });
  } catch (err) {
    console.error("❌ Failed to run FFmpeg:", err.message);
    process.exit(1);
  }

  // Simple validation: just check it's version 6.x or above
  const versionLine = versionOutput.split('\n')[0];
  const versionMatch = versionLine.match(/ffmpeg version (\d+)\./);
  if (!versionMatch || parseInt(versionMatch[1]) < 6) {
    console.error("❌ ERROR: FFmpeg version must be ≥ 6.x");
    console.error(`   Found: ${versionLine}`);
    process.exit(1);
  }

  // Step 7: Cleanup
  log("Cleanup", "Removing temporary files...");
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
    log("Cleanup", "✅ Temporary files removed");
  } catch (err) {
    console.warn("⚠️  Could not remove temp directory:", err.message);
  }

  // Success
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  🎉 FFmpeg Installed Successfully!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`\n📍 Location: ${target}`);
  console.log(`📦 Version: ${versionLine}`);
  console.log("\n✅ Ready to use!\n");
  
  // Update .env.local if it exists
  const envPath = path.join(projectRoot, ".env.local");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (!envContent.includes("FFMPEG_PATH")) {
      envContent += `\nFFMPEG_PATH=${target}\n`;
      fs.writeFileSync(envPath, envContent);
      log("Config", "Updated .env.local with FFMPEG_PATH");
    }
  }
}

installSnapshot().catch(err => {
  console.error("\n❌ Installation failed:", err);
  process.exit(1);
});
