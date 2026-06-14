// scripts/build-apk.js
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');

// Get arguments
const buildType = process.argv[2] === 'release' ? 'release' : 'debug';
console.log(`🚀 Starting Android APK compilation [Type: ${buildType.toUpperCase()}]`);

// Detect OS and set correct Gradle executable
const isWindows = process.platform === 'win32';
const gradleCmd = isWindows ? 'gradlew.bat' : './gradlew';
const gradleTask = buildType === 'release' ? 'assembleRelease' : 'assembleDebug';

console.log(`🖥️  Operating System: ${process.platform}`);
console.log(`🛠️  Using wrapper: ${gradleCmd}`);
console.log(`🏃 Running Gradle task: ${gradleTask} inside ${androidDir}\n`);

// Run gradle command
const gradleProcess = spawn(gradleCmd, [gradleTask], {
  cwd: androidDir,
  shell: true,
  stdio: 'inherit'
});

gradleProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Gradle build failed with exit code ${code}.`);
    process.exit(code);
  }

  console.log(`\n✅ Gradle build completed successfully!`);

  // Define standard APK locations
  const apkDir = path.join(androidDir, 'app', 'build', 'outputs', 'apk', buildType);
  
  if (fs.existsSync(apkDir)) {
    const files = fs.readdirSync(apkDir);
    const apkFiles = files.filter(f => f.endsWith('.apk'));
    
    if (apkFiles.length > 0) {
      console.log(`\n📦 Generated APKs:`);
      apkFiles.forEach(file => {
        const fullPath = path.join(apkDir, file);
        console.log(`   - File: ${file}`);
        console.log(`   - Location: ${fullPath}`);
      });
    } else {
      console.log(`\n⚠️  Build succeeded, but no APK files were found in: ${apkDir}`);
    }
  } else {
    console.log(`\n⚠️  Build succeeded, but the output directory does not exist: ${apkDir}`);
  }
});
