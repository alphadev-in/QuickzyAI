const fs = require('fs');
const path = require('path');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  const rootDir = process.cwd();
  const webNextDir = path.join(rootDir, 'web', '.next');
  const rootNextDir = path.join(rootDir, '.next');

  console.log('Synchronizing Next.js build artifacts for Firebase App Hosting...');

  // 1. Copy web/.next to root .next
  copyDirRecursive(webNextDir, rootNextDir);

  // 2. Ensure .next/standalone/.next has the standalone manifests
  const standaloneNested = path.join(webNextDir, 'standalone', 'web', '.next');
  const rootStandaloneNested = path.join(rootNextDir, 'standalone', '.next');
  if (fs.existsSync(standaloneNested)) {
    copyDirRecursive(standaloneNested, rootStandaloneNested);
  }

  // 3. Ensure root .next/static is present for CDN asset hosting
  const webStatic = path.join(webNextDir, 'static');
  const rootStatic = path.join(rootNextDir, 'static');
  if (fs.existsSync(webStatic)) {
    copyDirRecursive(webStatic, rootStatic);
  }

  // 4. Also copy web/public to root public if needed
  const webPublic = path.join(rootDir, 'web', 'public');
  const rootPublic = path.join(rootDir, 'public');
  if (fs.existsSync(webPublic)) {
    copyDirRecursive(webPublic, rootPublic);
  }

  console.log('✓ Successfully synchronized .next, .next/static, and .next/standalone for App Hosting.');
} catch (err) {
  console.error('Error synchronizing App Hosting bundle:', err);
}
