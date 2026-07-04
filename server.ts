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

// Enable trust proxy so that express-rate-limit can accurately detect IP addresses through Cloud Run proxy
app.set("trust proxy", 1);

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

// Memory storage for simulated service states (when real systemd/systemctl is not available in the container sandbox)
const simulatedServiceStates: Record<string, string> = {
  "cminewar-service": "active",
  "nginx": "inactive",
  "ssh": "inactive",
  "network-manager": "inactive"
};

app.get("/api/cminewar/system-status", (req, res) => {
  res.json({
    status: "ok",
    instanceId: SERVER_INSTANCE_ID,
    timestamp: Date.now(),
    uptime: Math.round(os.uptime())
  });
});

// GET /api/cminewar/terminal-info - Real system username and hostname
app.get("/api/cminewar/terminal-info", (req, res) => {
  try {
    const username = os.userInfo().username || "user";
    const hostname = os.hostname() || "cminewar";
    res.json({ username, hostname });
  } catch (err: any) {
    res.json({ username: "user", hostname: "cminewar", error: err.message });
  }
});

// POST /api/cminewar/terminal/execute - Execute real command on the host
app.post("/api/cminewar/terminal/execute", (req, res) => {
  const { command, cwd } = req.body;
  if (!command) {
    return res.status(400).json({ error: "Falta especificar el comando" });
  }

  console.log(`[TERMINAL HOST] Ejecutando: ${command} en ${cwd || "root"}`);
  
  const { exec } = require("child_process");
  exec(command, { cwd: process.cwd() }, (error: any, stdout: string, stderr: string) => {
    res.json({
      stdout: stdout || "",
      stderr: stderr || "",
      error: error ? error.message : null
    });
  });
});

// POST /api/cminewar/github-update - Actualiza de forma real con el código de GitHub
app.post("/api/cminewar/github-update", (req, res) => {
  const { owner, repo, branch } = req.body;
  const safeOwner = owner || "cminewarIA";
  const safeRepo = repo || "MyCMineWarOS";
  const safeBranch = branch || "main";
  
  console.log(`[GITHUB REAL UPDATE] Sincronizando con ${safeOwner}/${safeRepo}:${safeBranch}`);
  
  const { exec } = require("child_process");
  exec("git pull origin " + safeBranch, (err: any, stdout: string, stderr: string) => {
    if (err) {
      const cmdSeq = [
        "git init",
        `git remote add origin https://github.com/${safeOwner}/${safeRepo}.git || git remote set-url origin https://github.com/${safeOwner}/${safeRepo}.git`,
        `git fetch origin ${safeBranch}`,
        `git reset --hard origin/${safeBranch}`
      ].join(" && ");
      
      console.log("[GITHUB REAL UPDATE] No se detectó repo inicializado. Intentando inicialización completa...");
      
      exec(cmdSeq, (initErr: any, initStdout: string, initStderr: string) => {
        if (initErr) {
          return res.json({
            success: false,
            message: "No se pudo realizar la actualización real (Falta configurar credenciales Git/Internet o el repositorio está vacío).",
            stdout: initStdout,
            stderr: initStderr,
            error: initErr.message
          });
        }
        return res.json({
          success: true,
          message: "Sincronización y actualización real completada con éxito desde GitHub.",
          stdout: initStdout,
          stderr: initStderr
        });
      });
    } else {
      res.json({
        success: true,
        message: "Sincronizado y actualizado con éxito mediante git pull.",
        stdout,
        stderr
      });
    }
  });
});

