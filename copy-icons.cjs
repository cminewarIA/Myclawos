const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'assets', 'logo.png');
const fallbackLogoPath = path.join(__dirname, 'public', 'assets', 'branding', 'logo.png');
const resPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

let selectedLogo = null;
if (fs.existsSync(logoPath)) {
  selectedLogo = logoPath;
} else if (fs.existsSync(fallbackLogoPath)) {
  selectedLogo = fallbackLogoPath;
}

if (!selectedLogo) {
  console.warn('[ICONS SETUP] Warning: CMineWar logo not found at assets/logo.png or public/assets/branding/logo.png!');
  process.exit(0);
}

console.log(`[ICONS SETUP] Using logo from: ${selectedLogo}`);

try {
  if (fs.existsSync(resPath)) {
    // Delete adaptive files from anydpi
    const anyDpiPath = path.join(resPath, 'mipmap-anydpi-v26');
    if (fs.existsSync(anyDpiPath)) {
      const anyDpiFiles = ['ic_launcher.xml', 'ic_launcher_round.xml', 'ic_launcher_background.xml'];
      anyDpiFiles.forEach(file => {
        const filePath = path.join(anyDpiPath, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[ICONS SETUP] Deleted adaptive XML file: ${file}`);
        }
      });
    }

    // Process all mipmap directories
    const files = fs.readdirSync(resPath);
    files.forEach(file => {
      const fullPath = path.join(resPath, file);
      const isDir = fs.statSync(fullPath).isDirectory();
      if (isDir && file.startsWith('mipmap-') && !file.includes('anydpi')) {
        console.log(`[ICONS SETUP] Copying icons to: ${file}`);
        fs.copyFileSync(selectedLogo, path.join(fullPath, 'ic_launcher.png'));
        fs.copyFileSync(selectedLogo, path.join(fullPath, 'ic_launcher_round.png'));
        fs.copyFileSync(selectedLogo, path.join(fullPath, 'ic_launcher_foreground.png'));
      }
    });
    console.log('[ICONS SETUP] Launcher icons successfully updated in all mipmap folders.');
  } else {
    console.log('[ICONS SETUP] Note: Android res path does not exist locally. Skipping Android launcher icon sync.');
  }
} catch (error) {
  console.error('[ICONS SETUP] Error updating launcher icons:', error);
}
