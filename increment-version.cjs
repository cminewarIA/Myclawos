const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, 'src', 'version.ts');

try {
  if (fs.existsSync(versionFilePath)) {
    const content = fs.readFileSync(versionFilePath, 'utf8');
    
    // Extract BUILD_NUMBER
    const buildMatch = content.match(/BUILD_NUMBER\s*=\s*(\d+)/);
    let buildNum = 10; // default fallback
    if (buildMatch && buildMatch[1]) {
      buildNum = parseInt(buildMatch[1], 10);
    }
    
    // Increment build number
    const newBuildNum = buildNum + 1;
    const newVersion = `1.21.${newBuildNum}`;
    const newTimestamp = new Date().toISOString();
    
    const newContent = `export const VERSION = "${newVersion}";\nexport const BUILD_NUMBER = ${newBuildNum};\nexport const LAST_UPDATED = "${newTimestamp}";\n\n// Proyecto propiedad de Yonah Llanes\n`;
    
    fs.writeFileSync(versionFilePath, newContent, 'utf8');
    console.log(`[VERSION INCREMENT] Successfully updated src/version.ts to Version ${newVersion} (Build ${newBuildNum})`);
  } else {
    // Create it if it doesn't exist
    const initialContent = `export const VERSION = "1.21.11";\nexport const BUILD_NUMBER = 11;\nexport const LAST_UPDATED = "${new Date().toISOString()}";\n\n// Proyecto propiedad de Yonah Llanes\n`;
    fs.writeFileSync(versionFilePath, initialContent, 'utf8');
    console.log(`[VERSION INCREMENT] Created initial src/version.ts with Version 1.21.11`);
  }
} catch (error) {
  console.error('[VERSION INCREMENT] Error updating version file:', error);
}

// Proyecto propiedad de Yonah Llanes