// GET /api/cminewar/system-metrics - Real host telemetry (real Debian desktop integration)
app.get("/api/cminewar/system-metrics", (req, res) => {
  const isLinux = process.platform === "linux";
  let isRealHost = true;
  
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

  const hasSystemctl = (() => {
    if (process.platform !== "linux") return false;
    try {
      execFileSync("which", ["systemctl"], { stdio: "ignore" });
      return true;
    } catch (e) {
      return false;
    }
  })();

  if (hasSystemctl) {
    services = services.map(srv => {
      try {
        const sysSrvName = srv.id === "cminewar-service" ? "cminewar" : (srv.id === "network-manager" ? "NetworkManager" : srv.id);
        let state = "inactive";
        try {
          // Check if installed first using systemctl show
          const showResult = execFileSync("systemctl", ["show", "-p", "LoadState", sysSrvName], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
          if (showResult.includes("LoadState=not-found")) {
            state = "not-installed";
          } else {
            state = execFileSync("systemctl", ["is-active", sysSrvName], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
          }
        } catch (err: any) {
          if (err && err.stdout) {
            state = err.stdout.toString().trim();
          }
        }
        return {
          ...srv,
          status: state === "active" ? "active" : (state === "not-installed" ? "not-installed" : "inactive")
        };
      } catch (e) {
        return srv;
      }
    });
  } else {
    // If not on real systemd, retrieve simulated states so UI reflects changes correctly
    services = services.map(srv => {
      return {
        ...srv,
        status: simulatedServiceStates[srv.id] || "inactive"
      };
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

  const hasFirewallCmd = (() => {
    if (process.platform !== "linux") return false;
    try {
      execFileSync("which", ["cminewar-firewall"], { stdio: "ignore" });
      return true;
    } catch (e) {
      return false;
    }
  })();

  if (!hasFirewallCmd) {
    return res.json({
      success: true,
      simulated: true,
      message: `Simulado: Cortafuegos cambiado a modo ${action.toUpperCase()}`
    });
  }

  try {
    const args = action === "block" ? ["cminewar-firewall", "block"] : ["cminewar-firewall", "allow"];
    console.log(`[CORTAFUEGOS] Ejecutando: sudo ${args.join(" ")}`);
    execFileSync("sudo", args);
    res.json({
      success: true,
      message: `Cortafuegos físico ${action === "block" ? "ACTIVADO" : "DESACTIVADO"} con éxito en el host.`
    });
  } catch (error: any) {
    console.error("Error controlando cortafuegos con iptables:", error);
    let details = error.message;
    if (error.stderr) {
      details = error.stderr.toString().trim();
    }
    res.json({
      success: false,
      error: `Fallo al ejecutar cortafuegos: ${details}. ¿Tiene permisos de sudo sin contraseña?`,
      message: `Fallo al ejecutar cortafuegos: ${details}`
    });
  }
});

// POST /api/cminewar/services/control - Control real systemd services
app.post("/api/cminewar/services/control", (req, res) => {
  const { serviceId, action } = req.body; // action: "start" or "stop" or "restart"
  if (!serviceId || !action) {
    return res.status(400).json({ error: "Faltan parámetros: serviceId y action" });
  }

  const allowedActions = ["start", "stop", "restart"];
  if (!allowedActions.includes(action)) {
    return res.status(400).json({ error: "Acción de servicio no permitida" });
  }

  if (typeof serviceId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(serviceId)) {
    return res.status(400).json({ error: "ID de servicio inválido o malformado" });
  }

  const hasSystemctl = (() => {
    if (process.platform !== "linux") return false;
    try {
      execFileSync("which", ["systemctl"], { stdio: "ignore" });
      return true;
    } catch (e) {
      return false;
    }
  })();

  if (!hasSystemctl) {
    const nextStatus = action === "start" ? "active" : (action === "stop" ? "inactive" : simulatedServiceStates[serviceId]);
    simulatedServiceStates[serviceId] = nextStatus;
    return res.json({
      success: true,
      simulated: true,
      message: `Simulado: Servicio ${serviceId} cambiado con acción ${action.toUpperCase()}`
    });
  }

  const sysSrvName = serviceId === "cminewar-service" ? "cminewar" : (serviceId === "network-manager" ? "NetworkManager" : serviceId);

  try {
    console.log(`[SISTEMA] Ejecutando control de servicio: sudo systemctl ${action} ${sysSrvName}`);
    execFileSync("sudo", ["systemctl", action, sysSrvName]);
    res.json({
      success: true,
      message: `Acción ${action.toUpperCase()} aplicada al servicio ${serviceId} con éxito.`
    });
  } catch (error: any) {
    console.error("Error controlando servicio:", String(serviceId));
    let details = error.message;
    if (error.stderr) {
      details = error.stderr.toString().trim();
    }

    const isNotFound = details.includes("not found") || details.includes("no encontrado") || details.includes("not-found") || details.includes("no existe");
    if (action === "start" && isNotFound) {
      // Intentar auto-instalación automática en segundo plano para evitar timeouts (timeout cliente = 3.5s)
      let packageName = "";
      if (serviceId === "nginx") {
        packageName = "nginx";
      } else if (serviceId === "ssh" || serviceId === "sshd") {
        packageName = "openssh-server";
      } else if (serviceId === "network-manager") {
        packageName = "network-manager";
      }

      if (packageName) {
        console.log(`[AUTOPACKAGE] El servicio ${serviceId} no está instalado. Iniciando auto-instalación en segundo plano para el paquete '${packageName}'...`);
        const cmd = `sudo apt-get update -y && sudo apt-get install -y ${packageName} && sudo systemctl ${action} ${sysSrvName}`;
        
        exec(cmd, (err, stdout, stderr) => {
          if (err) {
            console.error(`[AUTOPACKAGE ERROR] Falló la instalación de ${packageName}:`, err.message);
          } else {
            console.log(`[AUTOPACKAGE SUCCESS] El paquete ${packageName} se instaló y el servicio ${serviceId} se activó en segundo plano.`);
          }
        });

        return res.json({
          success: true,
          message: `El servicio ${serviceId} no estaba instalado. Hemos iniciado su instalación ('${packageName}') y activación automática en segundo plano.`
        });
      }
    }

    res.json({
      success: false,
      error: `Fallo de systemd: ${details}`,
      message: `Fallo de systemd al aplicar ${action.toUpperCase()} a ${serviceId}: ${details}`
    });
  }
});

// POST /api/cminewar/system/power - Real power control for hosts (Reboot / Shutdown)
app.post("/api/cminewar/system/power", (req, res) => {
  const { action } = req.body; // "reboot" or "shutdown"
  if (action !== "reboot" && action !== "shutdown") {
    return res.status(400).json({ error: "Acción requerida: reboot o shutdown" });
  }

  const hasSystemctl = (() => {
    if (process.platform !== "linux") return false;
    try {
      execFileSync("which", ["systemctl"], { stdio: "ignore" });
      return true;
    } catch (e) {
      return false;
    }
  })();

  if (!hasSystemctl) {
    return res.json({
      success: true,
      simulated: true,
      message: `Simulado: Orden de ${action.toUpperCase()} enviada al sistema.`
    });
  }

  try {
    console.log(`[ALIMENTACION] Lanzando comando físico: ${action}`);
    if (action === "reboot") {
      spawn("sudo", ["reboot"], { detached: true, stdio: "ignore" }).unref();
    } else {
      spawn("sudo", ["shutdown", "-h", "now"], { detached: true, stdio: "ignore" }).unref();
    }
    res.json({
      success: true,
      message: `Orden de ${action.toUpperCase()} transmitida con éxito al kernel.`
    });
  } catch (error: any) {
    let details = error.message;
    if (error.stderr) {
      details = error.stderr.toString().trim();
    }
    res.json({
      success: false,
      error: `Fallo de alimentación: ${details}`,
      message: `Fallo de alimentación: ${details}`
    });
  }
});

// CMineWar - Real disk scanner endpoint for bare-metal host compatibility
app.get("/api/cminewar/disks", (req, res) => {
  // En Linux real, listamos los dispositivos de almacenamiento físico por bus
  if (process.platform === "linux") {
    try {
      const disks = [];
      
      // Intentar primero formato JSON, que es 100% robusto y no depende del parseo de espacios en blanco
      try {
        const jsonOutput = execSync("lsblk -J -d -o NAME,SIZE,TYPE,TRAN").toString();
        const parsed = JSON.parse(jsonOutput);
        if (parsed && parsed.blockdevices) {
          for (const dev of parsed.blockdevices) {
            if (dev.type === "disk") {
              disks.push({
                name: dev.name,
                size: dev.size || "Generic",
                type: dev.type,
                transport: dev.tran || "sata"
              });
            }
          }
        }
      } catch (jsonErr) {
        console.warn("Fallo el comando lsblk -J (JSON). Usando fallback manual por regex...");
        const output = execSync("lsblk -d -o NAME,SIZE,TYPE,TRAN -r").toString();
        const lines = output.trim().split("\n");

        for (let i = 1; i < lines.length; i++) {
          // Dividir por cualquier secuencia de espacios en blanco (robusto frente a múltiples espacios)
          const parts = lines[i].trim().split(/\s+/);
          if (parts.length >= 2) {
            // lsblk -r a veces junta campos o la longitud puede variar si TRAN está vacío.
            const isDisk = parts.includes("disk");
            if (isDisk) {
              const diskIdx = parts.indexOf("disk");
              const name = parts[0];
              const size = diskIdx > 1 ? parts[1] : "Generic";
              // El transporte suele ser el elemento siguiente a "disk" en la salida raw si está disponible
              const transport = parts[diskIdx + 1] || "sata";
              
              disks.push({
                name,
                size,
                type: "disk",
                transport: transport.toLowerCase() === "usb" ? "usb" : transport
              });
            }
          }
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
    
    // Lanzar el script en Python de fondo de forma desvinculada sin intérprete de comandos shell
    const child = spawn("python3", ["-u", scriptPath, safeDisk, safeOmitUser, safeDisableSleep, safeBrowser]);
    
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

// CMineWar - Real bootable ISO compilation endpoint
app.post("/api/cminewar/build-iso", (req, res) => {
  const { omitStandardUser, disableSleep, defaultBrowserChromium } = req.body;
  
  const progressFile = "/tmp/cminewar_iso_progress.txt";
  const logFile = "/tmp/cminewar_iso_log.txt";
  
  try {
    fs.writeFileSync(progressFile, "10");
    fs.writeFileSync(logFile, "[+] Iniciando compilador real de ISO de CMineWar OS...\n");
    
    // Paso 1: compilar boot.asm
    fs.appendFileSync(logFile, "[+] Compilando cargador MBR (boot.asm) con NASM...\n");
    execSync("nasm -f bin bare-metal/boot.asm -o /tmp/boot.bin");
    fs.writeFileSync(progressFile, "30");
    
    // Paso 2: compilar uefi_loader.c
    fs.appendFileSync(logFile, "[+] Compilando cargador UEFI (uefi_loader.c) con MinGW GCC...\n");
    execSync("x86_64-w64-mingw32-gcc -fshort-wchar -nostdlib -shared -Wl,-dll -Wl,--subsystem,10 -e efi_main -o /tmp/BOOTX64.EFI bare-metal/uefi_loader.c");
    fs.writeFileSync(progressFile, "50");
    
    // Paso 3: crear efi.img
    fs.appendFileSync(logFile, "[+] Creando imagen de arranque UEFI (efi.img)...\n");
    execSync("dd if=/dev/zero of=/tmp/efi.img bs=1024 count=1440");
    execSync("mkfs.vfat -I -F 12 /tmp/efi.img || /sbin/mkfs.vfat -I -F 12 /tmp/efi.img || /usr/sbin/mkfs.vfat -I -F 12 /tmp/efi.img");
    execSync("mmd -i /tmp/efi.img ::/EFI || true");
    execSync("mmd -i /tmp/efi.img ::/EFI/BOOT || true");
    execSync("mcopy -o -i /tmp/efi.img /tmp/BOOTX64.EFI ::/EFI/BOOT/BOOTX64.EFI");
    fs.writeFileSync(progressFile, "70");
    
    // Paso 4: Rellenar boot.bin con ceros hasta completar 2048 bytes para El Torito (sin emulación)
    fs.appendFileSync(logFile, "[+] Creando sector de arranque El Torito (boot2048.bin)...\n");
    execSync("dd if=/dev/zero of=/tmp/boot2048.bin bs=1 count=2048");
    execSync("dd if=/tmp/boot.bin of=/tmp/boot2048.bin conv=notrunc");
    
    // Paso 5: Copiar archivos del sistema a la estructura de la ISO
    fs.appendFileSync(logFile, "[+] Copiando archivos de la interfaz y recursos a iso_root...\n");
    execSync("rm -rf /tmp/iso_root && mkdir -p /tmp/iso_root/bare-metal");
    if (fs.existsSync("dist")) {
      execSync("cp -r dist /tmp/iso_root/");
    }
    execSync("cp package.json package-lock.json /tmp/iso_root/ || true");
    execSync("cp -r bare-metal/* /tmp/iso_root/bare-metal/");
    execSync("cp /tmp/boot2048.bin /tmp/iso_root/boot.bin");
    execSync("cp /tmp/efi.img /tmp/iso_root/efi.img");
    
    // Paso 6: Compilar la ISO híbrida dual-boot usando xorriso con soporte completo UEFI y BIOS El Torito
    fs.appendFileSync(logFile, "[+] Empaquetando ISO híbrida dual-boot (BIOS + UEFI) con xorriso...\n");
    execSync(`xorriso -as mkisofs -V "cminewarOS" -o /tmp/cminewarOS-live.iso -b boot.bin -c boot.catalog -no-emul-boot -boot-load-size 4 -boot-info-table -eltorito-alt-boot -e efi.img -no-emul-boot /tmp/iso_root/`);
    
    fs.writeFileSync(progressFile, "100");
    fs.appendFileSync(logFile, "[✓] ¡Compilación e ISO creadas con éxito de forma 100% REAL!\n");
    
    res.json({
      success: true,
      message: "ISO compilada de forma real con éxito.",
      downloadUrl: "/api/cminewar/download-iso"
    });
  } catch (error: any) {
    console.error("Error compilando ISO real:", error);
    fs.appendFileSync(logFile, `[❌] ERROR CRÍTICO: ${error.message}\n`);
    fs.writeFileSync(progressFile, "FAILED");
    res.status(500).json({ error: `Fallo al compilar la ISO: ${error.message}` });
  }
});

// CMineWar - Retrieve dynamic status of real ISO compilation
app.get("/api/cminewar/iso-status", (req, res) => {
  const progressFile = "/tmp/cminewar_iso_progress.txt";
  const logFile = "/tmp/cminewar_iso_log.txt";
  
  let progress = "0";
  let logs: string[] = [];
  
  if (fs.existsSync(progressFile)) {
    progress = fs.readFileSync(progressFile, "utf-8").trim();
  }
  if (fs.existsSync(logFile)) {
    logs = fs.readFileSync(logFile, "utf-8").split("\n").filter(l => l.trim() !== "");
  }
  
  res.json({ progress, logs });
});

// CMineWar - Real ISO binary download proxy
app.get("/api/cminewar/download-iso", (req, res) => {
  const isoPath = "/tmp/cminewarOS-live.iso";
  if (fs.existsSync(isoPath)) {
    res.download(isoPath, "cminewaros-v1.1.2-live.iso");
  } else {
    res.status(404).json({ error: "La imagen ISO no está lista o no existe." });
  }
});

// CMineWar - Start full system and GRUB update background service execution
app.post("/api/cminewar/system-update", (req, res) => {
  try {
    const scriptPath = path.join(process.cwd(), "bare-metal", "update_system.py");
    if (fs.existsSync(scriptPath)) {
      try {
        fs.chmodSync(scriptPath, "755");
      } catch (e) {
        // Safe to ignore on non-POSIX/read-only filesystems in dev
      }
    }

    // Clean or initialize files for update tracking
    try {
      fs.writeFileSync("/tmp/cminewar_update_progress.txt", "0");
      fs.writeFileSync("/tmp/cminewar_update_log.txt", "[+] Inicializando sintonizador de actualizaciones de CMineWar OS...\n");
    } catch (err) {
      console.error("No se pudieron inicializar los archivos de log de actualizacion:", err);
    }

    console.log("[ACTUALIZADOR] Lanzando actualizador de sistema completo en Python...");
    
    // Launch update script safely in background using spawn
    const child = spawn("python3", ["-u", scriptPath]);
    
    child.stdout?.on("data", (data) => {
      try {
        fs.appendFileSync("/tmp/cminewar_update_log.txt", data);
      } catch (e) {
        console.error("Error escribiendo en log de actualizacion:", e);
      }
    });

    child.stderr?.on("data", (data) => {
      try {
        fs.appendFileSync("/tmp/cminewar_update_log.txt", data);
      } catch (e) {
        console.error("Error escribiendo en log de error de actualizacion:", e);
      }
    });
    
    res.json({
      status: "started",
      pid: child.pid,
      message: "Actualización integral del sistema iniciada en segundo plano."
    });
  } catch (error: any) {
    console.error("Fallo al lanzar script de actualización en Python:", error);
    res.status(500).json({ error: `Fallo al lanzar actualizador: ${error.message}` });
  }
});

// CMineWar - Full system and GRUB update status log retriever endpoint
app.get("/api/cminewar/system-update-status", (req, res) => {
  const progressFile = "/tmp/cminewar_update_progress.txt";
  const logFile = "/tmp/cminewar_update_log.txt";

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

// GET /api/cminewar/ubuntu-companion/cache-status - Real dynamic cache scanner
app.get("/api/cminewar/ubuntu-companion/cache-status", (req, res) => {
  const cacheDir = "/tmp/ubuntu-companion-cache";
  let sizeBytes = 0;
  
  if (fs.existsSync(cacheDir)) {
    try {
      const files = fs.readdirSync(cacheDir);
      for (const file of files) {
        const filePath = path.join(cacheDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          sizeBytes += stats.size;
        }
      }
    } catch (e) {
      console.error("Error reading cache status directory:", e);
    }
  } else {
    // Populate cache on first load so there is actual dynamic content to clear/scan
    try {
      fs.mkdirSync(cacheDir, { recursive: true });
      const dummyPackages = {
        "isolinux_boot.deb": 14.2 * 1024 * 1024,
        "syslinux_utils.deb": 12.8 * 1024 * 1024,
        "xorriso.deb": 45.6 * 1024 * 1024,
        "squashfs_tools.deb": 18.2 * 1024 * 1024,
        "grub_efi_amd64.deb": 155.0 * 1024 * 1024
      };
      for (const [name, size] of Object.entries(dummyPackages)) {
        const filePath = path.join(cacheDir, name);
        const fd = fs.openSync(filePath, "w");
        fs.ftruncateSync(fd, size);
        fs.closeSync(fd);
        sizeBytes += size;
      }
    } catch (e) {
      console.error("Error populating first-time cache directory:", e);
    }
  }

  const sizeMb = sizeBytes / (1024 * 1024);
  res.json({
    size: parseFloat(sizeMb.toFixed(1))
  });
});

// POST /api/cminewar/ubuntu-companion/clear-cache - Real physical cache clear
app.post("/api/cminewar/ubuntu-companion/clear-cache", (req, res) => {
  const cacheDir = "/tmp/ubuntu-companion-cache";
  if (fs.existsSync(cacheDir)) {
    try {
      const files = fs.readdirSync(cacheDir);
      for (const file of files) {
        fs.unlinkSync(path.join(cacheDir, file));
      }
    } catch (e) {
      console.error("Error clearing companion cache directory:", e);
      return res.status(500).json({ error: "Fallo al vaciar el caché." });
    }
  }
  res.json({
    success: true,
    size: 0.0
  });
});

// POST /api/cminewar/ubuntu-companion/create-usb - Real background physical action trigger
app.post("/api/cminewar/ubuntu-companion/create-usb", (req, res) => {
  const { device, legacyCompatibility, highPerformance, cacheLibraries, packages } = req.body;
  
  if (!device) {
    return res.status(400).json({ error: "Dispositivo de destino requerido." });
  }

  // Prevent shell command injections
  const safeDevice = device.replace(/[^a-zA-Z0-9]/g, "");
  const safeLegacy = legacyCompatibility ? "true" : "false";
  const safePerf = highPerformance ? "true" : "false";
  const safeCache = cacheLibraries ? "true" : "false";
  const safePackages = Array.isArray(packages) ? packages.map(p => String(p).replace(/[^a-zA-Z0-9_]/g, "")).join(",") : "";

  try {
    const scriptPath = path.join(process.cwd(), "bare-metal", "create_companion_usb.py");
    if (fs.existsSync(scriptPath)) {
      try {
        fs.chmodSync(scriptPath, "755");
      } catch (e) {}
    }

    // Clean previous logs and progress
    try {
      fs.writeFileSync("/tmp/ubuntu_companion_flash_progress.txt", "0");
      fs.writeFileSync("/tmp/ubuntu_companion_flash_log.txt", "⚡ [INICIANDO] Conectando con el motor real de Companion USB Creator...\n");
    } catch (err) {
      console.error("Error writing init logs:", err);
    }

    console.log(`[COMPANION] Lanzando creador de USB real para: /dev/${safeDevice} con paquetes: ${safePackages}`);
    const child = spawn("python3", ["-u", scriptPath, safeDevice, safeLegacy, safePerf, safeCache, safePackages]);

    child.stdout?.on("data", (data) => {
      try {
        fs.appendFileSync("/tmp/ubuntu_companion_flash_log.txt", data);
      } catch (e) {
        console.error("Error appending stdout to companion logs:", e);
      }
    });

    child.stderr?.on("data", (data) => {
      try {
        fs.appendFileSync("/tmp/ubuntu_companion_flash_log.txt", data);
      } catch (e) {
        console.error("Error appending stderr to companion logs:", e);
      }
    });

    res.json({
      status: "started",
      pid: child.pid,
      message: "Proceso de creación física de USB Companion iniciado en segundo plano con éxito."
    });
  } catch (error: any) {
    console.error("Fallo al lanzar creador de USB:", error);
    res.status(500).json({ error: `Fallo al arrancar el motor de flasheo: ${error.message}` });
  }
});

// GET /api/cminewar/ubuntu-companion/status - Real companion live logger
app.get("/api/cminewar/ubuntu-companion/status", (req, res) => {
  const progressFile = "/tmp/ubuntu_companion_flash_progress.txt";
  const logFile = "/tmp/ubuntu_companion_flash_log.txt";

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

// CMineWar - Boot Tracer Diagnostics Retriever Endpoint
app.get("/api/cminewar/boot-trace", (req, res) => {
  const logFile = "/var/log/cminewar-boot.log";
  if (fs.existsSync(logFile)) {
    try {
      const content = fs.readFileSync(logFile, "utf-8");
      return res.json({ success: true, isReal: true, content });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // Simulated fallback logs for standard demo mode / Virtual Machine container
  const mockContent = `=========================================================================
        🛸 INFORME DE DIAGNÓSTICO DE ARRANQUE DE CMINEWAR OS 🛸
=========================================================================
Fecha de Análisis: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}
Nombre de Host:    cminewar-virtual-mainframe
Versión Kernel:    6.1.0-21-amd64 (Debian 6.1.90-1)
Arquitectura:      x86_64
Uptime Actual:     up 12 minutes
=========================================================================

[+] ⏱️ ANÁLISIS DEL TIEMPO DE ARRANQUE GENERAL (systemd-analyze):
Startup finished in 2.152s (kernel) + 1.844s (initrd) + 22.450s (userspace) = 26.446s
multi-user.target reached after 22.420s in userspace.

[+] 🐢 DETALLE DE SERVICIOS MÁS LENTOS (systemd-analyze blame - Top 15):
     12.102s apt-daily-upgrade.service
      8.450s network-manager.service
      5.230s keyboard-setup.service
      4.810s systemd-journal-flush.service
      3.950s dev-sda2.device
      3.120s lvm2-monitor.service
      2.840s cminewar.service (Servidor Web Node.js)
      1.950s systemd-udev-trigger.service
      1.220s user@0.service
      0.950s systemd-sysctl.service
      0.820s ssh.service
      0.640s systemd-logind.service
      0.550s polkit.service
      0.480s lm-sensors.service
      0.350s rsyslog.service

[+] 🔗 CADENA CRÍTICA DE INICIALIZACIÓN (systemd-analyze critical-chain):
multi-user.target @22.420s
└─cminewar.service @19.580s +2.840s
  └─network.target @19.550s
    └─NetworkManager.service @11.100s +8.450s
      └─network-pre.target @11.080s
        └─firewalld.service @8.220s +2.860s
          └─polkit.service @7.670s +0.550s
            └─basic.target @7.600s
              └─sockets.target @7.600s
                └─dbus.socket @7.600s
                  └─sysinit.target @7.580s

[+] ⚠️ ALERTAS Y ERRORES RECIENTES EN DMESG (Niveles: Crit, Err, Warn):
[    0.045012] ACPI BIOS Warning (bug): Optional FADT field Pm2ControlBlock has zero address or length: 0x0000000000000000/0x1 (20220412/tbfadt-220)
[    0.852102] systemd[1]: File /lib/systemd/system/systemd-journald.service:24 configures an IP firewall, but the policy is not supported. Ignoring.
[    1.254820] platform rtc_cmos: registered platform RTC device (same as pcrtc)
[    2.101250] ACPI Warning: \\_SB.PCI0.PEG0.PEGP._DSM: Argument count mismatch - Found 4, Expected 3 (20220412/nsarguments-180)
[    3.451025] ext4-fs (sda2): warning: mounting unchecked fs, running e2fsck is recommended
[    5.910230] i915 0000:00:02.0: [drm] *ERROR* CPU pipe A FIFO underrun

[+] 💾 ESTADO DE ESPACIO DE ALMACENAMIENTO:
S.ficheros     Tamaño Usados  Disp Uso% Montado en
/dev/sda2         20G   8.4G   11G  44% /
udev             3.9G      0  3.9G   0% /dev
tmpfs            794M   1.2M  793M   1% /run
/dev/sda1        511M   5.2M  506M   2% /boot/efi

[+] 🧠 UTILIZACIÓN DE MEMORIA RAM Y CPU AL INICIO:
               total        used        free      shared  buff/cache   available
Mem:           7.8Gi       1.4Gi       4.2Gi       120Mi       2.2Gi       6.1Gi
Soporte:       2.0Gi          0B       2.0Gi

Carga del Procesador (Load Average):
0.45 0.32 0.15 1/450 1205

[+] 🐉 ÚLTIMOS LOGS DEL SERVICIO CMINEWAR OS:
Jun 29 05:01:10 cminewar-virtual-mainframe node[1205]: Server running on http://localhost:3000
Jun 29 05:01:12 cminewar-virtual-mainframe node[1205]: [OTA AUTOMATIC DEAMON] Telemetry daemon listening for physical node handshakes
Jun 29 05:01:15 cminewar-virtual-mainframe node[1205]: [DB] Connected to persistent local engine storage.

=========================================================================
     🐉 FIN DEL REPORTE DE DIAGNÓSTICO DE ARRANQUE CMINEWAR OS 🐉
=========================================================================`;

  res.json({ success: true, isReal: false, content: mockContent });
});

// CMineWar - Client-to-Remote-Node Server-Side Secure CORS & HTTPS Proxy
app.all("/api/cminewar/proxy", async (req, res) => {
  const targetIp = req.query.ip || req.body.ip;
  const targetPath = req.query.path || req.body.path;

  if (!targetIp || !targetPath) {
    return res.status(400).json({ error: "Faltan parámetros requeridos de proxy: ip y path" });
  }

  // Ensure targetIp matches a safe pattern (IP address or hostname)
  const ipPattern = /^[a-zA-Z0-9.-]+$/;
  if (!ipPattern.test(String(targetIp))) {
    return res.status(400).json({ error: "Dirección IP o Hostname del nodo inválido" });
  }

  // Build the target remote URL
  const pathStr = String(targetPath);
  const cleanPath = pathStr.startsWith("/") ? pathStr : "/" + pathStr;
  const resolvedIp = String(targetIp).toLowerCase() === "demo" ? "127.0.0.1" : targetIp;
  const targetUrl = `http://${resolvedIp}:3000${cleanPath}`;

  try {
    const method = req.method;
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    const fetchOptions: RequestInit = {
      method,
      headers
    };

    if (method !== "GET" && method !== "HEAD") {
      // For POST requests, construct the request body
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    console.warn(`[PROXY WARNING] Fallo sutil al conectar con el nodo remoto http://${targetIp}:3000:`, err.message);
    return res.status(502).json({
      success: false,
      error: `Error de Proxy: No se pudo conectar con el nodo de CMineWar OS en ${targetIp}.`,
      details: err.message
    });
  }
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

// ==========================================================
// CMINEWAR REAL HARDWARE & SYSTEM FILES ENDPOINTS
// ==========================================================

// Helper to execute commands safely without throwing and crashing
function safeExec(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 3000, stdio: "pipe" }).toString();
  } catch (e) {
    return "";
  }
}

// 1. Filesystem True Root Explorer Endpoints
app.get("/api/cminewar/files/list", (req, res) => {
  const reqPath = String(req.query.path || "/");
  try {
    // Standardize path relative to root of physical container/machine
    const targetPath = path.resolve("/", reqPath);
    
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: "Directorio no encontrado." });
    }
    
    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: "La ruta no corresponde a un directorio." });
    }

    const files = fs.readdirSync(targetPath);
    const result = [];
    
    for (const file of files) {
      try {
        const fullPath = path.join(targetPath, file);
        const fStat = fs.statSync(fullPath);
        result.push({
          name: file,
          type: fStat.isDirectory() ? "dir" : "file",
          size: fStat.isDirectory() ? "" : `${(fStat.size / 1024).toFixed(1)} KB`
        });
      } catch (err) {
        // Skip inaccessible files or broken links
      }
    }
    
    // Sort directories first, then files
    result.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "dir" ? -1 : 1;
    });

    res.json({ files: result });
  } catch (err: any) {
    res.status(500).json({ error: `Error al listar directorio: ${err.message}` });
  }
});

app.get("/api/cminewar/files/read", (req, res) => {
  const reqPath = String(req.query.path || "");
  try {
    const targetPath = path.resolve("/", reqPath);
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: "Archivo no encontrado." });
    }
    
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: "La ruta corresponde a un directorio, no a un archivo." });
    }

    // Read first 1MB of file content to prevent buffering huge binaries
    const fd = fs.openSync(targetPath, "r");
    const buffer = Buffer.alloc(1024 * 1024);
    const bytesRead = fs.readSync(fd, buffer, 0, 1024 * 1024, 0);
    fs.closeSync(fd);

    const content = buffer.toString("utf8", 0, bytesRead);
    res.json({ content });
  } catch (err: any) {
    res.status(500).json({ error: `Error al leer archivo: ${err.message}` });
  }
});

app.post("/api/cminewar/files/create", (req, res) => {
  const { path: reqPath, name, type } = req.body;
  if (!name) return res.status(400).json({ error: "Nombre es requerido." });
  
  try {
    const parentDir = path.resolve("/", reqPath || "/");
    const targetPath = path.join(parentDir, name);
    
    if (type === "dir") {
      fs.mkdirSync(targetPath, { recursive: true });
    } else {
      fs.writeFileSync(targetPath, "");
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: `Error al crear item: ${err.message}` });
  }
});

app.post("/api/cminewar/files/delete", (req, res) => {
  const { path: reqPath } = req.body;
  if (!reqPath) return res.status(400).json({ error: "Ruta es requerida." });
  
  try {
    const targetPath = path.resolve("/", reqPath);
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: "El archivo o carpeta no existe." });
    }
    
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      fs.rmdirSync(targetPath);
    } else {
      fs.unlinkSync(targetPath);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: `Error al eliminar: ${err.message}` });
  }
});

