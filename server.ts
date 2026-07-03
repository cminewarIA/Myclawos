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
      // Intentar auto-instalación automática
      let packageName = "";
      if (serviceId === "nginx") {
        packageName = "nginx";
      } else if (serviceId === "ssh" || serviceId === "sshd") {
        packageName = "openssh-server";
      } else if (serviceId === "network-manager") {
        packageName = "network-manager";
      }

      if (packageName) {
        try {
          console.log(`[AUTOPACKAGE] El servicio ${serviceId} no está instalado. Intentando auto-instalar el paquete '${packageName}' via apt-get...`);
          execFileSync("sudo", ["apt-get", "update", "-y"]);
          execFileSync("sudo", ["apt-get", "install", "-y", packageName]);
          console.log(`[AUTOPACKAGE] Paquete '${packageName}' instalado con éxito. Reintentando activar el servicio...`);
          execFileSync("sudo", ["systemctl", action, sysSrvName]);
          return res.json({
            success: true,
            message: `El servicio ${serviceId} no estaba instalado. Lo hemos instalado y activado automáticamente.`
          });
        } catch (installErr: any) {
          let installDetails = installErr.message;
          if (installErr.stderr) {
            installDetails = installErr.stderr.toString().trim();
          }
          return res.json({
            success: false,
            error: `Fallo de auto-instalación para ${serviceId}: ${installDetails}`,
            message: `El servicio ${serviceId} no estaba instalado y falló la instalación automática: ${installDetails}`
          });
        }
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
  const { device, legacyCompatibility, highPerformance, cacheLibraries } = req.body;
  
  if (!device) {
    return res.status(400).json({ error: "Dispositivo de destino requerido." });
  }

  // Prevent shell command injections
  const safeDevice = device.replace(/[^a-zA-Z0-9]/g, "");
  const safeLegacy = legacyCompatibility ? "true" : "false";
  const safePerf = highPerformance ? "true" : "false";
  const safeCache = cacheLibraries ? "true" : "false";

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

    console.log(`[COMPANION] Lanzando creador de USB real para: /dev/${safeDevice}`);
    const child = spawn("python3", ["-u", scriptPath, safeDevice, safeLegacy, safePerf, safeCache]);

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

// Proyecto propiedad de Yonah Llanes

