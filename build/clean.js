const fs = require('fs');
const path = require('path');

const MANIFEST_TYPE = process.env.MANIFEST_TYPE || 'chrome-mv3';

const distDir = MANIFEST_TYPE.endsWith('-mv2') ? 'dist-mv2' : 'dist';

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Remove all contents from dist directory
try {
  const files = fs.readdirSync(distDir);
  for (const file of files) {
    const filePath = path.join(distDir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  }
  console.log(`Cleaned ${distDir} directory`);
} catch (error) {
  console.error(`Error cleaning ${distDir}: ${error}`);
}
