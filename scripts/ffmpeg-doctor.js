const { execSync } = require("child_process");
const { existsSync } = require("fs");
const path = require("path");

console.log("═══════════════════════════════════════════════════════════");
console.log("  FFmpeg Doctor - System Diagnostics");
console.log("═══════════════════════════════════════════════════════════\n");

// Check which ffmpeg is in PATH
console.log("[1] Checking PATH for FFmpeg...");
try {
  const whichOutput = execSync("which ffmpeg", { encoding: 'utf-8' }).trim();
  console.log(`   Found: ${whichOutput}`);
  
  if (whichOutput.includes("/opt/local")) {
    console.error("   ❌ MacPorts FFmpeg is in PATH!");
  } else if (whichOutput === "/usr/local/bin/ffmpeg") {
    console.log("   ✅ Correct FFmpeg in PATH");
  } else {
    console.warn(`   ⚠️  Unexpected path: ${whichOutput}`);
  }
} catch (e) {
  console.log("   ℹ️  No FFmpeg found in PATH");
}
console.log("");

// Check specific paths
const pathsToCheck = [
  { path: "/usr/local/bin/ffmpeg", name: "Target (correct)" },
  { path: "/opt/local/bin/ffmpeg", name: "MacPorts (should be disabled)" },
  { path: "/usr/bin/ffmpeg", name: "System" },
];

console.log("[2] Checking specific FFmpeg installations...");
for (const { path: ffPath, name } of pathsToCheck) {
  if (existsSync(ffPath)) {
    try {
      const versionOutput = execSync(`${ffPath} -version`, { encoding: 'utf-8', timeout: 5000 });
      const versionLine = versionOutput.split('\n')[0];
      const libavfilterMatch = versionOutput.match(/libavfilter\s+(\d+)\.(\d+)\.(\d+)/);
      
      console.log(`   ${name}:`);
      console.log(`     Path: ${ffPath}`);
      console.log(`     Version: ${versionLine}`);
      if (libavfilterMatch) {
        console.log(`     libavfilter: ${libavfilterMatch[0]}`);
      }
      
      // Check for Evermeet (safe build that uses "tessus" in version)
      const isEvermeet = versionOutput.includes("tessus") && 
                         versionOutput.includes("https://evermeet.cx/ffmpeg/");
      
      // Check for MacPorts (correct detection)
      const isMacPorts = versionOutput.includes("/opt/local") ||
                         versionOutput.includes("MacPorts") ||
                         versionOutput.includes("mp4v2");
      
      if (isEvermeet) {
        console.log(`     ✅ Evermeet FFmpeg detected (safe build)`);
      } else if (isMacPorts || ffPath === "/opt/local/bin/ffmpeg") {
        console.error(`     ❌ MacPorts FFmpeg detected!`);
      } else if (ffPath === "/usr/local/bin/ffmpeg") {
        const versionMatch = versionLine.match(/ffmpeg version (\d+)\./);
        if (versionMatch && parseInt(versionMatch[1]) >= 6) {
          console.log(`     ✅ Correct version (≥ 6.x)`);
        } else {
          console.warn(`     ⚠️  Version may be too old`);
        }
      }
      console.log("");
    } catch (e) {
      console.log(`   ${name}: ${ffPath} (exists but failed to run)`);
      console.log("");
    }
  } else {
    if (ffPath === "/opt/local/bin/ffmpeg") {
      console.log(`   ${name}: Not found ✅ (MacPorts disabled)`);
    } else if (ffPath === "/usr/local/bin/ffmpeg") {
      console.error(`   ${name}: Not found ❌ (required!)`);
    } else {
      console.log(`   ${name}: Not found`);
    }
    console.log("");
  }
}

