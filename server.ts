import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { exec, execSync, execFileSync, spawn } from "child_process";
import fs from "fs";
import os from "os";
import { rateLimit } from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable standard rate limiter to prevent DOS / abuse across all paths
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones desde esta IP. Inténtelo de nuevo más tarde." }
});

// Enable tighter rate limiter specifically for API endpoints
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones al API. Inténtelo más tarde." }
});

app.use(globalLimiter);
app.use("/api/", apiLimiter);

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

// GET /api/cminewar/system-metrics - Real host telemetry (real Debian desktop integration)
app.get("/api/cminewar/system-metrics", (req, res) => {
  const isLinux = process.platform === "linux";
  let isRealHost = false;
  
  // 1. Get real memory metrics
  let totalMem = os.totalmem();
  let freeMem = os.freemem();
  let cachedMem = 0;
  
  if (isLinux) {
    try {
      if (fs.existsSync("/proc/meminfo")) {
        const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
        const matchCached = meminfo.match(/^Cached:\s+(\d+)\s+kB/m);
        const matchBuffers = meminfo.match(/^Buffers:\s+(\d+)\s+kB/m);
        
        const cachedKb = matchCached ? parseInt(matchCached[1], 10) : 0;
        const buffersKb = matchBuffers ? parseInt(matchBuffers[1], 10) : 0;
        
        cachedMem = (cachedKb + buffersKb) * 1024; // convert to bytes
        isRealHost = true;
      }
    } catch (e) {
      console.error("Error leyendo /proc/meminfo:", e);
    }
  }
  
  const usedMem = totalMem - freeMem - cachedMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);

  // 2. Get CPU Load
  let cpuPercent = 10; // Default fallback
  const loadAvg = os.loadavg();
  if (loadAvg && loadAvg.length > 0) {
    // scale load average to CPU core count
    const cores = os.cpus().length || 1;
    cpuPercent = Math.min(Math.round((loadAvg[0] / cores) * 100), 100);
    if (cpuPercent <= 0) cpuPercent = 5; // minimum representation
  }

  // 3. Get CPU temperature (Real on Linux Raspberry Pi, PC thermal zone, etc)
  let temperature = 41; // Default fallback
  if (isLinux) {
    try {
      const thermalPaths = [
        "/sys/class/thermal/thermal_zone0/temp",
        "/sys/class/thermal/thermal_zone1/temp",
        "/sys/devices/virtual/thermal/thermal_zone0/temp"
      ];
      for (const p of thermalPaths) {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, "utf8").trim();
          const parsed = parseInt(raw, 10);
          if (!isNaN(parsed)) {
            temperature = Math.round(parsed / 1000);
            break;
          }
        }
      }
    } catch (e) {
      // benign
    }
  }

  // 4. Get active processes from actual Linux/Unix host using ps
  let processes: any[] = [];
  if (isLinux || process.platform === "darwin") {
    try {
      const output = execFileSync("ps", ["-eo", "pid,comm,%cpu,%mem", "--sort=-%cpu"]).toString();
      const lines = output.trim().split("\n").slice(0, 12);
      // Ignore header line
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].trim().split(/\s+/);
        if (parts.length >= 4) {
          const pid = parseInt(parts[0], 10);
          const name = parts[1];
          const cpu = parseFloat(parts[2]);
          const mem = parseFloat(parts[3]);
          const ramMB = Math.round((mem / 100) * (totalMem / 1024 / 1024));
          
          processes.push({
            pid,
            name,
            cpu: isNaN(cpu) ? 0.1 : cpu,
            ram: isNaN(ramMB) ? 15 : ramMB,
            status: "running"
          });
        }
      }
    } catch (e) {
      // fallback handled below
    }
  }

  // If we couldn't fetch real processes or are on non-unix, supply clean live metrics
  if (processes.length === 0) {
    processes = [
      { pid: 1, name: "systemd", cpu: 0, ram: 15, status: "sleeping" },
      { pid: 42, name: "antigravity-kernel-core", cpu: 3.2, ram: 420, status: "running" },
      { pid: 50, name: "antigravitybash-shell", cpu: 0.1, ram: 22, status: "running" },
      { pid: 210, name: "network-analyzer-daemon", cpu: 1.8, ram: 85, status: "running" },
      { pid: 301, name: "tmux-server", cpu: 1.2, ram: 45, status: "running" },
      { pid: 405, name: "google-gemini-channel", cpu: 0.1, ram: 310, status: "running" }
    ];
  }

  // 5. Check real systemd services status
  let services = [
    { id: "cminewar-service", name: "CMineWar OS Cognitive Daemon", description: "Enlace inteligente con el LLM y servidor Express", status: "active" },
    { id: "nginx", name: "Servidor Web Nginx (Proxy Inverso)", description: "Servidor de puertos HTTP públicos", status: "inactive" },
    { id: "ssh", name: "Servidor SSH (Secure Shell Daemon)", description: "Acceso remoto seguro de terminal", status: "inactive" },
    { id: "network-manager", name: "Network Manager", description: "Gestor principal de interfaces y WiFi", status: "inactive" }
  ];

  if (isLinux) {
    services = services.map(srv => {
      try {
        const sysSrvName = srv.id === "cminewar-service" ? "cminewar" : srv.id;
        let state = "inactive";
        try {
          state = execFileSync("systemctl", ["is-active", sysSrvName], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
        } catch (err: any) {
          if (err && err.stdout) {
            state = err.stdout.toString().trim();
          }
        }
        return {
          ...srv,
          status: state === "active" ? "active" : "inactive"
        };
      } catch (e) {
        return srv;
      }
    });
  }

  // 6. Check real Firewall (iptables status)
  let isFirewallActive = false;
  if (isLinux) {
    try {
      const output = execFileSync("iptables", ["-S", "OUTPUT"], { stdio: ["ignore", "pipe", "ignore"] }).toString();
      isFirewallActive = output.includes("-P OUTPUT DROP");
    } catch (e) {
      // benign
    }
  }

  res.json({
    cpu: cpuPercent,
    memory: {
      total: Math.round(totalMem / 1024 / 1024), // MB
      used: Math.round(usedMem / 1024 / 1024), // MB
      free: Math.round(freeMem / 1024 / 1024), // MB
      cached: Math.round(cachedMem / 1024 / 1024), // MB
      percent: memPercent
    },
    uptime: Math.round(os.uptime()),
    temperature,
    processes,
    services,
    firewallActive: isFirewallActive,
    isRealHost,
    platform: process.platform,
    hostname: os.hostname(),
    arch: os.arch()
  });
});

