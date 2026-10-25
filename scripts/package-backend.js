const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Packaging backend for production upload...');
const rootDir = path.resolve(__dirname, '..');
const stage = path.join(rootDir, 'backend-stage');
if (fs.existsSync(stage)) fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });

// 1. Create clean production package.json (no devDependencies, no failing preinstall scripts)
const rawPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'backend', 'package.json'), 'utf8'));
const prodPkg = {
  name: rawPkg.name,
  version: rawPkg.version,
  type: rawPkg.type,
  main: "dist/server.js",
  scripts: {
    start: "node dist/server.js"
  },
  dependencies: rawPkg.dependencies
};
fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify(prodPkg, null, 2), 'utf8');

// 2. Add .node-version
fs.writeFileSync(path.join(stage, '.node-version'), '24\n', 'utf8');

// 3. Copy server.js, .env
fs.copyFileSync(path.join(rootDir, 'backend', 'server.js'), path.join(stage, 'server.js'));
fs.copyFileSync(path.join(rootDir, 'backend', '.env.production'), path.join(stage, '.env'));

// 4. Copy dist & prisma
fs.cpSync(path.join(rootDir, 'backend', 'dist'), path.join(stage, 'dist'), { recursive: true });
fs.cpSync(path.join(rootDir, 'backend', 'prisma'), path.join(stage, 'prisma'), { recursive: true });

// 5. Copy pre-generated multi-platform Prisma engine
const localPrisma = path.join(rootDir, 'backend', 'node_modules', '.prisma');
if (fs.existsSync(localPrisma)) {
  const stagePrisma = path.join(stage, 'node_modules', '.prisma');
  fs.mkdirSync(stagePrisma, { recursive: true });
  fs.cpSync(localPrisma, stagePrisma, { recursive: true });
}

// 6. Output paths
const zipFile = path.join(rootDir, 'backend-production.zip');
const tarGzFile = path.join(rootDir, 'backend-production.tar.gz');
const backendZip = path.join(rootDir, 'backend', 'backend-production.zip');
const backendTarGz = path.join(rootDir, 'backend', 'backend-production.tar.gz');

[zipFile, tarGzFile, backendZip, backendTarGz].forEach(f => {
  if (fs.existsSync(f)) fs.unlinkSync(f);
});

// List items in stage without leading '.'
const items = fs.readdirSync(stage).join(' ');
console.log('Archiving items:', items);

// Create archives with clean names (no leading ./)
execSync(`tar.exe -a -c -f "${zipFile}" -C "${stage}" ${items}`, { stdio: 'inherit' });
execSync(`tar.exe -czf "${tarGzFile}" -C "${stage}" ${items}`, { stdio: 'inherit' });

// Also copy to backend/ subfolder so it is visible everywhere
fs.copyFileSync(zipFile, backendZip);
fs.copyFileSync(tarGzFile, backendTarGz);

fs.rmSync(stage, { recursive: true, force: true });

console.log('✅ Created backend-production.zip (' + (fs.statSync(zipFile).size / 1024 / 1024).toFixed(2) + ' MB)');
console.log('Available at:');
console.log('  1. ' + zipFile);
console.log('  2. ' + backendZip);