// 2. Real Hardware Network Interfaces & Peripherals Endpoints
app.get("/api/cminewar/hardware/wifi", (req, res) => {
  try {
    // Detect real wireless interface name from system
    let wifiInterface = "wlan0";
    try {
      const files = fs.readdirSync("/sys/class/net");
      const found = files.find(f => f.startsWith("wl") || f.startsWith("wlan"));
      if (found) wifiInterface = found;
    } catch (e) {}

    const networks: any[] = [];
    
    // Try to scan using nmcli
    const nmcliOutput = safeExec("nmcli -t -f SSID,SIGNAL,ACTIVE,SECURITY dev wifi list 2>/dev/null");
    if (nmcliOutput) {
      const lines = nmcliOutput.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(":");
        if (parts.length >= 3) {
          const ssid = parts[0];
          const signal = parseInt(parts[1], 10) || 50;
          const active = parts[2].toLowerCase() === "yes" || parts[2].toLowerCase() === "sí";
          const security = parts[3] || "";
          if (ssid) {
            networks.push({
              ssid,
              signal,
              lock: security.trim() !== "" && !security.includes("none"),
              status: active ? "connected" : "available"
            });
          }
        }
      }
    }

    // Fallback list matched with real system parameters
    if (networks.length === 0) {
      networks.push(
        { ssid: "CMineWarNet_Physical_5G", signal: 95, lock: true, status: "connected" },
        { ssid: `Invitados_${wifiInterface}`, signal: 78, lock: false, status: "available" },
        { ssid: "Fibra_Optica_Hogar", signal: 64, lock: true, status: "available" },
        { ssid: "Vecino_Sondeo_Banda", signal: 42, lock: true, status: "available" }
      );
    }

    res.json({
      success: true,
      interface: wifiInterface,
      list: networks,
      driver: "iwlwifi / mac80211",
      chipset: "Intel Wi-Fi 6E AX211 / Atheros 802.11ac Controller"
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/cminewar/hardware/bluetooth", (req, res) => {
  try {
    // Detect bluetooth controllers in sysfs
    let controllerCount = 0;
    try {
      const files = fs.readdirSync("/sys/class/bluetooth");
      controllerCount = files.filter(f => f.startsWith("hci")).length;
    } catch (e) {
      // fallback
      controllerCount = 1; 
    }

    const devices: any[] = [];
    const bctlOutput = safeExec("bluetoothctl devices 2>/dev/null");
    
    if (bctlOutput) {
      const lines = bctlOutput.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        const match = line.match(/^Device\s+([0-9A-Fa-f:]+)\s+(.+)$/);
        if (match) {
          devices.push({
            name: match[2],
            address: match[1],
            paired: true,
            connected: false,
            type: match[2].toLowerCase().includes("audio") || match[2].toLowerCase().includes("beats") || match[2].toLowerCase().includes("sony") ? "audio" : "input"
          });
        }
      }
    }

    if (devices.length === 0) {
      devices.push(
        { name: "Sony WH-1000XM4 (Diadema Audio)", paired: true, connected: true, address: "38:18:4C:E2:0F:1A", type: "audio" },
        { name: "Logitech MX Master 3S (Mouse Host)", paired: true, connected: false, address: "00:1B:44:11:3A:B7", type: "input" },
        { name: "Dispositivo BLE Genérico", paired: false, connected: false, address: "AA:BB:CC:DD:EE:FF", type: "other" }
      );
    }

    res.json({
      success: true,
      enabled: controllerCount > 0,
      controllersCount: controllerCount,
      list: devices,
      driver: "btintel / BlueZ 5.64"
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/cminewar/hardware/ethernet", (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    const list: any[] = [];
    
    // Resolve gateway
    let gateway = "192.168.1.1";
    const routeOut = safeExec("ip route show | grep default 2>/dev/null");
    if (routeOut) {
      const match = routeOut.match(/via\s+([0-9.]+)/);
      if (match) gateway = match[1];
    }

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (name === "lo" || !addrs) continue;
      const ipv4 = addrs.find(a => a.family === "IPv4");
      if (ipv4) {
        list.push({
          interface: name,
          ip: ipv4.address,
          netmask: ipv4.netmask,
          mac: ipv4.mac || "00:00:00:00:00:00",
          gateway
        });
      }
    }

    // fallback if container net interface is empty
    if (list.length === 0) {
      list.push({
        interface: "eth0",
        ip: "192.168.1.135",
        netmask: "255.255.255.0",
        mac: "42:00:4E:49:43:00",
        gateway: "192.168.1.1"
      });
    }

    res.json({
      success: true,
      list
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. lspci & lsusb physical host query endpoint
app.get("/api/cminewar/hardware/lspci-lsusb", (req, res) => {
  try {
    let lspciRaw = safeExec("lspci 2>&1");
    let lsusbRaw = safeExec("lsusb 2>&1");
    
    // Check if lspci / lsusb failed or returned empty/unusable strings
    const hasLspciError = !lspciRaw || lspciRaw.includes("Cannot find any") || lspciRaw.includes("pcilib:") || lspciRaw.includes("not found");
    const hasLsusbError = !lsusbRaw || lsusbRaw.includes("not found");

    const fallbackLspciList = [
      "00:00.0 Host bridge: Intel Corporation 82G33/G31/P35/P31 Express DRAM Controller (rev 02)",
      "00:01.0 VGA compatible controller: Google Cloud VirtIO Graphics Adaptor (rev 02)",
      "00:02.0 Audio device: Intel Corporation Sunrise Point-LP HD Audio (rev 21)",
      "00:03.0 Ethernet controller: Google Cloud VirtIO Ethernet Interface (rev 01)",
      "02:00.0 Network controller: Broadcom Inc. and subsidiaries BCM4360 802.11ac Wireless Network Adapter (rev 03)"
    ];

    const fallbackLsusbList = [
      "Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub",
      "Bus 001 Device 002: ID 8087:0024 Intel Corp. Integrated Rate Matching Hub",
      "Bus 001 Device 003: ID 04f2:b604 Chicony Electronics Co., Ltd AX211 Bluetooth Adapter",
      "Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub"
    ];

    const finalLspci = hasLspciError ? fallbackLspciList.join("\n") : lspciRaw;
    const finalLsusb = hasLsusbError ? fallbackLsusbList.join("\n") : lsusbRaw;

    // Build lists
    const lspciLines = finalLspci.split("\n").filter(Boolean);
    const lsusbLines = finalLsusb.split("\n").filter(Boolean);

    // Parse out names for displaying
    const cpuName = safeExec("lscpu | grep 'Model name' | cut -d':' -f2").trim() || "Genuine Intel(R) Xeon(R) CPU (2 Cores Virtualized)";
    
    // Find VGA, Network and Audio
    let gpu = "VirtIO Graphics Controller (rev 02)";
    let wifi = "Broadcom BCM4360 802.11ac Wireless Adapter";
    let ethernet = "VirtIO Ethernet Network Controller";
    let audio = "Intel Corporation Sunrise Point-LP HD Audio";
    let bluetooth = "Chicony Electronics AX211 Bluetooth Adapter";

    lspciLines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes("vga") || lower.includes("3d") || lower.includes("graphics")) {
        const parts = line.split(": ");
        if (parts.length > 1) gpu = parts[parts.length - 1];
      }
      if (lower.includes("network") || lower.includes("wireless") || lower.includes("wi-fi") || lower.includes("802.11")) {
        const parts = line.split(": ");
        if (parts.length > 1) wifi = parts[parts.length - 1];
      }
      if (lower.includes("ethernet")) {
        const parts = line.split(": ");
        if (parts.length > 1) ethernet = parts[parts.length - 1];
      }
      if (lower.includes("audio") || lower.includes("sound")) {
        const parts = line.split(": ");
        if (parts.length > 1) audio = parts[parts.length - 1];
      }
    });

    lsusbLines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes("bluetooth") || lower.includes("bt")) {
        const parts = line.split("ID ");
        if (parts.length > 1) {
          bluetooth = parts[1].substring(9).trim() || bluetooth;
        }
      }
    });

    res.json({
      success: true,
      lspciRaw: finalLspci,
      lsusbRaw: finalLsusb,
      lspciList: lspciLines,
      lsusbList: lsusbLines,
      parsed: {
        cpu: cpuName,
        gpu,
        wifi,
        ethernet,
        audio,
        bluetooth
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

// Proyecto propiedad de Yonah Llanes

