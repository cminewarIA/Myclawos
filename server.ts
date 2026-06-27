import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { exec, execSync } from "child_process";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Unique runtime instance identifier generated on server startup to track hot rebuilds/reloads
const SERVER_INSTANCE_ID = Date.now().toString() + "_" + Math.random().toString(36).substring(2, 9);

app.get("/api/cminewar/system-status", (req, res) => {
  res.json({
    status: "ok",
    instanceId: SERVER_INSTANCE_ID,
    timestamp: Date.now()
  });
});

// CMineWar - Real disk scanner endpoint for bare-metal host compatibility
app.get("/api/cminewar/disks", (req, res) => {
  // En Linux real, listamos los dispositivos de almacenamiento físico por bus
  if (process.platform === "linux") {
    try {
      const output = execSync("lsblk -d -o NAME,SIZE,TYPE,TRAN -r").toString();
      const lines = output.trim().split("\n");
      const disks = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(" ");
        if (parts.length >= 2 && parts[2] === "disk") {
          disks.push({
            name: parts[0],
            size: parts[1] || "Generic",
            type: parts[2],
            transport: parts[3] || "sata"
          });
        }
      }

      if (disks.length > 0) {
        return res.json({ disks });
      }
    } catch (e) {
      console.error("No se pudo escanear discos con lsblk:", e);
    }
  }

  // Fallback a listado de discos representativo compatible con sandbox / container virtual
  res.json({
    disks: [
      { name: "sda", size: "20.0G", type: "disk", transport: "sata" },
      { name: "sdb", size: "128.0G", type: "disk", transport: "usb" },
      { name: "sdc", size: "500.0G", type: "disk", transport: "usb" }
    ]
  });
});

// CMineWar - Start real OS installation background service execution
app.post("/api/cminewar/install", (req, res) => {
  const { disk, omitStandardUser, disableSleep, defaultBrowserChromium } = req.body;

  if (!disk) {
    return res.status(400).json({ error: "Dispositivo de destino requirido." });
  }

  // Prevenir inyección de comandos en parámetros del shell
  const safeDisk = disk.replace(/[^a-zA-Z0-9]/g, "");
  const safeOmitUser = omitStandardUser ? "true" : "false";
  const safeDisableSleep = disableSleep ? "true" : "false";
  const safeBrowser = defaultBrowserChromium ? "true" : "false";

  try {
    // Asegurar que el script tenga permisos de ejecución nativos en Linux
    const scriptPath = path.join(process.cwd(), "bare-metal", "real_install.py");
    if (fs.existsSync(scriptPath)) {
      try {
        fs.chmodSync(scriptPath, "755");
      } catch (e) {
        // En algunos sistemas de archivos FAT32/exFAT de dev esto podría arrojar error benigno
      }
    }

    console.log(`[INSTALADOR] Lanzando instalador físico en Python para: /dev/${safeDisk}`);
    
    // Lanzar el script en Python de fondo y desvincularlo para permitir streaming asíncrono
    const child = exec(`python3 "${scriptPath}" "${safeDisk}" "${safeOmitUser}" "${safeDisableSleep}" "${safeBrowser}"`);
    
    res.json({
      status: "started",
      pid: child.pid,
      message: "Instalación física en segundo plano inicializada."
    });
  } catch (error: any) {
    console.error("Fallo al lanzar script de instalación físico en Python:", error);
    res.status(500).json({ error: `Fallo al lanzar instalador: ${error.message}` });
  }
});

// CMineWar - Telemetry and output log retriever endpoint
app.get("/api/cminewar/install-status", (req, res) => {
  const progressFile = "/tmp/cminewar_install_progress.txt";
  const logFile = "/tmp/cminewar_install_log.txt";

  let progress = "0";
  let logs: string[] = [];

  if (fs.existsSync(progressFile)) {
    progress = fs.readFileSync(progressFile, "utf-8").trim();
  }

  if (fs.existsSync(logFile)) {
    const rawLogs = fs.readFileSync(logFile, "utf-8");
    logs = rawLogs.split("\n").filter(l => l.trim() !== "");
  }

  res.json({
    progress,
    logs
  });
});

// CMineWar Cognitive Central Core Chat Endpoint
app.post("/api/cminewar/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  // Purely native simulated offline engine execution
  const simulatedResponse = getSimulatedCMineWarOSResponse(message);
  return res.json({
    text: simulatedResponse,
    mode: "simulated"
  });
});

