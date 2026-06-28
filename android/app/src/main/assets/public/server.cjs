var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_child_process = require("child_process");
var import_fs = __toESM(require("fs"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var SERVER_INSTANCE_ID = Date.now().toString() + "_" + Math.random().toString(36).substring(2, 9);
app.get("/api/cminewar/system-status", (req, res) => {
  res.json({
    status: "ok",
    instanceId: SERVER_INSTANCE_ID,
    timestamp: Date.now()
  });
});
app.get("/api/cminewar/disks", (req, res) => {
  if (process.platform === "linux") {
    try {
      const output = (0, import_child_process.execSync)("lsblk -d -o NAME,SIZE,TYPE,TRAN -r").toString();
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
  res.json({
    disks: [
      { name: "sda", size: "20.0G", type: "disk", transport: "sata" },
      { name: "sdb", size: "128.0G", type: "disk", transport: "usb" },
      { name: "sdc", size: "500.0G", type: "disk", transport: "usb" }
    ]
  });
});
app.post("/api/cminewar/install", (req, res) => {
  const { disk, omitStandardUser, disableSleep, defaultBrowserChromium } = req.body;
  if (!disk) {
    return res.status(400).json({ error: "Dispositivo de destino requirido." });
  }
  const safeDisk = disk.replace(/[^a-zA-Z0-9]/g, "");
  const safeOmitUser = omitStandardUser ? "true" : "false";
  const safeDisableSleep = disableSleep ? "true" : "false";
  const safeBrowser = defaultBrowserChromium ? "true" : "false";
  try {
    const scriptPath = import_path.default.join(process.cwd(), "bare-metal", "real_install.py");
    if (import_fs.default.existsSync(scriptPath)) {
      try {
        import_fs.default.chmodSync(scriptPath, "755");
      } catch (e) {
      }
    }
    console.log(`[INSTALADOR] Lanzando instalador f\xEDsico en Python para: /dev/${safeDisk}`);
    const child = (0, import_child_process.exec)(`python3 "${scriptPath}" "${safeDisk}" "${safeOmitUser}" "${safeDisableSleep}" "${safeBrowser}"`);
    res.json({
      status: "started",
      pid: child.pid,
      message: "Instalaci\xF3n f\xEDsica en segundo plano inicializada."
    });
  } catch (error) {
    console.error("Fallo al lanzar script de instalaci\xF3n f\xEDsico en Python:", error);
    res.status(500).json({ error: `Fallo al lanzar instalador: ${error.message}` });
  }
});
app.get("/api/cminewar/install-status", (req, res) => {
  const progressFile = "/tmp/cminewar_install_progress.txt";
  const logFile = "/tmp/cminewar_install_log.txt";
  let progress = "0";
  let logs = [];
  if (import_fs.default.existsSync(progressFile)) {
    progress = import_fs.default.readFileSync(progressFile, "utf-8").trim();
  }
  if (import_fs.default.existsSync(logFile)) {
    const rawLogs = import_fs.default.readFileSync(logFile, "utf-8");
    logs = rawLogs.split("\n").filter((l) => l.trim() !== "");
  }
  res.json({
    progress,
    logs
  });
});
app.post("/api/cminewar/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }
  const simulatedResponse = getSimulatedCMineWarOSResponse(message);
  return res.json({
    text: simulatedResponse,
    mode: "simulated"
  });
});
function getSimulatedCMineWarOSResponse(msg) {
  const norm = msg.toLowerCase();
  if (norm.includes("hola") || norm.includes("saludos") || norm.includes("buenos d\xEDas") || norm.includes("buenas tardes")) {
    return "\xA1Hola, usuario! \u{1F44B} Soy **Antigravity Agent Core**, la inteligencia artificial de agente cognitivo central para CMineWar OS y clon interactivo de la Antigravity CLI de Google. Mi conexi\xF3n a la nube opera en modo fuera de l\xEDnea temporalmente (sin clave de API activa de pago), pero mis simuladores de Debian y m\xF3dulos de ayuda est\xE1n listos para asistirte en este sandbox. \xBFQu\xE9 comandos del kernel o scripts deseas investigar hoy?";
  }
  if (norm.includes("neofetch") || norm.includes("sistema") || norm.includes("sistema operativo")) {
    return '```\n       _/_        Antigravity Agent CLI x CMineWar OS\n     /  o o \\      Kernel: 5.16.0-antigravity-debian-sandbox\n    (    "    )    Uptime: 45 mins\n     \\  ---  /     Shell: AntigravityBash v2.4\n     /       \\     Sandbox State: remote-sandbox-active\n    /  |   |  \\    CPU: Google TPU v5e Quantum Emulator\n   (___|___|___)   RAM: 8192MB Virtual Space / 16384MB Host\n```\nEste es un entorno de sandbox Linux de Antigravity virtualizado sobre Debian. \xA1Puedes interactuar directamente en la Terminal de CMineWar OS ejecutando comandos reales o solicitando tareas de programaci\xF3n avanzadas al agente!';
  }
  if (norm.includes("ayuda") || norm.includes("comandos") || norm.includes("help") || norm.includes("qu\xE9 puedes hacer")) {
    return "Como el agente cognitivo **Antigravity**, puedo ayudarte a:\n\n1. \u{1F41A} **Aprender comandos Linux**: Ejecutar comandos virtuales en mi Terminal como `ls`, `cd`, `cat`, `mkdir`, `top`, `neofetch`, etc.\n2. \u{1F4C2} **Gestionar el explorador de archivos**: El Explorador de archivos visual y la Terminal comparten la misma estructura. Todo archivo o directorio que crees con `mkdir` o `touch` se reflejar\xE1 en vivo.\n3. \u{1F4CA} **Monitorear el sistema de CMineWar OS**: Observar el consumo simulado de CPU, memoria y rendimiento t\xE9rmico.\n4. \u{1F4DD} **Modificar archivos**: Usa el Editor de Texto (Text Editor) para editar archivos de texto en tiempo real.\n\n*Nota: Para habilitar mi m\xE1xima inteligencia din\xE1mica con ejecuci\xF3n real de m\xFAltiples pasos y b\xFAsquedas activas, recuerda a\xF1adir tu `GEMINI_API_KEY` en la configuraci\xF3n original.*";
  }
  if (norm.includes("qui\xE9n eres") || norm.includes("openclaw") || norm.includes("claw") || norm.includes("cminewar") || norm.includes("antigravity")) {
    return "\xA1Soy **Antigravity Agent Core**! Espec\xEDficamente, soy una inteligencia de agente l\xFAdica integrada en este simulador de sistema operativo, clon directo de las capacidades de Antigravity CLI de Google. Estoy entrenada en la resoluci\xF3n aut\xF3noma de problemas de c\xF3digo, administraci\xF3n de contenedores de Debian y navegaci\xF3n inteligente por internet. \u{1F6F8}";
  }
  if (norm.includes("hardware") || norm.includes("temperatura") || norm.includes("falla") || norm.includes("error")) {
    return "\u{1F6E0}\uFE0F **Diagn\xF3stico de Sandbox - Antigravity Agent Core**:\n- Sensores t\xE9rmicos: 38\xB0C (Estable y optimizado).\n- Contenedor remoto: Activo (remote-sandbox-8291a).\n- Canales IPC: Abiertos y listos.\nNo hay anomal\xEDas l\xF3gicas detectadas en la virtualizaci\xF3n.";
  }
  if (norm.includes("chiste") || norm.includes("broma") || norm.includes("gracioso")) {
    return "Aqu\xED tienes un cl\xE1sico del kernel de la IA: \u{1F601}\n\n*\xBFPor qu\xE9 la IA de Antigravity nunca tiene calor?*\n*\xA1Porque funciona con m\xFAltiples hilos ventilados!* \u{1F4A8}\u{1F916}\n\nSi quieres otro, solo p\xEDdemelo.";
  }
  return 'Recibido en el socket de Antigravity Agent CLI. He analizado tu comando/pregunta: "' + msg + '".\n\nComo el agente est\xE1 funcionando en **Modo de Sandbox Local Aut\xF3nomo** (clave API no detectada), sirvo mis respuestas del n\xFAcleo de contingencia optimizado. Para habilitar la resoluci\xF3n general aut\xF3noma de tareas de software por el Agente de Google con live action steps, ingresa tu clave de API en el panel original del compilador (Secrets > GEMINI_API_KEY). \xA1Prueba abriendo la **Terminal** y ejecutando `neofetch`!';
}
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    let distPath = "";
    if (typeof __dirname !== "undefined") {
      if (import_path.default.basename(__dirname) === "dist") {
        distPath = __dirname;
      } else {
        distPath = import_path.default.join(__dirname, "dist");
      }
    } else {
      distPath = import_path.default.join(process.cwd(), "dist");
    }
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CMineWar OS Linux server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