// POST /api/cminewar/firewall/toggle - Real iptables block/allow trigger
app.post("/api/cminewar/firewall/toggle", (req, res) => {
  const { action } = req.body; // "block" or "allow"
  if (action !== "block" && action !== "allow") {
    return res.status(400).json({ error: "Acción requerida: block o allow" });
  }

  if (process.platform !== "linux") {
    return res.json({
      success: true,
      simulated: true,
      message: `Simulado: Cortafuegos cambiado a modo ${action.toUpperCase()}`
    });
  }

  try {
    const cmd = action === "block" ? "cminewar-firewall block" : "cminewar-firewall allow";
    console.log(`[CORTAFUEGOS] Ejecutando: ${cmd}`);
    execSync(`sudo ${cmd}`);
    res.json({
      success: true,
      message: `Cortafuegos físico ${action === "block" ? "ACTIVADO" : "DESACTIVADO"} con éxito en el host.`
    });
  } catch (error: any) {
    console.error("Error controlando cortafuegos con iptables:", error);
    res.status(500).json({ error: `Fallo al ejecutar cortafuegos: ${error.message}. ¿Tiene permisos de sudo sin contraseña?` });
  }
});

// POST /api/cminewar/services/control - Control real systemd services
app.post("/api/cminewar/services/control", (req, res) => {
  const { serviceId, action } = req.body; // action: "start" or "stop" or "restart"
  if (!serviceId || !action) {
    return res.status(400).json({ error: "Faltan parámetros: serviceId y action" });
  }

  if (process.platform !== "linux") {
    return res.json({
      success: true,
      simulated: true,
      message: `Simulado: Servicio ${serviceId} cambiado con acción ${action.toUpperCase()}`
    });
  }

  try {
    const sysSrvName = serviceId === "cminewar-service" ? "cminewar" : serviceId;
    const cmd = `sudo systemctl ${action} ${sysSrvName}`;
    console.log(`[SISTEMA] Ejecutando control de servicio: ${cmd}`);
    execSync(cmd);
    res.json({
      success: true,
      message: `Acción ${action.toUpperCase()} aplicada al servicio ${serviceId} con éxito.`
    });
  } catch (error: any) {
    console.error(`Error controlando servicio ${serviceId}:`, error);
    res.status(500).json({ error: `Fallo de systemd: ${error.message}` });
  }
});

// POST /api/cminewar/system/power - Real power control for hosts (Reboot / Shutdown)
app.post("/api/cminewar/system/power", (req, res) => {
  const { action } = req.body; // "reboot" or "shutdown"
  if (action !== "reboot" && action !== "shutdown") {
    return res.status(400).json({ error: "Acción requerida: reboot o shutdown" });
  }

  if (process.platform !== "linux") {
    return res.json({
      success: true,
      simulated: true,
      message: `Simulado: Orden de ${action.toUpperCase()} enviada al sistema.`
    });
  }

  try {
    const cmd = action === "reboot" ? "sudo reboot" : "sudo shutdown -h now";
    console.log(`[ALIMENTACION] Lanzando comando físico: ${cmd}`);
    // Lanzar de forma asíncrona para que de tiempo a responder la API
    exec(cmd);
    res.json({
      success: true,
      message: `Orden de ${action.toUpperCase()} transmitida con éxito al kernel.`
    });
  } catch (error: any) {
    res.status(500).json({ error: `Fallo de alimentación: ${error.message}` });
  }
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

    // Limpiar o inicializar archivos de estado de instalación
    try {
      fs.writeFileSync("/tmp/cminewar_install_progress.txt", "0");
      fs.writeFileSync("/tmp/cminewar_install_log.txt", "[+] Inicializando instalador físico de CMineWar OS...\n");
    } catch (err) {
      console.error("No se pudieron inicializar los archivos de log:", err);
    }

    console.log(`[INSTALADOR] Lanzando instalador físico en Python para: /dev/${safeDisk}`);
    
    // Lanzar el script en Python de fondo de forma desvinculada
    const child = exec(`python3 -u "${scriptPath}" "${safeDisk}" "${safeOmitUser}" "${safeDisableSleep}" "${safeBrowser}"`);
    
    // Capturar y escribir en tiempo real la salida en el archivo de log para evitar conflictos de redirección de shell
    child.stdout?.on("data", (data) => {
      try {
        fs.appendFileSync("/tmp/cminewar_install_log.txt", data);
      } catch (e) {
        console.error("Error escribiendo en log:", e);
      }
    });

    child.stderr?.on("data", (data) => {
      try {
        fs.appendFileSync("/tmp/cminewar_install_log.txt", data);
      } catch (e) {
        console.error("Error escribiendo en log de error:", e);
      }
    });
    
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