// Assistant Simulator fallback responses database
function getSimulatedCMineWarOSResponse(msg: string): string {
  const norm = msg.toLowerCase();
  
  if (norm.includes("hola") || norm.includes("saludos") || norm.includes("buenos días") || norm.includes("buenas tardes")) {
    return "¡Hola, usuario! 👋 Soy **Antigravity Agent Core**, la inteligencia artificial de agente cognitivo central para CMineWar OS y clon interactivo de la Antigravity CLI de Google. Mi conexión a la nube opera en modo fuera de línea temporalmente (sin clave de API activa de pago), pero mis simuladores de Debian y módulos de ayuda están listos para asistirte en este sandbox. ¿Qué comandos del kernel o scripts deseas investigar hoy?";
  }
  if (norm.includes("neofetch") || norm.includes("sistema") || norm.includes("sistema operativo")) {
    return "```\n" +
           "       _/\_        Antigravity Agent CLI x CMineWar OS\n" +
           "     /  o o \\      Kernel: 5.16.0-antigravity-debian-sandbox\n" +
           "    (    \"    )    Uptime: 45 mins\n" +
           "     \\  ---  /     Shell: AntigravityBash v2.4\n" +
           "     /       \\     Sandbox State: remote-sandbox-active\n" +
           "    /  |   |  \\    CPU: Google TPU v5e Quantum Emulator\n" +
           "   (___|___|___)   RAM: 8192MB Virtual Space / 16384MB Host\n" +
           "```\nEste es un entorno de sandbox Linux de Antigravity virtualizado sobre Debian. ¡Puedes interactuar directamente en la Terminal de CMineWar OS ejecutando comandos reales o solicitando tareas de programación avanzadas al agente!";
  }
  if (norm.includes("ayuda") || norm.includes("comandos") || norm.includes("help") || norm.includes("qué puedes hacer")) {
    return "Como el agente cognitivo **Antigravity**, puedo ayudarte a:\n\n" +
           "1. 🐚 **Aprender comandos Linux**: Ejecutar comandos virtuales en mi Terminal como `ls`, `cd`, `cat`, `mkdir`, `top`, `neofetch`, etc.\n" +
           "2. 📂 **Gestionar el explorador de archivos**: El Explorador de archivos visual y la Terminal comparten la misma estructura. Todo archivo o directorio que crees con `mkdir` o `touch` se reflejará en vivo.\n" +
           "3. 📊 **Monitorear el sistema de CMineWar OS**: Observar el consumo simulado de CPU, memoria y rendimiento térmico.\n" +
           "4. 📝 **Modificar archivos**: Usa el Editor de Texto (Text Editor) para editar archivos de texto en tiempo real.\n\n" +
           "*Nota: Para habilitar mi máxima inteligencia dinámica con ejecución real de múltiples pasos y búsquedas activas, recuerda añadir tu `GEMINI_API_KEY` en la configuración original.*";
  }
  if (norm.includes("quién eres") || norm.includes("openclaw") || norm.includes("claw") || norm.includes("cminewar") || norm.includes("antigravity")) {
    return "¡Soy **Antigravity Agent Core**! Específicamente, soy una inteligencia de agente lúdica integrada en este simulador de sistema operativo, clon directo de las capacidades de Antigravity CLI de Google. Estoy entrenada en la resolución autónoma de problemas de código, administración de contenedores de Debian y navegación inteligente por internet. 🛸";
  }
  if (norm.includes("hardware") || norm.includes("temperatura") || norm.includes("falla") || norm.includes("error")) {
    return "🛠️ **Diagnóstico de Sandbox - Antigravity Agent Core**:\n" +
           "- Sensores térmicos: 38°C (Estable y optimizado).\n" +
           "- Contenedor remoto: Activo (remote-sandbox-8291a).\n" +
           "- Canales IPC: Abiertos y listos.\n" +
           "No hay anomalías lógicas detectadas en la virtualización.";
  }
  if (norm.includes("chiste") || norm.includes("broma") || norm.includes("gracioso")) {
    return "Aquí tienes un clásico del kernel de la IA: 😁\n\n*¿Por qué la IA de Antigravity nunca tiene calor?*\n*¡Porque funciona con múltiples hilos ventilados!* 💨🤖\n\nSi quieres otro, solo pídemelo.";
  }
  
  return "Recibido en el socket de Antigravity Agent CLI. He analizado tu comando/pregunta: \"" + msg + "\".\n\nComo el agente está funcionando en **Modo de Sandbox Local Autónomo** (clave API no detectada), sirvo mis respuestas del núcleo de contingencia optimizado. Para habilitar la resolución general autónoma de tareas de software por el Agente de Google con live action steps, ingresa tu clave de API en el panel original del compilador (Secrets > GEMINI_API_KEY). ¡Prueba abriendo la **Terminal** y ejecutando `neofetch`!";
}

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    let distPath = "";
    if (typeof __dirname !== "undefined") {
      if (path.basename(__dirname) === 'dist') {
        distPath = __dirname;
      } else {
        distPath = path.join(__dirname, 'dist');
      }
    } else {
      distPath = path.join(process.cwd(), 'dist');
    }
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CMineWar OS Linux server running on port ${PORT}`);
  });
}

startServer();