// Check environment variables
console.log("[3] Checking environment variables...");
const envVars = ["FFMPEG_PATH", "FFPROBE_PATH", "PATH"];
for (const varName of envVars) {
  const value = process.env[varName];
  if (value) {
    if (varName === "PATH" && value.includes("/opt/local")) {
      console.warn(`   ${varName}: Contains /opt/local (MacPorts in PATH)`);
    } else if (varName === "FFMPEG_PATH") {
      if (value === "/usr/local/bin/ffmpeg") {
        console.log(`   ${varName}: ${value} ✅`);
      } else {
        console.warn(`   ${varName}: ${value} ⚠️  (should be /usr/local/bin/ffmpeg)`);
      }
    } else {
      console.log(`   ${varName}: Set`);
    }
  } else {
    if (varName === "FFMPEG_PATH") {
      console.log(`   ${varName}: Not set (will use hardcoded /usr/local/bin/ffmpeg)`);
    } else {
      console.log(`   ${varName}: Not set`);
    }
  }
}
console.log("");

// Final diagnosis
console.log("[4] Diagnosis...");
const issues = [];
const warnings = [];

if (existsSync("/opt/local/bin/ffmpeg")) {
  issues.push("MacPorts FFmpeg detected at /opt/local/bin/ffmpeg");
}

if (!existsSync("/usr/local/bin/ffmpeg")) {
  issues.push("Required FFmpeg not found at /usr/local/bin/ffmpeg");
} else {
  try {
    const versionOutput = execSync("/usr/local/bin/ffmpeg -version", { encoding: 'utf-8' });
    
    // Check for Evermeet (safe)
    const isEvermeet = versionOutput.includes("tessus") && 
                       versionOutput.includes("https://evermeet.cx/ffmpeg/");
    
    // Check for MacPorts (correct detection)
    const isMacPorts = versionOutput.includes("/opt/local") ||
                       versionOutput.includes("MacPorts") ||
                       versionOutput.includes("mp4v2");
    
    // Only error if NOT Evermeet AND it's MacPorts
    if (!isEvermeet && isMacPorts) {
      issues.push("FFmpeg at /usr/local/bin/ffmpeg appears to be MacPorts version");
    }
    const versionMatch = versionOutput.match(/ffmpeg version (\d+)\./);
    if (!versionMatch || parseInt(versionMatch[1]) < 6) {
      issues.push("FFmpeg version must be ≥ 6.x");
    }
    const libavfilterMatch = versionOutput.match(/libavfilter\s+(\d+)\.(\d+)\.(\d+)/);
    if (!libavfilterMatch || parseInt(libavfilterMatch[1]) < 11) {
      warnings.push("libavfilter version should be ≥ 11.x");
    }
  } catch (e) {
    issues.push("Failed to run /usr/local/bin/ffmpeg");
  }
}

if (process.env.PATH && process.env.PATH.includes("/opt/local")) {
  warnings.push("PATH contains /opt/local (MacPorts)");
}

console.log("");

if (issues.length === 0 && warnings.length === 0) {
  console.log("✅ All checks passed! FFmpeg is correctly configured.");
} else {
  if (issues.length > 0) {
    console.error("❌ CRITICAL ISSUES FOUND:");
    issues.forEach(issue => console.error(`   - ${issue}`));
    console.log("");
  }
  if (warnings.length > 0) {
    console.warn("⚠️  WARNINGS:");
    warnings.forEach(warning => console.warn(`   - ${warning}`));
    console.log("");
  }
  
  console.log("🔧 RECOMMENDED FIXES:");
  if (existsSync("/opt/local/bin/ffmpeg")) {
    console.log("   1. Disable MacPorts FFmpeg:");
    console.log("      sudo mv /opt/local/bin/ffmpeg /opt/local/bin/ffmpeg_backup");
  }
  if (!existsSync("/usr/local/bin/ffmpeg")) {
    console.log("   2. Install FFmpeg:");
    console.log("      npm run install-ffmpeg");
  }
  if (process.env.PATH && process.env.PATH.includes("/opt/local")) {
    console.log("   3. Remove /opt/local from PATH in your shell config (~/.zshrc)");
  }
}

console.log("\n═══════════════════════════════════════════════════════════");

