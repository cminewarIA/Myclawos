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
    // Setup adaptive files in anydpi-v26 to ensure proper rendering on Android 8.0+ (API 26+)
    const anyDpiPath = path.join(resPath, 'mipmap-anydpi-v26');
    if (!fs.existsSync(anyDpiPath)) {
      fs.mkdirSync(anyDpiPath, { recursive: true });
    }

    const adaptiveXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>`;

    fs.writeFileSync(path.join(anyDpiPath, 'ic_launcher.xml'), adaptiveXmlContent, 'utf8');
    fs.writeFileSync(path.join(anyDpiPath, 'ic_launcher_round.xml'), adaptiveXmlContent, 'utf8');
    console.log('[ICONS SETUP] Configured adaptive xml files in mipmap-anydpi-v26.');

    // Update background color to dark CMineWar brand color (#020617)
    const valuesPath = path.join(resPath, 'values');
    const bgXmlPath = path.join(valuesPath, 'ic_launcher_background.xml');
    if (fs.existsSync(valuesPath)) {
      const bgXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#020617</color>
</resources>`;
      fs.writeFileSync(bgXmlPath, bgXmlContent, 'utf8');
      console.log('[ICONS SETUP] Updated ic_launcher_background.xml with deep dark color (#020617).');
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
