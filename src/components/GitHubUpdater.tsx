import React, { useState, useEffect, useRef } from "react";
import { VFSNode } from "../types";
import { setNodeAtPath } from "../vfs";
import DragonLogo from "./DragonLogo";
import { 
  Github, 
  GitBranch, 
  GitCommit, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Terminal as TermIcon, 
  Play, 
  Settings, 
  Activity, 
  Sparkles, 
  Clock, 
  ToggleLeft, 
  ToggleRight, 
  ArrowDownCircle, 
  CornerDownRight,
  ShieldAlert,
  RotateCcw,
  Wifi,
  Bluetooth,
  Radio,
  Tv,
  Smartphone,
  LayoutGrid,
  Laptop,
  Network,
  Download,
  Terminal,
  FileCode,
  Sliders,
  Maximize2
} from "lucide-react";

interface GitHubUpdaterProps {
  vfs: VFSNode;
  setVfs: (newVfs: VFSNode) => void;
  triggerNotification: (text: string, type: "success" | "info") => void;
}

interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export default function GitHubUpdater({
  vfs,
  setVfs,
  triggerNotification,
}: GitHubUpdaterProps) {
  // Navigation tabs (Windows Control Panel style + sidebar)
  const [activeTab, setActiveTab] = useState<"index" | "wifi" | "bluetooth" | "ethernet" | "lte" | "display" | "apk" | "packages" | "github" | "lan_security">("index");
  
  // WAN / Internet Connection Blocking Firewall States
  const [wanBlocked, setWanBlocked] = useState<boolean>(() => {
    return localStorage.getItem("cminewar_wan_blocked") === "true";
  });

  const toggleWanFirewall = () => {
    const newState = !wanBlocked;
    setWanBlocked(newState);
    localStorage.setItem("cminewar_wan_blocked", String(newState));
    window.dispatchEvent(new Event("cminewar_network_changed"));
    if (newState) {
      triggerNotification("Cortafuegos activado: Tráfico de Internet (WAN) bloqueado. Red Local (LAN) aislada.", "success");
    } else {
      triggerNotification("Cortafuegos modificado: Conexión libre a Internet (WAN) permitida.", "info");
    }
  };

  // Simulated stats and configurations
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [selectedWifi, setSelectedWifi] = useState("CMineWarNet_5G_Corporate");
  const [wifiList, setWifiList] = useState([
    { ssid: "CMineWarNet_5G_Corporate", signal: 98, lock: true, status: "connected" },
    { ssid: "Aeropuerto_Gratis_WiFi", signal: 45, lock: false, status: "available" },
    { ssid: "MyHome_Fiber_Optic", signal: 82, lock: true, status: "available" },
    { ssid: "Vecino_No_Tocar", signal: 30, lock: true, status: "available" },
  ]);
  const [connectingWifi, setConnectingWifi] = useState<string | null>(null);
  const [wifiProgress, setWifiProgress] = useState(0);

  // Bluetooth configuration
  const [btEnabled, setBtEnabled] = useState(true);
  const [devicesList, setDevicesList] = useState([
    { name: "Beats Solo Pro - Auriculares Audio", paired: true, connected: true, type: "audio" },
    { name: "Logitech MX Master 3S - Ratón Ergonómico", paired: true, connected: true, type: "mouse" },
    { name: "Sony DualSense - Mando de Juego", paired: false, connected: false, type: "gamepad" },
    { name: "SmartTV Living Room", paired: false, connected: false, type: "tv" },
    { name: "Androide_Core_S24", paired: false, connected: false, type: "phone" },
  ]);
  const [btScanning, setBtScanning] = useState(false);
  const [btScanResults, setBtScanResults] = useState<string[]>([]);

  // Ethernet settings
  const [ethMode, setEthMode] = useState<"dhcp" | "static">("dhcp");
  const [ethIp, setEthIp] = useState("192.168.1.135");
  const [ethMask, setEthMask] = useState("255.255.255.0");
  const [ethGateway, setEthGateway] = useState("192.168.1.1");
  const [ethDns, setEthDns] = useState("1.1.1.1");

  // LTE Settings
  const [lteEnabled, setLteEnabled] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState("CMineWarMobile LTE-Advanced");
  const [apnPlausible, setApnPlausible] = useState("internet.cminewar.mvno");

  // Display Settings
  const [currentResolution, setCurrentResolution] = useState("auto");
  const [currentScale, setCurrentScale] = useState(100);
  const [simulatedOrientation, setSimulatedOrientation] = useState<"landscape" | "portrait">("landscape");
  const [actualOrientation, setActualOrientation] = useState("landscape");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < window.innerHeight) {
        setActualOrientation("portrait");
      } else {
        setActualOrientation("landscape");
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Package installation manager states
  const [installedPackages, setInstalledPackages] = useState<string[]>(() => {
    const saved = localStorage.getItem("cminewar_installed_packages");
    return saved ? JSON.parse(saved) : [];
  });
  const [installingPkg, setInstallingPkg] = useState<string | null>(null);
  const [pkgInstallProgress, setPkgInstallProgress] = useState(0);
  const [pkgInstallLog, setPkgInstallLog] = useState<string[]>([]);
  
  const packagesCatalog = [
    { id: "pkg_htop", name: "htop v3.2.0", type: "Monitor de Procesos", desc: "Monitor en tiempo real de hilos de CPU y consumo de memoria ram en entorno de consola interactivo.", icon: CpuThemeIcon },
    { id: "pkg_neofetch", name: "neofetch v7.1", type: "Información de Hardware", desc: "Imprime un hermoso logotipo pixelado de CMineWar OS junto con metadatos del sistema host actual.", icon: Laptop },
    { id: "pkg_cmatrix", name: "cmatrix 1.8", type: "Salva-pantallas Codificado", desc: "El glorioso simulador de caída de lluvia secuencial de códigos en cascada al más puro estilo Matrix.", icon: FileCode },
    { id: "pkg_nginx", name: "nginx Web Server", type: "Servidor Web Suite", desc: "Monta un alojamiento de archivos local, configura el index.html y depura peticiones HTTP virtuales.", icon: Network },
    { id: "pkg_retroarch", name: "RetroArch Snake", type: "Juego Arcade Retro", desc: "Consola clásica que emula el juego de la serpiente original con rankings de puntuación alta y arcade.", icon: Tv }
  ];

  // Original GitHub variables & states retained fully for integration
  const [gitOwner, setGitOwner] = useState(() => {
    const saved = localStorage.getItem("cminewar_git_owner");
    return (saved && saved !== "cminewar") ? saved : "cminewarIA";
  });
  const [gitRepo, setGitRepo] = useState(() => {
    const saved = localStorage.getItem("cminewar_git_repo");
    return (saved && saved !== "cminewaros-core") ? saved : "Myclawos";
  });
  const [gitBranch, setGitBranch] = useState(() => localStorage.getItem("cminewar_git_branch") || "main");
  const [gitPat, setGitPat] = useState(() => localStorage.getItem("cminewar_git_pat") || "");
  const [installedSha, setInstalledSha] = useState(() => localStorage.getItem("cminewar_installed_sha") || "b7c25e89a");
  const [installedMessage, setInstalledMessage] = useState(() => localStorage.getItem("cminewar_installed_msg") || "Inicializar núcleo cognitivo y sincronizador udev");
  const [installedDate, setInstalledDate] = useState(() => localStorage.getItem("cminewar_installed_date") || "2026-05-28 12:44:00 UTC");
  
  // Custom Kernel & Bootloader Status Persistence
  const [activeKernel, setActiveKernel] = useState(() => localStorage.getItem("cminewar_kernel_version") || "v6.10.8-cminewar-generic-x86_64");
  const [activeBootloader, setActiveBootloader] = useState(() => localStorage.getItem("cminewar_bootloader_version") || "CMineWar-GRUB MBR v2.06");
  const [isSafeModeArmed, setIsSafeModeArmed] = useState(() => localStorage.getItem("cminewar_safe_mode") === "true");
  const [forceAndroidSim, setForceAndroidSim] = useState(() => localStorage.getItem("cminewar_force_android") === "true");

  const [latestSha, setLatestSha] = useState<string>("");
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDaemonActive, setIsDaemonActive] = useState(() => {
    const saved = localStorage.getItem("cminewar_git_daemon");
    return saved !== null ? saved === "true" : true;
  });
  const [pollInterval, setPollInterval] = useState(() => Number(localStorage.getItem("cminewar_git_interval")) || 30);
  const [lastCheckTime, setLastCheckTime] = useState<string>("-");

  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateLogs, setUpdateLogs] = useState<string[]>([]);
  const [rebooting, setRebooting] = useState(false);
  const [rebootLogs, setRebootLogs] = useState<string[]>([]);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const rebootLogContainerRef = useRef<HTMLDivElement>(null);
  const pkgLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("cminewar_git_owner", gitOwner);
    localStorage.setItem("cminewar_git_repo", gitRepo);
    localStorage.setItem("cminewar_git_branch", gitBranch);
    localStorage.setItem("cminewar_git_pat", gitPat);
    localStorage.setItem("cminewar_installed_sha", installedSha);
    localStorage.setItem("cminewar_installed_msg", installedMessage);
    localStorage.setItem("cminewar_installed_date", installedDate);
    localStorage.setItem("cminewar_git_daemon", String(isDaemonActive));
    localStorage.setItem("cminewar_git_interval", String(pollInterval));
    localStorage.setItem("cminewar_kernel_version", activeKernel);
    localStorage.setItem("cminewar_bootloader_version", activeBootloader);
    localStorage.setItem("cminewar_safe_mode", String(isSafeModeArmed));
    localStorage.setItem("cminewar_force_android", String(forceAndroidSim));
  }, [gitOwner, gitRepo, gitBranch, gitPat, installedSha, installedMessage, installedDate, isDaemonActive, pollInterval, activeKernel, activeBootloader, isSafeModeArmed, forceAndroidSim]);

  useEffect(() => {
    localStorage.setItem("cminewar_installed_packages", JSON.stringify(installedPackages));
    // Dispatch event to synchronize launchers instantly on App.tsx
    window.dispatchEvent(new Event("cminewar_packages_changed"));
  }, [installedPackages]);

  // Simulated automatic update polling system daemon
  useEffect(() => {
    if (!isDaemonActive) {
      setLastCheckTime("-");
      return;
    }

    // Perform immediate initial soft tick
    setLastCheckTime(new Date().toLocaleTimeString());

    const daemonTimer = setInterval(() => {
      const now = new Date();
      setLastCheckTime(now.toLocaleTimeString());
      
      // Keep terminal background polling diagnostic active & random success ping
      // 10% chance to report status OK inside live notifications
      if (Math.random() < 0.10) {
        triggerNotification("Daemon udev: Sincronización automática de GitHub completada (Comprobado sin cambios)", "success");
      }
    }, pollInterval * 1000);

    return () => clearInterval(daemonTimer);
  }, [isDaemonActive, pollInterval, triggerNotification]);

  // Fallback dynamic database loader inside Control Panel
  const loadSimulatedCommits = () => {
    const baseCommits: CommitInfo[] = [
      {
        sha: "a59e81b3f9dc23d8c1920ac349e1e2d93e1b7fcf",
        message: "feat: Añadir módulo de sincronización GitHub auto-actualizable y daemon de sondeo",
        author: gitOwner || "cminewar",
        date: "28/5/2026, 19:28:15",
        url: "#"
      },
      {
        sha: "e1029cbb31b7cbd23d8c19a924abdc29009fa5d2",
        message: "feat: Refactorización total de Ajustes y Control de Hardware + Centro de Paquetes",
        author: "cortex-developer",
        date: "28/5/2026, 23:20:00",
        url: "#"
      },
      {
        sha: "b7c25e89a5dfc37cc19b22e11a12e84cdd3a09fa",
        message: "refactor: Reestructurar kernel-core y gestores auxiliares de CMineWar OS",
        author: "admin-cminewar",
        date: "28/5/2026, 12:44:00",
        url: "#"
      }
    ];
    setCommits(baseCommits);
    setLatestSha(baseCommits[0].sha);
  };

  useEffect(() => {
    loadSimulatedCommits();
  }, [gitOwner, gitRepo, gitBranch]);

  // Connect to Simulated Wi-Fi
  const handleConnectWifi = (ssid: string) => {
    if (connectingWifi || !wifiEnabled) return;
    setConnectingWifi(ssid);
    setWifiProgress(0);

    const intv = setInterval(() => {
      setWifiProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intv);
          setWifiList((old) =>
            old.map((w) => ({
              ...w,
              status: w.ssid === ssid ? "connected" : w.status === "connected" ? "available" : w.status,
            }))
          );
          setSelectedWifi(ssid);
          setConnectingWifi(null);
          triggerNotification(`Conectado con éxito a la red WiFi: ${ssid}`, "success");
          return 100;
        }
        return prev + 15;
      });
    }, 250);
  };

  // Pair Bluetooth device
  const handlePairBt = (deviceName: string) => {
    setDevicesList((old) =>
      old.map((d) => {
        if (d.name === deviceName) {
          if (d.connected) {
            triggerNotification(`Dispositivo desconectado: ${deviceName}`, "info");
            return { ...d, connected: false };
          } else {
            triggerNotification(`Conectando con éxito a Bluetooth: ${deviceName}`, "success");
            return { ...d, paired: true, connected: true };
          }
        }
        return d;
      })
    );
  };

  const handleScanBt = () => {
    if (btScanning) return;
    setBtScanning(true);
    setBtScanResults([]);
    setTimeout(() => {
      setBtScanResults(["CMineWarGamer_Pro_Headset", "iMac_Vecino_Directo", "Keyboard_RedDragon_K552"]);
      setBtScanning(false);
      triggerNotification("Escaneo Bluetooth completado. 3 dispositivos listos.", "info");
    }, 1500);
  };

  // Install Packages Drawer simulator
  const handleInstallPackage = (packageId: string, name: string) => {
    if (installingPkg) return;
    setInstallingPkg(packageId);
    setPkgInstallProgress(0);
    setPkgInstallLog([
      `$ sudo cminewar-pkg install ${packageId}`,
      `Leyendo lista de paquetes... Hecho`,
      `Creando árbol de dependencias virtuales del sistema operativo...`,
      `Se instalarán los siguientes paquetes NUEVOS: ${packageId}`,
      `Debe descargarse 144 kB / 4.8 MB de archivos compilados del pipeline de CMineWar OS.`,
      `Contactando con repositorios estables de CMineWar...`
    ]);

    const installSteps = [
      `Descargando paquete ${packageId}: [================>] 100% (18.5 MB/s)`,
      `Verificando firmas SHA256 corporativas del instalador... OK`,
      `Preparando para desempaquetar /var/cache/cminewar-pkg/archives/${packageId}_amd64.deb...`,
      `Desempaquetando archivos del programa en el sistema raíz virtual...`,
      `Configurando binarios de lanzamiento udev e interfaces compartidas...`,
      `Instalando lanzador gráfico de escritorio en: /usr/share/applications/${packageId}.desktop`,
      `Registrando metadatos en el Cajón de Aplicaciones de Synology DSM...`,
      `Reiniciando descriptores de la barra de tareas e indexando binarios...`,
      `¡Paquete '${packageId}' instalado y listo para arrancar en el escritorio!`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setPkgInstallProgress((prev) => {
        const next = Math.min(prev + 12, 100);
        if (currentStep < installSteps.length && next > (currentStep * 10)) {
          setPkgInstallLog((old) => [...old, installSteps[currentStep]]);
          currentStep++;
        }
        if (pkgLogRef.current) {
          setTimeout(() => {
            if (pkgLogRef.current) pkgLogRef.current.scrollTop = pkgLogRef.current.scrollHeight;
          }, 0);
        }
        if (next >= 100) {
          clearInterval(interval);
          setInstalledPackages((old) => {
            if (old.includes(packageId)) return old;
            return [...old, packageId];
          });
          setInstallingPkg(null);
          triggerNotification(`¡'${name}' se instaló con éxito! Ya se encuentra disponible en tu Cajón de Aplicaciones.`, "success");
        }
        return next;
      });
    }, 400);
  };

  const handleUninstallPackage = (packageId: string, name: string) => {
    setInstalledPackages((old) => old.filter((p) => p !== packageId));
    triggerNotification(`Desinstalado con éxito: ${name}. Eliminado del Cajón de Aplicaciones.`, "info");
  };

  // Build scripts download trigger for APK Android Companion
  const handleDownloadApkBuildKit = () => {
    const scriptContent = `#!/bin/bash
# ====================================================================
# Kit de Compilación WebView APK para Probar CMineWar OS en el Móvil
# ====================================================================
# Este script inicializa Capacitor en la SPA para generar tu APK nativa.

echo "[+] Paso 1: Instalando dependencias nativas de Capacitor..."
npm install @capacitor/core @capacitor/cli @capacitor/android

echo "[+] Paso 2: Inicializando configuración de Capacitor..."
npx cap init "CMineWar OS Mobile Viewer" "ai.cminewar.mobile" --web-dir=dist

echo "[+] Paso 3: Agregando la plataforma integrada Android..."
npx cap add android

echo "[+] Paso 4: Ajustando la preferencia de orientación y rotación fluida..."
# Esto inserta soporte multi-orientación en el AndroidManifest.xml
cat <<EOT >> android/app/src/main/AndroidManifest.xml
<!-- El sistema se ajustará automáticamente tanto en horizontal como en vertical -->
EOT

echo "[+] Paso 5: Compilando y sincronizando archivos del simulador web..."
npm run build
npx cap sync

echo "[+] Paso 6: Abriendo Android Studio para generar tu APK firmada con Gradle!"
npx cap open android

echo "[SUCCESS] ¡Kit listo! Sube esta build a tu dispositivo para arrancar CMineWar OS."
`;
    const blob = new Blob([scriptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cminewaros-cordova-build-kit.sh";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerNotification("Script 'cminewaros-cordova-build-kit.sh' descargado con éxito.", "success");
  };

  // Build scripts download trigger for Debian GNU/Linux
  const handleDownloadDebianInstaller = () => {
    const scriptContent = `#!/usr/bin/env bash
# =========================================================================
#            CMINEWAR SYSTEM SERVICE INSTALLER & FIREWALL DEPLOYER FOR DEBIAN
# =========================================================================
# Este script está específicamente diseñado para implementar la interfaz y el 
# backend de CMineWar OS en sistemas operativos Debian GNU/Linux tradicionales.
#
# Configura el inicio automático como servicio del sistema (Systemd),
# expone el acceso local (puerto 3000) de forma segura y provee el script de
# cortafuegos (iptables) para aislar por completo el tráfico WAN manteniendo 
# el acceso LAN intacto.
# =========================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "[-] ERROR: Este instalador requiere ejecutarse como ROOT."
  echo "    Por favor ejecuta: sudo bash \\$0"
  exit 1
fi

echo "========================================================================="
echo "   🐉 INSTALADOR DE CMINEWAR OS PARA DEBIAN GNU/LINUX (BARE-METAL & SERVICIOS)"
echo "========================================================================="
echo "[+] Detectando sistema operativo..."

if [ -f /etc/debian_version ]; then
    DEBIAN_VER=\\$(cat /etc/debian_version)
    echo "[✔] Sistema Debian compatible detectado (versión \\$DEBIAN_VER)."
else
    echo "[!] ADVERTENCIA: No se ha detectado un archivo oficial de Debian."
    echo "    Este script está optimizado para Debian y derivados directos (Ubuntu/Mint/etc)."
    read -p "¿Deseas continuar de todas formas? (s/N): " choice
    if [[ ! "\\$choice" =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

apt-get update -y
apt-get install -y curl build-essential git iptables iptables-persistent xorriso squashfs-tools mtools syslinux-utils

if ! command -v node &> /dev/null; then
    echo "[+] Node.js no detectado. Instalando el nodo oficial LTS (v20)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    NODE_VERSION=\\$(node -v)
    echo "[✔] Node.js ya instalado: \\$NODE_VERSION"
fi

INSTALL_DIR=\\$(pwd)
echo "[+] Directorio de instalación detectado: \\$INSTALL_DIR"

if [ ! -f "\\$INSTALL_DIR/package.json" ]; then
    echo "[-] ERROR: No se encuentra 'package.json' en el directorio: \\$INSTALL_DIR"
    echo "    Ejecuta el script desde la carpeta raíz del proyecto CMineWar OS."
    exit 1
fi

echo "[+] Instalando dependencias del proyecto npm..."
npm install

echo "[+] Compilando servidor nativo y activos estáticos de la interfaz web..."
npm run build

echo "[+] Configurando daemon de fondo de Systemd en /etc/systemd/system/cminewar.service..."

cat <<EOF > /etc/systemd/system/cminewar.service
[Unit]
Description=CMineWar OS - Estación Servidora Cognitiva y Gestor de Almacenamiento
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=\\$INSTALL_DIR
ExecStart=/usr/bin/node dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production PORT=3000

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable cminewar.service
systemctl restart cminewar.service

echo "[✔] Servicio 'cminewar.service' habilitado y arrancado con éxito en el puerto 3000."

echo "[+] Desplegando script de control del cortafuegos de internet en /usr/local/bin/cminewar-firewall..."

cat <<'EOF' > /usr/local/bin/cminewar-firewall
#!/usr/bin/env bash
set -e
if [ "\\$EUID" -ne 0 ]; then
  echo "[-] ERROR: Requiere privilegios de root."
  exit 1
fi

ACTION=\\$1
if [ -z "\\$ACTION" ]; then
    echo "Uso: cminewar-firewall [block | allow | status]"
    exit 0
fi

case "\\$ACTION" in
    block)
        echo "[!] Activando reglas de aislamiento WAN en iptables..."
        iptables --flush OUTPUT || true
        iptables -A OUTPUT -o lo -j ACCEPT
        iptables -A OUTPUT -d 192.168.0.0/16 -j ACCEPT
        iptables -A OUTPUT -d 172.16.0.0/12 -j ACCEPT
        iptables -A OUTPUT -d 10.0.0.0/8 -j ACCEPT
        iptables -P OUTPUT DROP
        if command -v iptables-save &> /dev/null; then
            iptables-save > /etc/iptables/rules.v4 || true
        fi
        echo "[✔] Cortafuegos ACTIVADO con Éxito. WAN Bloqueada."
        ;;
    allow)
        echo "[+] Abriendo compuertas del Cortafuegos..."
        iptables -P OUTPUT ACCEPT
        iptables --flush OUTPUT || true
        if command -v iptables-save &> /dev/null; then
            iptables-save > /etc/iptables/rules.v4 || true
        fi
        echo "[✔] Cortafuegos APAGADO con Éxito. Internet Libre."
        ;;
    status)
        POLICY=\\$(iptables -S OUTPUT | grep "\\-P" | awk '{print \\$3}')
        if [ "\\$POLICY" = "DROP" ]; then
            echo "🔥 ESTADO DE RED: WAN BLOQUEADA (Aislamiento LAN Activo)"
        else
            echo "🟢 ESTADO DE RED: WAN + LAN ABIERTAS"
        fi
        echo ""
        iptables -L OUTPUT -n --line-numbers
        ;;
esac
EOF

chmod +x /usr/local/bin/cminewar-firewall
LOCAL_IP=\\$(hostname -I | awk '{print \\$1}' || echo "127.0.0.1")

echo "========================================================================="
echo "  ✔ DEBIAN SERVICE INSTALLATION SUCCESSFUL"
echo "  Acceso Local: http://\\$LOCAL_IP:3000"
echo "  Bloquear Internet: sudo cminewar-firewall block"
echo "  Permitir Internet: sudo cminewar-firewall allow"
echo "========================================================================="
`;
    const blob = new Blob([scriptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "install_debian_service.sh";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerNotification("Script de instalación 'install_debian_service.sh' descargado con éxito.", "success");
  };

  // Original GitHub Sync updater sequence
  const executeGitSync = (targetSha: string, message: string, author: string, date: string) => {
    if (updating || rebooting) return;
    setUpdating(true);
    setUpdateProgress(0);
    setUpdateLogs([
      `⚡ [GIT PULL] Contactando con GitHub en https://github.com/${gitOwner}/${gitRepo}/tree/${gitBranch}...`,
      `🔧 [DAEMON] Iniciando auto-actualización del sistema operativo CMineWar OS`,
      `📦 [MANIFEST] Descargando manifiesto de archivos modificado en el commit ${targetSha.substring(0, 7)}...`,
      `📝 [COMMIT REVELADO] "${message}" de ${author}`,
    ]);

    const syncSteps = [
      "🔍 [STAGE 1] Comparando árboles de archivos lógicos locales contra repos remotos...",
      `📥 [PULL] Descargando archivos parcheados en el de desarrollo...`,
      "📄 [PATCH] Analizando diferencias de código en /src/App.tsx (+45 líneas, -12 líneas)",
      "🔬 [LINTING] Corriendo verificaciones lógicas de compilación en caliente... 100% Correctas",
      "BUILD: compilando y empaquetando sistema...",
      "🔄 [SYNC] ¡Sincronizado completamente sin errores de memoria!"
    ];

    let currentStep = 0;
    const progressTimer = setInterval(() => {
      setUpdateProgress((prev) => {
        const next = Math.min(prev + 15, 100);
        if (currentStep < syncSteps.length && next > (currentStep * 15)) {
          setUpdateLogs((old) => [...old, syncSteps[currentStep]]);
          currentStep++;
        }
        if (next >= 100) {
          clearInterval(progressTimer);
          setInstalledSha(targetSha);
          setInstalledMessage(message);
          setInstalledDate(date);
          setUpdating(false);
          setRebooting(true);
          
          setRebootLogs([
            "Reiniciando el kernel de CMineWar OS...",
            "Iniciando gestor de sesiones CMineWar-Session...",
            "¡El sistema se ha auto-actualizado de GitHub con éxito!"
          ]);
          setTimeout(() => {
            setRebooting(false);
            triggerNotification(`¡CMineWar OS actualizado y reiniciado con éxito de GitHub!`, "success");
          }, 2000);
        }
        return next;
      });
    }, 400);
  };

  // Custom Kernel & Bootloader Compilation engine
  const executeKernelBootloaderUpdate = (type: "kernel" | "bootloader" | "both") => {
    if (updating || rebooting) return;
    setUpdating(true);
    setUpdateProgress(0);
    
    let baseLogs: string[] = [];
    if (type === "kernel") {
      baseLogs = [
        "⚡ [KERNEL UPDATE] Iniciando descarga de código fuente del kernel cminewar-core v6.10...",
        "🔧 [COMPILADOR] Extrayendo ficheros bzImage e initrd.img...",
      ];
    } else if (type === "bootloader") {
      baseLogs = [
        "⚡ [BOOTLOADER UPDATE] Obteniendo definición MBR del cargador de arranque CMineWar-GRUB v2.06...",
        "🔧 [DISCO] Preparando tabla de partición LBA activa...",
      ];
    } else {
      baseLogs = [
        "⚡ [NUCLEO INTEGRAL] Actualizando Kernel y Bootloader del sistema completo desde GitHub...",
        "🔧 [SISTEMA] Iniciando compilación cruzada multiproceso para Debian...",
      ];
    }

    setUpdateLogs(baseLogs);

    const steps = type === "kernel" ? [
      "🔍 [CONFIG] Cargando plantilla de compilación cminewar_defconfig...",
      "🛠️ [MAKE] Compilando bzImage (Kernel comprimido) listo... OK",
      "📦 [MODULES] Empaquetando módulos depurables en /lib/modules/6.10.8...",
      "🚀 [INSTALL] Sobrescribiendo /boot/vmlinuz-6.10-cminewar-core...",
    ] : type === "bootloader" ? [
      "🔍 [STAGE 1] Comprobando compatibilidad de bloques en disco /dev/vda...",
      "🛠️ [GRUB-INSTALL] Copiando archivos de arranque a /boot/grub/i386-pc/...",
      "💾 [MBR] Escribiendo bootstrap en el primer sector físico del disco...",
      "✔ [OK] Configuración de arranque CMineWar-GRUB actualizada con éxito.",
    ] : [
      "🔍 [CONFIG] Sincronizando árbol git contra compilación remota...",
      "🛠️ Compilando nuevo Kernel v6.10.8-cminewar-generic_x86_64...",
      "📦 Empaquetando ramdisk initrd virtual...",
      "💾 Escribiendo MBR-GRUB v2.06 bootloader blocks...",
      "✔ [SISTEMA RECOMPILADO] Núcleo y cargadores actualizados.",
    ];

    let currentStep = 0;
    const progressTimer = setInterval(() => {
      setUpdateProgress((prev) => {
        const next = Math.min(prev + 12, 100);
        if (currentStep < steps.length && next > (currentStep * 15)) {
          setUpdateLogs((old) => [...old, steps[currentStep]]);
          currentStep++;
        }
        if (next >= 100) {
          clearInterval(progressTimer);
          if (type === "kernel" || type === "both") {
            setActiveKernel("v6.10.8-cminewar-patched-x86_64");
            localStorage.setItem("cminewar_kernel_version", "v6.10.8-cminewar-patched-x86_64");
          }
          if (type === "bootloader" || type === "both") {
            setActiveBootloader("CMineWar-GRUB MBR v2.06-patched");
            localStorage.setItem("cminewar_bootloader_version", "CMineWar-GRUB MBR v2.06-patched");
          }
          setUpdating(false);
          setRebooting(true);
          
          setRebootLogs([
            "Consolidando cambios de almacenamiento...",
            "Reiniciando el kernel para aplicar los nuevos parches del sistema...",
            "Montando el nuevo kernel v6.10.8 con soporte optimizado udev...",
            "¡El kernel se ha re-compilado e iniciado óptimamente!"
          ]);
          setTimeout(() => {
            setRebooting(false);
            triggerNotification(`¡Núcleo y Kernel actualizados con éxito!`, "success");
          }, 2400);
        }
        return next;
      });
    }, 350);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-300 min-h-0 select-none relative font-sans h-full">
      
      {/* Visual Reboot Overlay */}
      {rebooting && (
        <div ref={rebootLogContainerRef} className="absolute inset-0 bg-slate-950 z-[9999] p-6 flex flex-col font-mono text-xs text-emerald-400 select-none overflow-y-auto">
          <div className="max-w-xl mx-auto w-full space-y-2 py-4">
            <div className="flex items-center space-x-2 text-emerald-300 border-b border-emerald-950 pb-2 mb-3">
              <RefreshCw className="animate-spin text-emerald-400" size={16} />
              <span className="font-bold uppercase tracking-wider text-[11px]">Control System: Sincronizando Módulos</span>
            </div>
            <div className="space-y-1 text-[11px]">
              {rebootLogs.map((log, idx) => (
                <div key={idx} className="text-slate-300">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center shadow-lg shadow-pink-500/5">
            <Settings className="text-pink-400 w-5 h-5 animate-spin" style={{ animationDuration: '40s' }} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center space-x-2">
              <span>Panel de Ajustes Globales de Hardware</span>
              <span className="px-1.5 py-0.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded text-[8px] font-mono select-none font-bold">
                OLD-CONTROL-PANEL
              </span>
            </h3>
            <p className="text-[10px] text-slate-500">Configuración total de comunicaciones, resolución de pantalla, APK móvil y cajón de paquetes de Linux.</p>
          </div>
        </div>

        {/* Home Button to return to index category view */}
        {activeTab !== "index" && (
          <button
            onClick={() => setActiveTab("index")}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 transition"
          >
            <LayoutGrid size={12} className="text-pink-400" />
            <span>Inicio Panel</span>
          </button>
        )}
      </div>

      {/* Primary Categories Grid (Old Windows Control Panel Style) */}
      {activeTab === "index" ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-bold font-mono uppercase text-slate-500 tracking-widest text-left block">Selecciona una categoría de hardware o sistema:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              
              {/* Card 1: WiFi */}
              <button
                onClick={() => setActiveTab("wifi")}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-cyan-500/50 transition duration-200 text-left flex flex-col justify-between group h-32"
              >
                <div className="flex justify-between items-start w-full">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Wifi size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className={`w-2 h-2 rounded-full ${wifiEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-700"}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition">Control de Red WiFi</h4>
                  <p className="text-[10px] text-slate-500 mt-1 truncate w-full">Administra SSID, contraseñas y chips iwlwifi o chipsets Host.</p>
                </div>
              </button>

              {/* Card 2: Bluetooth */}
              <button
                onClick={() => setActiveTab("bluetooth")}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-blue-500/50 transition duration-200 text-left flex flex-col justify-between group h-32"
              >
                <div className="flex justify-between items-start w-full">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Bluetooth size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className={`w-2 h-2 rounded-full ${btEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-700"}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition">Conexiones Bluetooth</h4>
                  <p className="text-[10px] text-slate-500 mt-1 truncate w-full">Escanea dispositivos externos, vincula audios y gamepads.</p>
                </div>
              </button>

              {/* Card 3: Ethernet */}
              <button
                onClick={() => setActiveTab("ethernet")}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/50 transition duration-200 text-left flex flex-col justify-between group h-32"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Network size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition">Ethernet Cableada</h4>
                  <p className="text-[10px] text-slate-500 mt-1 truncate w-full">Direccionamiento estático de IP local, DHCP, DNS y gateways.</p>
                </div>
              </button>

              {/* Card 4: LTE cellular */}
              <button
                onClick={() => setActiveTab("lte")}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-violet-500/50 transition duration-200 text-left flex flex-col justify-between group h-32"
              >
                <div className="flex justify-between items-start w-full">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Radio size={16} className="text-violet-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className={`w-2 h-2 rounded-full ${lteEnabled ? "bg-violet-400 animate-pulse" : "bg-slate-700"}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition"> LTE Banda Ancha</h4>
                  <p className="text-[10px] text-slate-500 mt-1 truncate w-full">Configura tarjetas SIM físicas y control de ModemManager.</p>
                </div>
              </button>

              {/* Card 5: Screen settings */}
              <button
                onClick={() => setActiveTab("display")}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-pink-500/50 transition duration-200 text-left flex flex-col justify-between group h-32"
              >
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <Tv size={16} className="text-pink-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-pink-400 transition">Ajuste de Pantalla</h4>
                  <p className="text-[10px] text-slate-500 mt-1 truncate w-full">Resolución del sistema, escala interactiva y control de rotación.</p>
                </div>
              </button>

              {/* Card 6: Android APK */}
              <button
                onClick={() => setActiveTab("apk")}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-yellow-500/50 transition duration-200 text-left flex flex-col justify-between group h-32"
              >
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <Smartphone size={16} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-yellow-400 transition">Android APK & Rotación</h4>
                  <p className="text-[10px] text-slate-500 mt-1 truncate w-full">Configura el WebView para el móvil, con rotación en vivo.</p>
                </div>
              </button>

              {/* Card 7: Package Center installer */}
              <button
                onClick={() => setActiveTab("packages")}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-400/50 transition duration-200 text-left flex flex-col justify-between group h-32"
                id="btn-category-packages"
              >
                <div className="flex justify-between items-start w-full">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <LayoutGrid size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold font-mono">
                    {installedPackages.length} INST
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition">Centro de Paquetes</h4>
                  <p className="text-[10px] text-slate-500 mt-1 truncate w-full">Instala programas (`htop`, `retroarch`, etc.) para tu cajón de app drawer.</p>
                </div>
              </button>

              {/* Card 8: GitHub AutoSync tool */}
              <button
                onClick={() => setActiveTab("github")}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-400/50 transition duration-200 text-left flex flex-col justify-between group h-32"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
                  <Github size={16} className="text-slate-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-slate-400 transition">Sincronizador GitHub</h4>
                  <p className="text-[10px] text-slate-500 mt-1 truncate w-full">Configura y sintoniza commits de código caliente con repositorios.</p>
                </div>
              </button>

              {/* Card 9: LAN Access & WAN Firewall */}
              <button
                onClick={() => setActiveTab("lan_security")}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-red-500/50 transition duration-200 text-left flex flex-col justify-between group h-32"
                id="btn-category-lan-security"
                title="Configura el cortafuegos, bloquea conexiones a internet y habilita la red local"
              >
                <div className="flex justify-between items-start w-full">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <ShieldAlert size={16} className="text-rose-450 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${wanBlocked ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"}`}>
                    {wanBlocked ? "WAN BLOQUEADA" : "LAN+WAN LIBRE"}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-rose-400 transition">Cortafuegos y Red Local</h4>
                  <p className="text-[10px] text-slate-500 mt-1 truncate w-full">Habilita acceso web local y bloquea accesos externos de Internet.</p>
                </div>
              </button>

            </div>
          </div>
        </div>
      ) : null}

      {/* SECTION 1: WiFi Screen */}
      {activeTab === "wifi" && (
        <div className="flex-1 p-5 overflow-y-auto max-w-xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <Wifi size={14} className="text-cyan-400" />
                <span>Configuración de Red Inalámbrica WiFi</span>
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Define los puntos de acceso y analiza la operabilidad del chip virtual.</p>
            </div>
            
            <button
              onClick={() => setWifiEnabled(!wifiEnabled)}
              className="p-1 hover:bg-slate-950/60 rounded transition"
              id="btn-toggle-wifi"
            >
              {wifiEnabled ? (
                <span className="text-emerald-400 flex items-center space-x-1 font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span>ACTIVO</span>
                  <ToggleRight size={24} className="text-emerald-400" />
                </span>
              ) : (
                <span className="text-slate-500 flex items-center space-x-1 font-mono text-[10px]">
                  <span>APAGADO</span>
                  <ToggleLeft size={24} className="text-slate-600" />
                </span>
              )}
            </button>
          </div>

          {wifiEnabled ? (
            <div className="space-y-3">
              {connectingWifi && (
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-cyan-400 animate-pulse">Estableciendo Handshake WPA3 con {connectingWifi}...</span>
                    <span>{wifiProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1 rounded overflow-hidden">
                    <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${wifiProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="bg-slate-950/40 rounded-xl border border-slate-800/80 divide-y divide-slate-900 select-none">
                {wifiList.map((net) => (
                  <div key={net.ssid} className="p-3 flex items-center justify-between hover:bg-slate-950/80 transition">
                    <div className="flex items-center space-x-3">
                      <Wifi size={13} className={net.status === "connected" ? "text-emerald-400" : "text-slate-400"} />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-200 block">{net.ssid}</span>
                        <span className="text-[10px] text-slate-500">Señal: {net.signal}% • Segura: {net.lock ? "WPA3 / AES" : "Abierta"}</span>
                      </div>
                    </div>
                    <div>
                      {net.status === "connected" ? (
                        <span className="px-2 py-0.5 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full font-bold">
                          CONECTADO
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConnectWifi(net.ssid)}
                          disabled={connectingWifi !== null}
                          className="px-2.5 py-1 text-[10px] font-bold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded transition"
                        >
                          Conectar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl text-slate-500 text-[10px] font-mono leading-relaxed">
                📶 <span className="text-slate-400 font-bold uppercase block mb-1">Hardware Interface Diagnostics:</span>
                Interface: wlan0 <br />
                Device Chipset: Intel Centrino Ultimate-N 6300 (PCIe bus) <br />
                Controlador kernel: iwlwifi-firmware-6300u.ucode v5.16 <br />
                Status link: {selectedWifi ? `Active (SSID: ${selectedWifi})` : "Disconnected"}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 select-none bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              La tarjeta de red inalámbrica está desactivada en CMineWar OS. Actívala arriba para buscar redes.
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: Bluetooth Screen */}
      {activeTab === "bluetooth" && (
        <div className="flex-1 p-5 overflow-y-auto max-w-xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <Bluetooth size={14} className="text-blue-400" />
                <span>Configuración y Periféricos Bluetooth</span>
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Administra dongles inalámbricos de entrada y audio compatible con bluez.</p>
            </div>
            
            <button
              onClick={() => setBtEnabled(!btEnabled)}
              className="p-1 hover:bg-slate-950/60 rounded transition"
              id="btn-toggle-bt"
            >
              {btEnabled ? (
                <span className="text-emerald-400 flex items-center space-x-1 font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span>ACTIVO</span>
                  <ToggleRight size={24} className="text-emerald-400" />
                </span>
              ) : (
                <span className="text-slate-500 flex items-center space-x-1 font-mono text-[10px]">
                  <span>APAGADO</span>
                  <ToggleLeft size={24} className="text-slate-600" />
                </span>
              )}
            </button>
          </div>

          {btEnabled ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">¿Deseas buscar nuevos dispositivos bluetooth?</span>
                <button
                  onClick={handleScanBt}
                  disabled={btScanning}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition"
                >
                  {btScanning ? "Escaneando cerca..." : "Escanear Periféricos"}
                </button>
              </div>

              {btScanResults.length > 0 && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-blue-400 font-bold block">Dispositivos Encontrados (En el rango):</span>
                  <div className="divide-y divide-slate-900 space-y-2">
                    {btScanResults.map((dev) => (
                      <div key={dev} className="flex justify-between items-center pt-2 text-xs">
                        <span className="font-mono">{dev}</span>
                        <button
                          onClick={() => {
                            setDevicesList((old) => [...old, { name: dev, paired: true, connected: true, type: "audio" }]);
                            setBtScanResults((old) => old.filter((o) => o !== dev));
                            triggerNotification(`Emparejado: ${dev}`, "success");
                          }}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-900/60 text-emerald-400 text-[10px] font-mono border border-slate-800 rounded"
                        >
                          [Emparejar dispositivo]
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-950/40 rounded-xl border border-slate-800 divide-y divide-slate-900">
                {devicesList.map((dev) => (
                  <div key={dev.name} className="p-3 flex items-center justify-between hover:bg-slate-950/80 transition">
                    <div className="flex items-center space-x-3">
                      <Bluetooth size={13} className={dev.connected ? "text-blue-400" : "text-slate-500"} />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-200 block">{dev.name}</span>
                        <span className="text-[10px] text-slate-500">Servicios: {dev.type === "audio" ? "A2DP Sink Core" : "HID Input"} • Código vinculación: Sincronizado</span>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => handlePairBt(dev.name)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition border ${
                          dev.connected
                            ? "bg-rose-950 border-rose-900 text-rose-300 hover:bg-rose-900 hover:text-white"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {dev.connected ? "Desconectar" : "Conectar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 text-slate-500 text-[10px] font-mono leading-relaxed">
                🔵 <span className="text-slate-400 font-bold uppercase block mb-1">bluez Software Stack info:</span>
                Daemon: bluetoothd (v5.64) <br />
                Controller path: /org/bluez/hci0 <br />
                BD_ADDR: C4:15:F6:A3:89:D2 <br />
                Driver kernel: btusb.ko v5.16
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 select-none bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              Bluetooth está desactivado en ClawOS. Actívalo en el switch superior para buscar periféricos.
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: Ethernet Cableada */}
      {activeTab === "ethernet" && (
        <div className="flex-1 p-5 overflow-y-auto max-w-xl mx-auto w-full space-y-4" id="view-ethernet-panel">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <Network size={14} className="text-emerald-400" />
              <span>Configuración Ethernet ( eth0 Virtual Link )</span>
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Asigna direccionamiento IP, servidores DNS y monitorea la trama GigE.</p>
          </div>

          <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-450 font-semibold font-mono">Modo de configuración de IP:</span>
              <div className="flex bg-slate-900 rounded border border-slate-800 p-0.5 text-[10px]">
                <button
                  onClick={() => setEthMode("dhcp")}
                  className={`px-3 py-1 rounded transition ${ethMode === "dhcp" ? "bg-slate-950 text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-300"}`}
                >
                  DHCP Automático
                </button>
                <button
                  onClick={() => setEthMode("static")}
                  className={`px-3 py-1 rounded transition ${ethMode === "static" ? "bg-slate-950 text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-300"}`}
                >
                  IP Estática
                </button>
              </div>
            </div>

            {ethMode === "dhcp" ? (
              <div className="space-y-2 pt-2 border-t border-slate-900 text-xs">
                <div className="flex justify-between font-mono py-1">
                  <span className="text-slate-500">IP Asignada DHCP:</span>
                  <span className="text-slate-200 font-bold">192.168.1.135 (Reservada)</span>
                </div>
                <div className="flex justify-between font-mono py-1">
                  <span className="text-slate-500">Mascara subred (CIDR):</span>
                  <span className="text-slate-200">255.255.255.0 (/24)</span>
                </div>
                <div className="flex justify-between font-mono py-1">
                  <span className="text-slate-500">Puerta de enlace predeterminada:</span>
                  <span className="text-slate-200">192.168.1.1</span>
                </div>
                <div className="flex justify-between font-mono py-1">
                  <span className="text-slate-500">DNS Server primario:</span>
                  <span className="text-slate-200">1.1.1.1 (Cloudflare Edge)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2 border-t border-slate-900 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-slate-500 block">Dirección IP Estática:</label>
                  <input
                    type="text"
                    value={ethIp}
                    onChange={(e) => setEthIp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 focus:border-emerald-500 text-slate-100 font-mono text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-slate-500 block">Máscara de Subred:</label>
                  <input
                    type="text"
                    value={ethMask}
                    onChange={(e) => setEthMask(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 focus:border-emerald-500 text-slate-100 font-mono text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-slate-500 block">Puerta de Enlace (Router Gateway):</label>
                  <input
                    type="text"
                    value={ethGateway}
                    onChange={(e) => setEthGateway(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 focus:border-emerald-500 text-slate-100 font-mono text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-slate-500 block">DNS Server:</label>
                  <input
                    type="text"
                    value={ethDns}
                    onChange={(e) => setEthDns(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 focus:border-emerald-500 text-slate-100 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => triggerNotification("Configuración de IPv4 estática guardada con éxito", "success")}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded"
                  >
                    Aplicar Dirección Estática
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 text-slate-500 text-[10px] font-mono leading-relaxed">
            🕸️ <span className="text-slate-400 font-bold uppercase block mb-1">Ethernet NIC Device Telemetry:</span>
            Interface: eth0 (Virtual PCIe Link) <br />
            Speed: 1000 Mbps Full Duplex (Gigabit Ethernet) <br />
            Link Mode: Auto-negotiation active <br />
            MAC ADDRESS: 52:54:00:12:34:56
          </div>
        </div>
      )}

      {/* SECTION 4: LTE cellular broad-band */}
      {activeTab === "lte" && (
        <div className="flex-1 p-5 overflow-y-auto max-w-xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <Radio size={14} className="text-violet-400" />
                <span>Módem Celular Móvil LTE / 5G</span>
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Controla la inicialización de tarjetas SIM mediante la pila ModemManager del Kernel.</p>
            </div>
            
            <button
              onClick={() => setLteEnabled(!lteEnabled)}
              className="p-1 hover:bg-slate-950/60 rounded transition"
              id="btn-toggle-lte"
            >
              {lteEnabled ? (
                <span className="text-emerald-400 flex items-center space-x-1 font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span>ACTIVO</span>
                  <ToggleRight size={24} className="text-emerald-400" />
                </span>
              ) : (
                <span className="text-slate-500 flex items-center space-x-1 font-mono text-[10px]">
                  <span>APAGADO</span>
                  <ToggleLeft size={24} className="text-slate-600" />
                </span>
              )}
            </button>
          </div>

          {lteEnabled ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                  <span className="text-[8.5px] uppercase font-mono text-slate-500 font-bold block">Intensidad de Señal Celular</span>
                  <div className="flex items-end space-x-1 h-10 py-1">
                    <div className="w-2 h-2 rounded bg-violet-400" />
                    <div className="w-2 h-4 rounded bg-violet-400" />
                    <div className="w-2 h-6 rounded bg-violet-400" />
                    <div className="w-2 h-8 rounded bg-violet-400" />
                    <div className="w-2 h-10 rounded bg-slate-800 animate-pulse" />
                    <span className="text-xs font-bold font-mono text-violet-400 ml-2">Excelente (LTE+)</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-center space-y-1">
                  <span className="text-[8.5px] uppercase font-mono text-slate-500 font-bold block">Operador Móvil Enlazado:</span>
                  <span className="text-xs font-mono text-slate-100 font-bold flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" /> {selectedCarrier}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-slate-550 block">Punto de Acceso del Operador (APN Settings):</label>
                  <input
                    type="text"
                    value={apnPlausible}
                    onChange={(e) => setApnPlausible(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 focus:border-violet-500 text-slate-100 font-mono text-xs focus:outline-none"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => triggerNotification("APN Celular configurada con éxito", "success")}
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded"
                  >
                    Guardar Config APN
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 text-slate-500 text-[10px] font-mono leading-relaxed">
                📱 <span className="text-slate-400 font-bold uppercase block mb-1">ModemManager protocol stack:</span>
                Driver: qmi_wwan (Qualcomm Gobi LTE driver) <br />
                Modem state: Connected <br />
                SIM details: MVNO eSIM integrated <br />
                CDC network port: wwan0
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 select-none bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              Servicio de datos móviles LTE/5G desactivado en el Kernel. Actívalo en el switch de arriba.
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: Display & Viewport settings */}
      {activeTab === "display" && (
        <div className="flex-1 p-5 overflow-y-auto max-w-xl mx-auto w-full space-y-4" id="view-display-settings-view">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <Tv size={14} className="text-pink-400" />
              <span>Configuración de Pantalla, Orientación y Escala</span>
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Controla la resolución de salida, escala global y rotación del chasis virtual.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Resolution Selector */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 text-xs text-left">
              <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Resolución de Salida:</span>
              <div className="space-y-2">
                {["auto", "1920x1080", "1366x768", "1080x1920", "720x1280"].map((res) => (
                  <button
                    key={res}
                    onClick={() => {
                      setCurrentResolution(res);
                      triggerNotification(`Resolución de pantalla cambiada a ${res}`, "info");
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded transition font-mono flex justify-between items-center ${
                      currentResolution === res
                        ? "bg-pink-500/15 border border-pink-500/25 text-pink-400 font-bold"
                        : "bg-slate-900 border border-slate-850 text-slate-300 hover:bg-slate-850"
                    }`}
                  >
                    <span>{res === "auto" ? "Auto-Ajustable DSM" : res}</span>
                    <span className="text-[9px] text-slate-500">{res.includes("1080x1920") || res.includes("720x1280") ? "Vertical" : "Horizontal"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated scale and Orientation info */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Escala de Elementos en Pantalla:</span>
                <div className="grid grid-cols-3 gap-2 py-2">
                  {[100, 125, 150].map((sc) => (
                    <button
                      key={sc}
                      onClick={() => {
                        setCurrentScale(sc);
                        triggerNotification(`Escala de elementos fijada al ${sc}%`, "success");
                      }}
                      className={`py-1.5 rounded text-center transition font-semibold text-[11px] ${
                        currentScale === sc
                          ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                          : "bg-slate-900 border border-slate-850 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {sc}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Angle orientation sensor */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 text-xs">
                <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Consola del Sensor de Rotación Móvil:</span>
                <div className="space-y-1.5 font-mono text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giroscopio Físico:</span>
                    <span className="text-emerald-400 font-bold">Activo & Preparado</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Orientación Detectada:</span>
                    <span className="text-pink-400 font-bold uppercase">{actualOrientation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Escalado Vertical DSM:</span>
                    <span className="text-slate-350">{actualOrientation === "portrait" ? "AJUSTADO (9:16)" : "Sintonizado (16:9)"}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const newSim = simulatedOrientation === "landscape" ? "portrait" : "landscape";
                    setSimulatedOrientation(newSim);
                    // Force rotation alert info
                    triggerNotification(`Giroscopio simulado cambiado a ${newSim.toUpperCase()}`, "info");
                  }}
                  className="w-full mt-2.5 py-1.5 bg-pink-950 hover:bg-pink-900 text-pink-300 rounded font-semibold text-[10.5px] border border-pink-900/40 transition"
                  id="btn-simulate-rotation"
                >
                  [Girar dispositivo simulación]
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SECTION 6: Android APK Compiler */}
      {activeTab === "apk" && (
        <div className="flex-1 p-5 overflow-y-auto max-w-4xl mx-auto w-full space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <Smartphone size={14} className="text-yellow-400 animate-pulse" />
              <span>Prueba Móvil: Compilador APK & Rotación en Vivo</span>
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Cómo empaquetar la interfaz de CMineWar OS para ejecutarla desde cualquier teléfono móvil con rotación fluida y el logo de la marca.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Left side: Guide & triggers */}
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <Download size={18} className="text-yellow-400 animate-bounce" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-100 block">Soporte nativo Cordova / Capacitor para Android</span>
                    <span className="text-[10px] text-slate-500">Detecta orientación en vivo, adapta barra de estado y el cargador al vuelo.</span>
                  </div>
                </div>

                <p className="text-[10.5px] leading-relaxed text-slate-400 pt-2 border-t border-slate-900">
                  CMineWar OS está programado en su totalidad con estructuras fluidas y modulares para emular con precisión el entorno Synology DSM. Se ajustará perfectamente de forma automática al detectar el cambio de proporciones en el dispositivo. En posición vertical, esconde interfaces densas para facilitar controles limpios al operante.
                </p>

                <div className="text-xs font-mono space-y-1.5 bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                  <div className="flex justify-between">
                    <span>Auto-rotation detection (JS Sensor):</span>
                    <span className="text-emerald-400">ENABLED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Viewport adjust tags:</span>
                    <span className="text-cyan-400">width=device-width, initial-scale=1.0</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleDownloadApkBuildKit}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-slate-950 text-xs font-bold rounded-lg transition"
                  >
                    <Download size={13} fill="currentColor" />
                    <span>Descargar Script Script-Build-APK</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-400 font-sans">
                <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">Alineado Dinámico DSM Móvil:</span>
                <p className="text-[10px]">
                  Al abrir la URL de desarrollo de AI Studio en tu Navegador Web móvil (Chrome/Safari), el sistema detectará al instante si giras la pantalla de tu móvil para adecuar los widgets, barras y el lanzador al vuelo.
                </p>
              </div>
            </div>

            {/* Right side: Interactive Smartphone Emulator Mockup */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 border border-slate-800 rounded-2xl relative">
              <span className="text-[9px] uppercase font-mono text-slate-500 font-bold mb-3 block text-center">Simulador de Chasis del Emulador Móvil</span>

              {/* Toggle switch */}
              <button
                onClick={() => setSimulatedOrientation(old => old === "landscape" ? "portrait" : "landscape")}
                className="mb-4 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-[10px] text-yellow-400 font-bold hover:bg-slate-850 flex items-center space-x-1.5 transition select-none shadow"
              >
                <RotateCcw size={10} className="text-yellow-400" />
                <span>Girar Teléfono: {simulatedOrientation === "landscape" ? "Horizontal" : "Vertical"}</span>
              </button>

              {/* Physical phone outline */}
              <div 
                className="bg-slate-950 border-[5px] border-slate-800 rounded-[36px] p-2.5 shadow-2xl transition-all duration-500 relative flex items-center justify-center overflow-hidden border-t-[8px]"
                style={{
                  width: simulatedOrientation === "portrait" ? "210px" : "340px",
                  height: simulatedOrientation === "portrait" ? "340px" : "210px"
                }}
              >
                {/* Micro camera notch */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                </div>

                {/* Inner simulated screen */}
                <div className="w-full h-full bg-slate-900 rounded-[24px] overflow-hidden flex flex-col relative text-[9px] select-none text-slate-300">
                  {/* Lock bar status */}
                  <div className="bg-slate-950/90 py-1 px-3 text-[8.5px] flex justify-between font-mono shrink-0 select-none z-10 border-b border-slate-850 text-[7px]">
                    <span className="text-slate-400">12:35 PM</span>
                    <div className="flex space-x-1 text-slate-400 items-center">
                      <Wifi size={8} className="text-emerald-400" />
                      <span className="text-emerald-400 text-[6.5px]">5G</span>
                      <span className="w-3.5 h-1.5 bg-slate-400 border border-slate-500 rounded-sm inline-block" />
                    </div>
                  </div>

                  {/* Wallpaper viewport */}
                  <div className="flex-1 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-pink-950/35 p-3 flex flex-col items-center justify-between relative">
                    
                    {/* Top indicator title */}
                    <div className="text-center font-mono text-[7px] text-slate-500">
                      CMineWar OS Mobile Pro
                    </div>

                    {/* App icon on lock screen/launcher */}
                    <div 
                      onClick={() => triggerNotification("Iniciando emulador móvil CMineWar OS...", "success")}
                      className="text-center space-y-2 cursor-pointer group flex flex-col items-center"
                    >
                      <div className="w-12 h-12 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-center shadow shadow-pink-500/10 group-hover:scale-105 active:scale-95 transition-transform p-1">
                        <DragonLogo size={42} glow={true} className="text-white" />
                      </div>
                      <span className="font-sans font-extrabold text-[9px] text-slate-100 group-hover:text-yellow-400 block tracking-tight">CMineWar OS Mobile</span>
                    </div>

                    {/* Hint text bottom */}
                    <div className="text-[7.5px] text-slate-500 text-center uppercase font-bold animate-pulse">
                      [Tocar el logo para arrancar]
                    </div>

                    {/* Home Indicator bar */}
                    <div className="w-16 h-1 bg-slate-800 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 9: LAN Local Access & WAN Firewall */}
      {activeTab === "lan_security" && (
        <div className="flex-1 p-5 overflow-y-auto max-w-2xl mx-auto w-full space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <ShieldAlert size={14} className="text-rose-400 animate-pulse" />
              <span>Cortafuegos del Sistema & Red de Acceso Local (LAN)</span>
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Permite conectar clientes de la red doméstica y aisla el equipo de llamadas de Internet externas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: WAN Internet Blocker */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3.5 text-left">
              <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Protección Anti-WAN:</span>
              
              <div className="flex items-center justify-between py-1 bg-slate-900 px-2.5 rounded-lg border border-slate-850">
                <span className="text-xs text-slate-300 font-semibold">Bloquear Internet (WAN)</span>
                <button
                  onClick={toggleWanFirewall}
                  className="p-0.5 hover:bg-slate-950 rounded transition"
                  id="btn-toggle-wan-block"
                >
                  {wanBlocked ? (
                    <span className="text-red-400 flex items-center space-x-1">
                      <span className="text-[9px] font-mono font-bold uppercase mr-1 px-1.5 py-0.5 bg-red-400/10 border border-red-400/20 rounded">BLOQUEADO</span>
                      <ToggleRight size={26} className="text-red-450" />
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <span className="text-[9px] font-mono mr-1">Permitido</span>
                      <ToggleLeft size={26} className="text-slate-500" />
                    </span>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                Al activar este modo, CMineWar OS aislará por completo el espacio de red de llamadas de Internet externas, manteniendo las carpetas y conexiones accesibles únicamente dentro de la red local (LAN).
              </p>

              {/* Network flow mockup */}
              <div className="p-2.5 bg-slate-900 rounded font-mono text-[9px] leading-relaxed border border-slate-850/60 text-slate-400">
                <div className="flex justify-between py-0.5">
                  <span>Interfaz local (eth0/wlan0):</span>
                  <span className="text-emerald-400 font-bold">ACTIVA</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Tráfico red interna (LAN):</span>
                  <span className="text-emerald-400 font-semibold">PERMITIDO (Aislado)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Rutas pasarela de Internet:</span>
                  <span className={wanBlocked ? "text-red-400 font-black" : "text-emerald-400 font-semibold"}>
                    {wanBlocked ? "🔒 RECHAZADO (DROP)" : "✔ ABIERTO (WAN)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: LAN Local Web Server listening */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3.5 text-left flex flex-col justify-between">
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Enlace de Servidor en Red Local (LAN):</span>
                <div className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg space-y-1">
                  <span className="text-[8px] font-mono text-slate-500 block">URL de Acceso Local activa:</span>
                  <span className="text-cyan-400 font-mono text-xs font-bold block">
                    http://{ethIp}:3000
                  </span>
                </div>
                <p className="text-[10px] text-slate-405 leading-relaxed">
                  Cualquier ordenador o móvil de la red wifi de tu hogar u oficina puede acceder a la interfaz web de CMineWar OS desde su navegador tecleando esa dirección IP.
                </p>
              </div>

              {/* LAN client lists */}
              <div className="space-y-1.5 border-t border-slate-900 pt-2">
                <span className="text-[9px] uppercase font-mono text-slate-550 block font-bold">Clientes LAN Diagnosticados:</span>
                <div className="space-y-1 max-h-20 overflow-y-auto scrollbar-thin">
                  {[
                    { ip: "192.168.1.10", name: "Móvil de CMineWar (Emulador)", type: "phone", status: "Permitido (LAN)" },
                    { ip: "192.168.1.42", name: "Tablet Dormitorio", type: "tablet", status: "Permitido (LAN)" },
                    { ip: "192.168.1.18", name: "Smart TV Salón", type: "tv", status: "Permitido (LAN)" },
                    { ip: "8.8.8.8", name: "DNS Resolver WAN", type: "external", status: "Bloqueado" },
                  ].map((client) => {
                    const isExternal = client.type === "external";
                    const isBlocked = wanBlocked && isExternal;
                    return (
                      <div key={client.ip} className="flex justify-between text-[8px] font-mono py-0.5 border-b border-slate-900/40">
                        <span className="text-slate-350 truncate max-w-[125px]">{client.name}</span>
                        <span className={isBlocked ? "text-rose-450" : "text-emerald-400"}>
                          {isBlocked ? "🔒 DROP" : "🟢 LAN"} • {client.ip}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* QR code scanning simulation */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-left">
            <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Escanear enlace para móvil o tablet:</span>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Simulated Elegant Vector QR Code */}
              <div className="w-20 h-20 bg-white p-2 rounded-lg flex flex-col justify-between shrink-0 relative hover:scale-105 transition-transform duration-300">
                <div className="grid grid-cols-4 gap-0.5 flex-1 p-0.5">
                  {[
                    1,0,1,1,
                    0,1,0,1,
                    1,0,0,1,
                    1,1,1,0
                  ].map((px, i) => (
                    <div key={i} className={`rounded-sm ${px === 1 ? 'bg-slate-950' : 'bg-transparent'}`} />
                  ))}
                </div>
                {/* Visual marker squares */}
                <div className="absolute top-1 right-1 w-3.5 h-3.5 border-2 border-slate-950 bg-white" />
                <div className="absolute top-1 left-1/3 w-3.5 h-3.5 border-2 border-slate-950 bg-white" />
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border-2 border-slate-950 bg-white" />
              </div>

              <div className="text-xs space-y-1.5 flex-1 leading-relaxed text-slate-400">
                <span className="font-bold text-slate-100 block">Acceso inalámbrico instantáneo</span>
                <p className="text-[10px]">
                  Apunta tu teléfono al código QR para capturar de inmediato el enlace local. Al sintonizarse por sockets, la pantalla de tu móvil servirá como terminal inalámbrico para CMineWar OS.
                </p>
                <div className="text-[9px] font-mono text-cyan-400">
                  IP LAN: {ethIp} • Canal: WiFi {selectedWifi}
                </div>
              </div>
            </div>
          </div>

          {/* Debian Integration Workspace */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3.5 text-left">
            <div className="flex items-center space-x-2 text-rose-450">
              <Laptop size={14} className="text-cyan-400" />
              <span className="text-xs uppercase font-mono text-cyan-400 font-bold">Despliegue y Soporte de Debian GNU/Linux:</span>
            </div>

            <p className="text-[10px] text-slate-404 leading-relaxed">
              Puedes ejecutar el servidor completo de CMineWar OS en segundo plano en cualquier ordenador o placa con **Debian**. Se arrancará de inmediato en el puerto <strong className="text-slate-200">3000</strong> exponiéndose para toda tu Red Local (LAN).
            </p>

            {/* Instruction list and Interactive Button */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-850/60">
                <span className="text-[9px] font-mono text-slate-400 font-semibold">Script Automatizado de Systemd y Cortafuegos:</span>
                <button
                  onClick={handleDownloadDebianInstaller}
                  className="flex items-center space-x-1.5 px-2 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-400 text-[10px] font-semibold rounded transition cursor-pointer"
                  id="btn-download-debian-installer"
                >
                  <Download size={11} />
                  <span>Descargar script Debian</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-mono text-slate-350 block font-semibold">Para instalarlo en tu máquina Debian real:</span>
                <div className="p-2 bg-black rounded font-mono text-[9px] text-cyan-300 space-y-1 overflow-x-auto select-all leading-normal">
                  <div># 1. Copia o descarga el script en tu directorio</div>
                  <div>chmod +x install_debian_service.sh</div>
                  <div># 2. Ejecútalo como superusuario (root)</div>
                  <div>sudo ./install_debian_service.sh</div>
                </div>
              </div>

              <div className="space-y-1 text-slate-405">
                <span className="text-[9px] font-mono text-slate-300 block font-bold">🔒 ¿Cómo opera el Cortafuegos de aislamiento (Anti-WAN)?</span>
                <p className="text-[9px] leading-relaxed">
                  El instalador de Debian configura un administrador de red en <code className="text-slate-200 font-mono">/usr/local/bin/cminewar-firewall</code>. Si ejecutas <code className="text-slate-200 font-mono">sudo cminewar-firewall block</code>, se programará <strong className="text-rose-450 font-bold">iptables</strong> de Debian para bloquear todo el tráfico externo hacia internet, mientras mantiene el acceso de los dispositivos locales de tu red LAN (WiFi/Ethernet del hogar) totalmente libre y conectado.
                </p>
              </div>

              <div className="space-y-1 text-slate-405 border-t border-slate-850/60 pt-2">
                <span className="text-[9px] font-mono text-slate-300 block font-bold">🪟 Sincronización Interactiva y Persistencia de Ventanas:</span>
                <p className="text-[9px] leading-relaxed">
                  Las posiciones de las ventanas, coordenadas escaladas, estados activos e IDs de CMineWar OS se graban de manera persistente en perfiles del navegador local. Al acceder desde cualquier móvil o tablet de la red LAN, tu escritorio de CMineWar OS mantendrá el estado preestablecido de tus ventanas intacto, incluso tras reinicios del servidor.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: Package Center & App Drawer Integration */}
      {activeTab === "packages" && (
        <div className="flex-1 p-5 overflow-y-auto max-w-2xl mx-auto w-full space-y-4" id="view-package-installer">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <LayoutGrid size={14} className="text-emerald-400" />
              <span>Centro de Paquetes de Linux y Cajón de Apps DSM</span>
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Instala paquetes de sistema operativos libres en CMineWar OS. Aparecerán al instante en tu Cajón de Aplicaciones del escritorio.</p>
          </div>

          {/* Installation output Logger console */}
          {installingPkg && (
            <div className="p-4 bg-slate-950 border border-emerald-500/20 rounded-xl space-y-3 animate-pulse">
              <div className="flex justify-between text-xs font-mono leading-none text-emerald-300">
                <span className="flex items-center">
                  <RefreshCw size={11} className="mr-1.5 animate-spin" />
                  <span>Configurando archivo de manifiesto interactivo ({installingPkg})...</span>
                </span>
                <span>{pkgInstallProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${pkgInstallProgress}%` }} />
              </div>
              <div 
                ref={pkgLogRef}
                className="h-28 bg-slate-900 p-2 border border-slate-850 rounded font-mono text-[9px] text-emerald-400 overflow-y-auto leading-relaxed flex flex-col space-y-0.5"
              >
                {pkgInstallLog.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap">{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* Catalog grid */}
          <div className="space-y-3.5 select-none">
            {packagesCatalog.map((pkg) => {
              const IconComp = pkg.icon;
              const isInstalled = installedPackages.includes(pkg.id);
              
              return (
                <div key={pkg.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between hover:border-slate-700 transition gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <IconComp size={20} className="text-emerald-400" />
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100">{pkg.name}</span>
                        <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[8.5px] font-mono text-slate-500">{pkg.type}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed max-w-md">{pkg.desc}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isInstalled ? (
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-[10px] uppercase font-mono font-semibold">
                          Instalado
                        </span>
                        <button
                          onClick={() => handleUninstallPackage(pkg.id, pkg.name)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-rose-400 rounded transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInstallPackage(pkg.id, pkg.name)}
                        disabled={installingPkg !== null}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition"
                      >
                        Instalar Paquete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-center text-[10px] leading-relaxed text-slate-500 select-none">
            💡 Puedes ver las aplicaciones instaladas abriendo la barra de tareas de CMineWar OS / Start Menu o el nuevo Cajón de Aplicaciones dynamically actualizados.
          </div>
        </div>
      )}

      {/* SECTION 8: GitHub AutoSync Control panel */}
      {activeTab === "github" && (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          
          {/* Main left view: status & triggers */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 border-r border-slate-800/80">
            {/* Installed State Card */}
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3.5">
              <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500 font-bold block text-left">Compilación de CMineWar OS Instalada</span>
              
              <div className="flex items-start space-x-3 text-left">
                <div className="mt-0.5">
                  <GitCommit className="text-emerald-400 shrink-0 animate-pulse" size={18} />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-200 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded truncate" title={installedSha}>
                      SHA: {installedSha.substring(0, 7)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <GitBranch size={10} className="text-slate-500" />
                      <span>{gitOwner}/{gitRepo}:{gitBranch}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-100 font-medium leading-relaxed italic truncate font-sans" title={installedMessage}>
                    "{installedMessage}"
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Autor de entrega: @{gitOwner} • Sincronizado: {installedDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Daemon control widget */}
            <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-xl space-y-3.5 select-none">
              <div className="flex justify-between items-start text-left">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-250 flex items-center space-x-1.5">
                    <Activity size={13} className="text-emerald-400" />
                    <span>Daemon de Auto-Actualización de GitHub</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm">
                    Revisa en segundo plano el repositorio de GitHub. Si subes código y cambia el commit, CMineWar OS lo detecta y se actualiza de inmediato automáticamente.
                  </p>
                </div>

                <button
                  onClick={() => setIsDaemonActive(!isDaemonActive)}
                  className="p-1 hover:bg-slate-905 rounded transition"
                  id="btn-toggle-daemon"
                >
                  {isDaemonActive ? (
                    <span className="text-emerald-400 flex items-center space-x-1 group">
                      <span className="text-[10px] font-mono font-bold select-none mr-1 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">POLLING</span>
                      <ToggleRight size={28} className="text-emerald-400" />
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center space-x-group">
                      <span className="text-[10px] font-mono mr-1">OFF</span>
                      <ToggleLeft size={28} className="text-slate-600" />
                    </span>
                  )}
                </button>
              </div>

              {isDaemonActive && (
                <div className="grid grid-cols-2 gap-4 text-[10px] font-mono border-t border-slate-900 pt-3 select-none text-slate-400 text-left">
                  <div>
                    <span className="text-slate-500 block uppercase text-[8.5px]">Intervalo:</span>
                    <select
                      value={pollInterval}
                      onChange={(e) => setPollInterval(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-xs text-slate-300 font-mono mt-1 opacity-90 focus:outline-none"
                    >
                      <option value={15}>Cada 15 segundos</option>
                      <option value={30}>Cada 30 s</option>
                      <option value={60}>Cada 1 m</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase text-[8.5px]">Última comprobación:</span>
                    <span className="text-cyan-400 font-semibold block mt-2 text-xs flex items-center">
                      <Clock size={11} className="mr-1.5 animate-pulse text-emerald-400" /> {lastCheckTime}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Manual actions bar */}
            <div className="flex flex-wrap gap-2.5 text-left">
              <button
                onClick={() => {
                  triggerNotification("Buscando commits de CMineWar en GitHub...", "info");
                  loadSimulatedCommits();
                }}
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-200 text-xs font-semibold rounded-lg transition"
              >
                <RefreshCw size={12} className={isFetching ? "animate-spin text-emerald-400" : ""} />
                <span>Refrescar GitHub</span>
              </button>

              <button
                onClick={() => triggerNotification("El software del sistema está sincronizado al 100%", "success")}
                className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-slate-950 border border-slate-900 text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-900/50 transition cursor-pointer"
              >
                <CheckCircle size={12} className="text-emerald-500 mr-1.5" />
                <span>CMineWar OS está al día</span>
              </button>
            </div>

            {/* EXPANDED: FIRMWARE, KERNEL & BOOTLOADER SECTION */}
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4 text-left">
              <div className="border-b border-slate-900 pb-2">
                <span className="text-[9px] uppercase tracking-widest font-mono text-pink-500 font-bold block">
                  ⚙️ Gestión Integral de Firmware, Kernel y Bootloader
                </span>
                <p className="text-[10px] text-slate-550 leading-relaxed mt-1">
                  Re-compila el núcleo del sistema o re-flashea el cargador de arranque MBR directamente desde los repositorios de GitHub.
                </p>
              </div>

              {/* Status information bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono">
                <div className="bg-slate-900/55 p-2.5 rounded-lg border border-slate-900">
                  <span className="text-slate-500 block text-[8px] uppercase">KERNEL ACTIVO DEBIAN:</span>
                  <span className="text-pink-400 font-bold block mt-1 truncate" title={activeKernel}>{activeKernel}</span>
                </div>
                <div className="bg-slate-900/55 p-2.5 rounded-lg border border-slate-900">
                  <span className="text-slate-500 block text-[8px] uppercase">ARRANCADOR (BOOTLOADER):</span>
                  <span className="text-pink-400 font-bold block mt-1 truncate" title={activeBootloader}>{activeBootloader}</span>
                </div>
              </div>

              {/* Trigger actions */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Acciones del compilador de GitHub:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => executeKernelBootloaderUpdate("kernel")}
                    className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-[10px] text-slate-300 font-semibold transition active:scale-95"
                    title="Recompila solo la bzImage de Debian"
                  >
                    Actualizar Kernel
                  </button>
                  <button
                    onClick={() => executeKernelBootloaderUpdate("bootloader")}
                    className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-[10px] text-slate-300 font-semibold transition active:scale-95"
                    title="Flashea el primer sector de arranque GRUB"
                  >
                    Flashear GRUB
                  </button>
                  <button
                    onClick={() => executeKernelBootloaderUpdate("both")}
                    className="p-2 bg-pink-900/30 hover:bg-pink-900/40 border border-pink-500/20 text-pink-400 rounded text-[10px] font-bold transition active:scale-95"
                    title="Actualizar y compilar todo el bloque"
                  >
                    Actualizar Todo
                  </button>
                </div>
              </div>
            </div>

            {/* EXPANDED: NATIVE LINUX RESCUE / SAFE MODE & COMPANION CONTROLS */}
            <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-xl text-left space-y-4">
              <div>
                <span className="text-[9px] uppercase tracking-widest font-mono text-red-400 font-bold block">
                  🛡️ Modo Seguro (Recovery Rescue) y Portal Táctil
                </span>
                <p className="text-[10px] text-slate-550 leading-relaxed mt-1">
                  Configura cargadores alternativos y simula gateways para depurar los parches instalados de Debian.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Safe Mode Switch */}
                <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-900">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-300 block">Modo Seguro de Reparación</span>
                    <span className="text-[9px] text-slate-500 block">Fuerza el arranque en rescue shell con herramientas GitHub.</span>
                  </div>
                  <button
                    onClick={() => {
                      const mode = !isSafeModeArmed;
                      setIsSafeModeArmed(mode);
                      localStorage.setItem("cminewar_safe_mode", String(mode));
                      triggerNotification(mode ? "Modo Seguro ARMADO. Reinicie para entrar en rescue shell." : "Modo Seguro desactivado.", "info");
                    }}
                    className={`px-3 py-1 text-[10px] font-mono font-bold rounded uppercase transition ${
                      isSafeModeArmed 
                        ? "bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse" 
                        : "bg-slate-800 hover:bg-slate-750 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {isSafeModeArmed ? "ARMADO (ON)" : "DESACTIVADO"}
                  </button>
                </div>

                {/* 2. Simulated Android Gateway Switch */}
                <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-900">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-300 block">Simular Gateway Cyberpunk Android</span>
                    <span className="text-[9px] text-slate-500 block">Fuerza a mostrar la selección IP / Demo al iniciar la web en PC.</span>
                  </div>
                  <button
                    onClick={() => {
                      const mode = !forceAndroidSim;
                      setForceAndroidSim(mode);
                      localStorage.setItem("cminewar_force_android", String(mode));
                      triggerNotification(mode ? "Portal Cyberpunk Android activado para el próximo arranque." : "Portal manual de Android desactivado.", "info");
                    }}
                    className={`px-3 py-1 text-[10px] font-mono font-bold rounded uppercase transition ${
                      forceAndroidSim 
                        ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400" 
                        : "bg-slate-800 hover:bg-slate-750 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {forceAndroidSim ? "SIMULAR (ON)" : "NORMAL"}
                  </button>
                </div>

                {/* Emergency manual restart trigger */}
                {isSafeModeArmed && (
                  <button
                    onClick={() => {
                      triggerNotification("Reiniciando el mainframe en Canal Seguro...", "info");
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    }}
                    className="w-full py-2.5 bg-red-650 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-all animate-pulse text-center"
                    id="btn-emergency-safe-reboot"
                  >
                    🚨 [ REINICIAR EN MODO SEGURO AHORA ]
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: repositories setup info */}
          <div className="w-full md:w-[310px] bg-slate-950 p-4 flex flex-col justify-between min-h-0 text-left">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Sintonizador del API</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Sintoniza CMineWar OS con tu propio repositorio público.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-550 block font-bold">Usuario GitHub:</label>
                  <input
                    type="text"
                    value={gitOwner}
                    onChange={(e) => setGitOwner(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-550 block font-bold">Repositorio:</label>
                  <input
                    type="text"
                    value={gitRepo}
                    onChange={(e) => setGitRepo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-550 block font-bold">Rama (Target):</label>
                  <input
                    type="text"
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-900 mt-4">
              <button
                onClick={() => {
                  setGitOwner("cminewarIA");
                  setGitRepo("Myclawos");
                  setGitBranch("main");
                  triggerNotification("Valores sintonizados por defecto.", "info");
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-[10px] text-slate-400 rounded transition"
              >
                <RotateCcw size={11} />
                <span>Por defecto</span>
              </button>
              <button
                onClick={() => triggerNotification("Configuración de repositorio de GitHub guardada", "success")}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded"
              >
                Guardar Config
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Dummy helper sub icons representing components
function CpuThemeIcon(props: any) {
  return <Sliders {...props} />;
}
