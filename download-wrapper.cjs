const fs = require('fs');
const path = require('path');
const https = require('https');

const TARGET_DIR = path.join(__dirname, 'android', 'gradle', 'wrapper');
const TARGET_FILE = path.join(TARGET_DIR, 'gradle-wrapper.jar');

const URLS = [
  'https://raw.githubusercontent.com/spring-projects/spring-boot/main/gradle/wrapper/gradle-wrapper.jar',
  'https://raw.githubusercontent.com/spring-projects/spring-framework/main/gradle/wrapper/gradle-wrapper.jar',
  'https://raw.githubusercontent.com/liutikas/gradle-wrappers/master/gradle-wrappers/8.5.0/gradle/wrapper/gradle-wrapper.jar',
  'https://raw.githubusercontent.com/liutikas/gradle-wrappers/master/gradle-wrappers/8.12.0/gradle/wrapper/gradle-wrapper.jar'
];

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Handle redirect
        download(res.headers.location).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Status code: ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('[+] Iniciando descarga de gradle-wrapper.jar limpio...');
  
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  // Remove current corrupted jar if exists
  if (fs.existsSync(TARGET_FILE)) {
    try {
      fs.unlinkSync(TARGET_FILE);
    } catch (e) {}
  }

  let success = false;
  for (const url of URLS) {
    try {
      console.log(`[+] Intentando descargar desde: ${url}`);
      const data = await download(url);
      
      // Validar firma ZIP (PK..) y tamaño mínimo (>45KB)
      if (data.length > 45000 && data[0] === 0x50 && data[1] === 0x4B) {
        fs.writeFileSync(TARGET_FILE, data);
        console.log(`[✓] Descarga exitosa! Guardado en: ${TARGET_FILE} (${data.length} bytes)`);
        success = true;
        break;
      } else {
        console.log(`[-] El archivo de ${url} no parece un jar de Gradle válido (firma incorrecta o tamaño menor a 45KB).`);
      }
    } catch (err) {
      console.log(`[-] Error al descargar desde ${url}: ${err.message}`);
    }
  }

  if (!success) {
    console.error('[❌] No se pudo descargar un gradle-wrapper.jar válido de ninguna fuente.');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
