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

  // 2. Setup root .next/standalone
  const rootStandaloneDir = path.join(rootNextDir, 'standalone');
  const webStandaloneDir = path.join(webNextDir, 'standalone');
  const webStandaloneInner = path.join(webStandaloneDir, 'web');

  if (fs.existsSync(webStandaloneDir)) {
    // Copy node_modules from web/.next/standalone into root .next/standalone
    copyDirRecursive(webStandaloneDir, rootStandaloneDir);

    // In a monorepo workspace, Next outputs server.js and .next inside standalone/web/
    // Copy all files from standalone/web directly into standalone/ so /workspace/.next/standalone/server.js exists!
    if (fs.existsSync(webStandaloneInner)) {
      copyDirRecursive(webStandaloneInner, rootStandaloneDir);
    }
  }

  // 3. Ensure root .next/static is present for CDN asset hosting
  const webStatic = path.join(webNextDir, 'static');
  const rootStatic = path.join(rootNextDir, 'static');
  if (fs.existsSync(webStatic)) {
    copyDirRecursive(webStatic, rootStatic);
  }

  // Also copy static into .next/standalone/.next/static as required by Next standalone server
  const standaloneStatic = path.join(rootStandaloneDir, '.next', 'static');
  if (fs.existsSync(webStatic)) {
    copyDirRecursive(webStatic, standaloneStatic);
  }

  // 4. Also copy web/public to root public and standalone/public
  const webPublic = path.join(rootDir, 'web', 'public');
  const rootPublic = path.join(rootDir, 'public');
  const standalonePublic = path.join(rootStandaloneDir, 'public');
  if (fs.existsSync(webPublic)) {
    copyDirRecursive(webPublic, rootPublic);
    copyDirRecursive(webPublic, standalonePublic);
  }

  console.log('✓ Successfully populated /workspace/.next/standalone/server.js and assets for App Hosting.');
} catch (err) {
  console.error('Error synchronizing App Hosting bundle:', err);
}
