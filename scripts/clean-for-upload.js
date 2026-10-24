const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- Cleaning up temporary dev & cache from .next ---');
const devDir = path.join(__dirname, '..', '.next', 'dev');
const cacheDir = path.join(__dirname, '..', '.next', 'cache');

if (fs.existsSync(devDir)) {
  console.log('Removing .next/dev (saves ~3GB)...');
  fs.rmSync(devDir, { recursive: true, force: true });
}

if (fs.existsSync(cacheDir)) {
  console.log('Removing .next/cache (saves ~180MB)...');
  fs.rmSync(cacheDir, { recursive: true, force: true });
}

console.log('Done! Your .next folder is now clean, lightweight (~45 MB), and ready for production upload.');
