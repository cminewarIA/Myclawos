import React, { useState, useEffect, useRef } from "react";
import { VFSNode } from "../types";
import { setNodeAtPath } from "../vfs";
import { 
  Download, 
  HardDrive, 
  CheckCircle, 
  AlertCircle, 
  Terminal as TermIcon, 
  Play, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  RefreshCw,
  Clock,
  Shield,
  Moon,
  Globe,
  Bluetooth,
  Radio,
  Wifi
} from "lucide-react";

interface ClawInstallerProps {
  vfs: VFSNode;
  setVfs: (newVfs: VFSNode) => void;
  openWindow: (windowId: string) => void;
  triggerNotification: (text: string, type: "success" | "info") => void;
}

export default function ClawInstaller({
  vfs,
  setVfs,
  openWindow,
  triggerNotification,
}: ClawInstallerProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  
  const [availableDisks, setAvailableDisks] = useState<{name: string, size: string, type: string, transport: string}[]>([
    { name: "sda", size: "20.0G", type: "disk", transport: "sata" },
    { name: "sdb", size: "128.0G", type: "disk", transport: "usb" },
    { name: "sdc", size: "500.0G", type: "disk", transport: "usb" }
  ]);

  useEffect(() => {
    fetch("/api/cminewar/disks")
      .then(res => res.json())
      .then(data => {
        if (data && data.disks && Array.isArray(data.disks)) {
          setAvailableDisks(data.disks);
          if (data.disks.length > 0) {
            // Predeterminar el primer disco disponible
            setSelectedDisk(data.disks[0].name);
          }
        }
      })
      .catch(err => console.error("Error loading physical disks:", err));
  }, []);
  
  // Custom Kernel & User configuration states
  const [omitStandardUser, setOmitStandardUser] = useState(true);
  const [disableSleep, setDisableSleep] = useState(true);
  const [defaultBrowserChromium, setDefaultBrowserChromium] = useState(true);
  
  // Claw-To-Go portable driver & persistency states
  const [isPortableToGo, setIsPortableToGo] = useState(true);
  const [withUniversalDrivers, setWithUniversalDrivers] = useState(true);
  const [persistenceOnUSB, setPersistenceOnUSB] = useState(true);

  // Dynamic hardware technologies detection
  const [hwChecking, setHwChecking] = useState<boolean>(true);
  const [hasBluetooth, setHasBluetooth] = useState<boolean>(false);
  const [hasWifi, setHasWifi] = useState<boolean>(false);
  const [hasLte, setHasLte] = useState<boolean>(false);

  // Install toggles for each technology, only shown if detected
  const [installBluetooth, setInstallBluetooth] = useState<boolean>(true);
  const [installWifi, setInstallWifi] = useState<boolean>(true);
  const [installLte, setInstallLte] = useState<boolean>(true);

  useEffect(() => {
    const checkHardware = async () => {
      setHwChecking(true);
      
      // Probar soporte real del navegador
      const supportsBluetooth = 'bluetooth' in navigator;
      const supportsWifi = typeof navigator.onLine !== 'undefined';
      
      let supportsLte = false;
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        if (conn.type === 'cellular' || conn.effectiveType === '4g' || conn.effectiveType === '3g') {
          supportsLte = true;
        }
      }
      
      if (navigator.maxTouchPoints > 1 && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        supportsLte = true;
      }

      // Simulamos la alineación en caliente para realismo de bajo nivel
      setTimeout(() => {
        setHasBluetooth(supportsBluetooth);
        setHasWifi(supportsWifi);
        setHasLte(supportsLte);
        
        setInstallBluetooth(supportsBluetooth);
        setInstallWifi(supportsWifi);
        setInstallLte(supportsLte);
        
        setHwChecking(false);
      }, 1200);
    };

    checkHardware();
  }, []);
  
  // Storage selection config
  const [selectedDisk, setSelectedDisk] = useState("sdb"); // Default to portable USB sdb!
  const [partitionSuccess, setPartitionSuccess] = useState(false);
  const [isPartitioning, setIsPartitioning] = useState(false);
  
  // Installation loop process config
  const [installProgress, setInstallProgress] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // ISO dynamic compiler configuration
  const [isGeneratingIso, setIsGeneratingIso] = useState(false);
  const [isoProgress, setIsoProgress] = useState(0);

  const handleDownloadISO = () => {
    if (isGeneratingIso) return;
    setIsGeneratingIso(true);
    setIsoProgress(0);

    const interval = setInterval(() => {
      setIsoProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGeneratingIso(false);

          // Generate detailed retro-structured boot text layout replicating a virtual CD-ROM
          const vfsJson = JSON.stringify(vfs, null, 2);
          const isoDataContent = `========================================================================
CMINEWAR OS LINUX COGNITIVE SYSTEM v1.1.2 ISO-9660 DEPLOYMENT ARCHIVE
========================================================================
Volume Label:  CMINEWAR_LIVE_V112
Publisher:     CMineWar OS Foundation
Architecture:  x86_amd64 / Intel Virtualization Cores
Build Date:    2026-05-28 21:00 UTC
Virtual Size:  142.6 MB

[ BAKED KERNEL PARAMETERS - SELECTED INTEGRATED DIRECTIVES ]
------------------------------------------------------------------------
● AUTOLOGIN TARGET:    ${omitStandardUser ? "Superuser 'root' Direct Mode (No Passwords)" : "Standard User 'user_cminewar_developer'"}
● ACPI POWER SUSPEND:  ${disableSleep ? "DISABLED PERMANENTLY (acpi=off sleep.allow=no)" : "ENABLED STANDARD POLICIES"}
● CORE WEB SUITE:      ${defaultBrowserChromium ? "Chromium Web Browser Defaulting" : "Generic Web Host Controller"}
------------------------------------------------------------------------

* GRUB BOOTLOADER DESCRIPTOR & HARDWARE INVOCATOR *
------------------------------------------------------------------------
cat << 'GRUB_CONFIG'
# /boot/grub/grub.cfg
set default="0"
set timeout=5

menuentry "CMineWar OS - Modo Omarchy (Consola Interactiva TUI/CLI)" {
    search --no-floppy --fs-uuid --set=root e8f2cb38-cc82-411a-8292
    linux /boot/vmlinuz-cminewar console=ttyS0 quiet init=/bin/cminewar-omarchy-init ${disableSleep ? "acpi=off sleep.allow=no" : ""}
    initrd /boot/initramfs-cminewar-direct.img
}

menuentry "CMineWar OS - Modo Kiosco (Entorno Gráfico GUI)" {
    search --no-floppy --fs-uuid --set=root e8f2cb38-cc82-411a-8292
    linux /boot/vmlinuz-cminewar console=ttys0 quiet init=/bin/cminewar-kiosk-init ${disableSleep ? "acpi=off sleep.allow=no" : ""}
    initrd /boot/initramfs-cminewar-direct.img
}

menuentry "CMineWar OS - Modo de Recuperación (System Safe Mode)" {
    linux /boot/vmlinuz-cminewar console=ttyS0 single quiet init=/bin/cminewar-recovery-init
    initrd /boot/initramfs-cminewar-direct.img
}
GRUB_CONFIG

------------------------------------------------------------------------
* RECREATING THE WORKSPACE LOCAL COGNITIVE STRUCTURE (JSON SNAPSHOT) *
------------------------------------------------------------------------
This snapshot matches your current virtual disk environment precisely.
You can import or paste this VFS dump into CMineWar OS back-restores:

VFS_SNAPSHOT_BEGIN
${vfsJson}
VFS_SNAPSHOT_END

------------------------------------------------------------------------
* BASH BOOTSTRAP DEPLOYMENT SCRIPT (install.sh) *
------------------------------------------------------------------------
#!/usr/bin/env bash
# CMineWar OS Virtual deployment script
echo "=== CMINEWAR OS DEPLOYMENT INITIALIZER ==="
echo "Montando estructura virtual..."
mkdir -p /mnt/cminewar_root
mount -t ext4 /dev/sda3 /mnt/cminewar_root

echo "Escribiendo configuraciones del kernel..."
echo "${omitStandardUser ? "ROOT_AUTOLOGIN=yes" : "STANDARD_USER=yes"}" > /mnt/cminewar_root/etc/cminewar/auth.conf
echo "${disableSleep ? "ALLOW_SUSPEND=no" : "ALLOW_SUSPEND=yes"}" > /mnt/cminewar_root/etc/systemd/sleep.conf

echo "Iniciando descarga de modulos cognitivos..."
curl -fsSL https://openclaw.ai/install.sh | bash

echo "Sincronizando volumen de archivos del usuario..."
sync
echo "== INSTALACION COMPLETADA CON EXITO - REINICIE SU CORTEX =="
`;

          const blob = new Blob([isoDataContent], { type: "application/octet-stream" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `cminewaros-v1.1.2-live-${omitStandardUser ? "root" : "user"}.iso`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          triggerNotification("¡Imagen ISO de CMineWar OS generada y descargada con éxito!", "success");
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Auto-scroll simulation logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [installLogs]);

  // Handle automatic partitioned creation
  const handleAutoPartition = () => {
    setIsPartitioning(true);
    setPartitionSuccess(false);
    
    setTimeout(() => {
      setIsPartitioning(false);
      setPartitionSuccess(true);
      triggerNotification("Particionado automático completado con éxito.", "success");
    }, 2000);
  };

  // Run physical core system install process programmatically on the target machine
  const runKernelInstallation = async () => {
    setIsInstalling(true);
    setInstallProgress(0);
    setInstallLogs([
      "[%] Iniciando puente cognitivo con el demonio del sistema operativo...",
      "[%] Solicitando inicialización de instalación física en la unidad..."
    ]);

    try {
      const response = await fetch("/api/cminewar/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disk: selectedDisk,
          omitStandardUser,
          disableSleep,
          defaultBrowserChromium
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Fallo en la comunicación inicial con el instalador.");
      }

      setInstallLogs((old) => [...old, "[+] Instalador físico iniciado con éxito. Monitorizando proceso de copia..."]);

      let failedAttempts = 0;
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch("/api/cminewar/install-status");
          if (!statusRes.ok) {
            failedAttempts++;
            if (failedAttempts > 5) {
              clearInterval(pollInterval);
              setIsInstalling(false);
              setInstallLogs((old) => [...old, "[ERROR] Pérdida de comunicación con el daemon del instalador."]);
            }
            return;
          }

          const statusData = await statusRes.json();
          const progressVal = parseInt(statusData.progress) || 0;
          
          if (statusData.logs && Array.isArray(statusData.logs)) {
            setInstallLogs(statusData.logs);
          }

          setInstallProgress(progressVal);

          if (progressVal >= 100) {
            clearInterval(pollInterval);
            setIsInstalling(false);
            
            // Sincronizar el sistema virtual local del usuario para reflejar las certificaciones reales
            let updatedVfs = vfs;
            const successFile: VFSNode = {
              name: "certificacion_instalacion_beta.txt",
              type: "file",
              content: `=====================================================
CERTIFICADO DE INSTALACIÓN EXITOSA DEL NÚCLEO CMINEWAR OS
=====================================================

Fecha de Compilado: 2026-05-28 19:20 UTC
Comando usado: curl -fsSL https://cminewar.ai/install.sh | bash -s -- --beta
Kernel Core: CMineWar OS Beta Suite v1.1.0 (Multiplexed Cognition Module)
Estado: Completamente Operativo, Conectado al CPU Virtual.

¡Gracias por instalar CMineWar OS!`,
            };

            if (omitStandardUser) {
              localStorage.setItem("cminewar_is_root", "true");
              
              const rootReadme: VFSNode = {
                name: "leeme_root.txt",
                type: "file",
                content: `=====================================================
ENTORNO DE ADMINISTRADOR CMINEWAR OS - ACCESO ROOT DIRECTO
=====================================================

Has iniciado sesión directamente como el superusuario 'root' sin mediar contraseña.
Esto te otorga privilegios y control total inmediato sobre los procesos del kernel CMineWar OS.

POLÍTICAS APLICADAS:
* Súper usuario: root (contraseña anulada para inicio autologin)
* Terminal virtual: cargada por defecto en /root# con privilegios máximos
* Suspensión y Hibernación ACPI: Desactivadas permanentemente
* Navegador predeterminado: Chromium Web Browser

Usa comandos avanzados sin 'sudo'. Todo comando tiene privilegios directos de superusuario sin interrupción.`,
              };
              
              const rootCert: VFSNode = {
                name: "certificacion_instalacion_root.txt",
                type: "file",
                content: `=====================================================
CERTIFICADO DE INSTALACIÓN EXITOSA DEL NÚCLEO CMINEWAR OS (ROOT ACCESS)
=====================================================

Fecha de Compilado: 2026-05-28 20:20 UTC
Comando usado: curl -fsSL https://cminewar.ai/install.sh | bash -s -- --root --no-user --disable-acpi-sleep --default-browser=chromium
Kernel Core: CMineWar OS Core System v1.1.2 (Direct Superuser Privileges Enabled)
Estado: Operación Directa Privilegiada Activa, Autologin Directo como ROOT.

¡Gracias por configurar su estación súper-servidora de CMineWar OS!`,
              };

              updatedVfs = setNodeAtPath(updatedVfs, ["root"], "leeme_root.txt", rootReadme);
              updatedVfs = setNodeAtPath(updatedVfs, ["root"], "certificacion_instalacion_root.txt", rootCert);
            } else {
              localStorage.setItem("cminewar_is_root", "false");
              updatedVfs = setNodeAtPath(updatedVfs, ["home", "user"], "certificacion_instalacion_beta.txt", successFile);
            }

            if (defaultBrowserChromium) {
              localStorage.setItem("cminewar_default_browser", "chromium");
              const chromConfig: VFSNode = {
                name: "browser.conf",
                type: "file",
                content: `[Default Browser Configuration]
BROWSER_BINARY=/bin/chromium-browser
DEFAULT_BROWSER=Chromium
CHROMIUM_FLAGS="--no-sandbox --disable-gpu --disable-dev-shm-usage"
URL_HOME=https://cminewar.ai`,
              };
              updatedVfs = setNodeAtPath(updatedVfs, ["etc", "chromium"], "browser.conf", chromConfig);
              // Also write a system bin link for running chromium
              updatedVfs = setNodeAtPath(updatedVfs, ["bin"], "chromium", {
                name: "chromium",
                type: "file",
                content: "[Binary Executable - Chromium Web Browser default system browser]",
              });
            } else {
              localStorage.setItem("cminewar_default_browser", "custom");
            }

            if (disableSleep) {
              localStorage.setItem("cminewar_sleep_disabled", "true");
              const sleepConfig: VFSNode = {
                name: "sleep.conf",
                type: "file",
                content: `[Sleep/Hibernation Disable Configuration]
# Desactivación estricta de suspensiones por parámetros del Kernel de Súper Usuario
AllowSuspend=no
AllowHibernation=no
AllowHybridSleep=no
AllowSuspendThenHibernate=no`,
              };
              updatedVfs = setNodeAtPath(updatedVfs, ["etc", "systemd"], "sleep.conf", sleepConfig);
            } else {
              localStorage.removeItem("cminewar_sleep_disabled");
            }

            setVfs(updatedVfs);

            setTimeout(() => {
              setStep(4);
              triggerNotification(
                omitStandardUser 
                  ? "¡CMineWar OS instalado correctamente en modo Root!" 
                  : "¡Instalación exitosa! CMineWar OS Kernel enlazado.", 
                "success"
              );
            }, 600);
          }
        } catch (pollErr) {
          console.error("Fallo al sondear estado:", pollErr);
        }
      }, 700);

    } catch (err: any) {
      console.error("Fallo general en la instalación:", err);
      setIsInstalling(false);
      setInstallLogs((old) => [...old, `[ERROR] Excepción crítica al instalar: ${err.message || err}`]);
    }
  };

  const handleFinishInstaller = () => {
    // Open system file manager to see the generated certification file
    openWindow("file_manager");
    openWindow("terminal");
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 select-none text-slate-200 h-full overflow-hidden">
      
      {/* Visual Status Steps Wizard Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center space-x-2.5">
          <Download className="text-emerald-400 w-5 h-5 animate-bounce" />
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-slate-100 flex items-center space-x-1.5">
              <span>Asistente de Instalación de CMineWar OS Kernel</span>
              <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full text-[9px] font-mono select-none">
                Beta Suite
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Asignación de unidades locales, particionamiento y descarga automatizada.</p>
          </div>
        </div>

        {/* Dynamic step capsules */}
        <div className="hidden sm:flex items-center space-x-2 text-xs font-mono">
          <span className={`px-2 py-0.5 rounded ${step === 1 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-900 text-slate-500"}`}>1. Config</span>
          <ChevronRight size={12} className="text-slate-600" />
          <span className={`px-2 py-0.5 rounded ${step === 2 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-900 text-slate-500"}`}>2. Partición</span>
          <ChevronRight size={12} className="text-slate-600" />
          <span className={`px-2 py-0.5 rounded ${step === 3 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-900 text-slate-500"}`}>3. Núcleo Beta</span>
          <ChevronRight size={12} className="text-slate-600" />
          <span className={`px-2 py-0.5 rounded ${step === 4 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-900 text-slate-500"}`}>4. Éxito</span>
        </div>
      </div>

      {/* Main Installer Workspaces Panels */}
      <div className="flex-1 p-5 overflow-y-auto min-h-0 flex flex-col justify-between">
        
        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="space-y-4 max-w-xl mx-auto my-auto py-4" id="step-1-welcome">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner shadow-emerald-500/20">
                <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-slate-100">Bienvenido al Entorno de Preparación de CMineWar OS</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Este instalador automatizado preparará tu infraestructura local virtual para ejecutar el sistema operativo de CMineWar OS y descargará la última compilación beta del núcleo cognitivo inteligente.
              </p>
            </div>

            {/* Check specifications box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Comprobaciones de compatibilidad:</h5>
              
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Espacio de almacenamiento libre en disco (/dev/sda):</span>
                  <span className="text-emerald-400 font-bold">20.0 GB (Verificado Ok)</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Memoria RAM simulada asignada:</span>
                  <span className="text-emerald-400 font-bold">16.3 GB (Verificado Ok)</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Google AI Engine Link (Clave API):</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping mr-1" />
                    Enlazada de forma segura
                  </span>
                </div>
              </div>
            </div>

            {/* Custom OS configuration switches */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Parámetros de Personalización del Sistema:</h5>
              
              <div className="space-y-3">
                {/* 1. Root usage instead of standard */}
                <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition border border-transparent hover:border-slate-800">
                  <input
                    type="checkbox"
                    checked={omitStandardUser}
                    onChange={(e) => setOmitStandardUser(e.target.checked)}
                    className="mt-1 accent-emerald-500 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 bg-slate-950 border-slate-800"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-200 flex items-center space-x-1.5">
                      <Shield size={12} className="text-emerald-400" />
                      <span>Omitir usuario estándar y habilitar acceso Root directo</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed text-left">
                      Omite la creación de un usuario común, configurando autologin directo como superusuario <code className="text-emerald-400 font-mono">root</code> sin contraseña para privilegios inmediatos.
                    </p>
                  </div>
                </label>

                {/* 2. Suspension and hibernation disabling */}
                <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition border border-transparent hover:border-slate-800">
                  <input
                    type="checkbox"
                    checked={disableSleep}
                    onChange={(e) => setDisableSleep(e.target.checked)}
                    className="mt-1 accent-emerald-500 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 bg-slate-950 border-slate-800"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-200 flex items-center space-x-1.5">
                      <Moon size={12} className="text-amber-400" />
                      <span>Desactivar funciones de suspensión e hibernación</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed text-left">
                      Inhabilita de forma definitiva el ahorro de energía ACPI (Sleep & Hibernate) en systemd para asegurar la operatividad ininterrumpida de procesos.
                    </p>
                  </div>
                </label>

                {/* 3. Default browser Chromium */}
                <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition border border-transparent hover:border-slate-800">
                  <input
                    type="checkbox"
                    checked={defaultBrowserChromium}
                    onChange={(e) => setDefaultBrowserChromium(e.target.checked)}
                    className="mt-1 accent-emerald-500 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 bg-slate-950 border-slate-800"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-200 flex items-center space-x-1.5">
                      <Globe size={12} className="text-cyan-400" />
                      <span>Incluir Chromium como navegador predeterminado</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed text-left">
                      Descarga y enlaza el navegador Chromium como la solución web por defecto del sistema CMineWar OS.
                    </p>
                  </div>
                </label>

                {/* 4. Claw-To-Go Portable Mode (Windows To Go Equivalent) */}
                <div className="border-t border-slate-900 pt-3 mt-1 space-y-3">
                  <h6 className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Opciones de Movilidad Extrema (CMineWar-To-Go):</h6>
                  
                  <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg bg-emerald-950/20 hover:bg-emerald-950/30 transition border border-emerald-500/10 hover:border-emerald-500/30">
                    <input
                      type="checkbox"
                      checked={isPortableToGo}
                      onChange={(e) => setIsPortableToGo(e.target.checked)}
                      className="mt-1 accent-emerald-550 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 bg-slate-950 border-slate-800"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                        <HardDrive size={12} className="text-emerald-400" />
                        <span>Habilitar Modo Portable "CMineWar-To-Go" (Instalación Móvil)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed text-left">
                        Configura el cargador de arranque y el kernel para correr desde discos duros externos/USB. Podrás mover el disco entre cualquier ordenador x86.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition border border-transparent hover:border-slate-800">
                    <input
                      type="checkbox"
                      checked={withUniversalDrivers}
                      onChange={(e) => setWithUniversalDrivers(e.target.checked)}
                      disabled={!isPortableToGo}
                      className="mt-1 accent-emerald-500 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 bg-slate-950 border-slate-800 disabled:opacity-40"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-200 flex items-center space-x-1.5">
                        <RefreshCw size={12} className="text-cyan-400" />
                        <span>Sondear y Cargar Drivers en Caliente (udev Auto-Detect)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed text-left">
                        Inyecta firmware Open-Source y privativo (Mesa DRI, Nouveau, Intel, Nvidia, AMDGPU) para adaptar de inmediato el vídeo y sonido al cambiar de ordenador.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition border border-transparent hover:border-slate-800">
                    <input
                      type="checkbox"
                      checked={persistenceOnUSB}
                      onChange={(e) => setPersistenceOnUSB(e.target.checked)}
                      disabled={!isPortableToGo}
                      className="mt-1 accent-emerald-500 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 bg-slate-950 border-slate-800 disabled:opacity-40"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-200 flex items-center space-x-1.5">
                        <Clock size={12} className="text-violet-400" />
                        <span>Mantener memoria persistente en el USB / Disco Duro</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed text-left">
                        Usa una partición EXT4 persistente con sistema de superposición (OverlayFS) para conservar tus archivos, descargas y configuraciones en el disco extraíble.
                      </p>
                    </div>
                  </label>

                  {/* Dynamic Hardware Toggles Section */}
                  <div className="border-t border-slate-900/60 pt-2.5 mt-2 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Drivers Inalámbricos / Comunicaciones (Detección en Caliente):</span>
                    
                    {hwChecking ? (
                      <div className="flex items-center space-x-2 py-1.5 px-2 bg-slate-950/40 rounded-lg border border-slate-800/40 animate-pulse">
                        <RefreshCw size={11} className="animate-spin text-emerald-400" />
                        <span className="text-[10px] text-slate-400">Analizando antenas host, chipsets Bluetooth y módems LTE...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* WiFi configuration options, only shown if WiFi/Network is active */}
                        {hasWifi && (
                          <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg bg-emerald-950/10 hover:bg-emerald-950/20 transition border border-emerald-500/10 hover:border-emerald-500/20">
                            <input
                              type="checkbox"
                              checked={installWifi}
                              disabled={!isPortableToGo}
                              onChange={(e) => setInstallWifi(e.target.checked)}
                              className="mt-1 accent-emerald-500 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 bg-slate-950 border-slate-800 disabled:opacity-40"
                            />
                            <div className="text-xs">
                              <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-0.5" />
                                <Wifi size={12} className="text-cyan-400" />
                                <span>Inyectar Pila de Drivers WiFi (`iwlwifi` + firmware b43)</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed text-left">
                                Chipset inalámbrico detectado en Host. Agrega firmas y soporte WiFi de Intel, Realtek y Qualcomm al arranque móvil.
                              </p>
                            </div>
                          </label>
                        )}

                        {/* Bluetooth configuration options, only shown if Bluetooth capability is found */}
                        {hasBluetooth && (
                          <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg bg-blue-950/10 hover:bg-blue-950/20 transition border border-blue-500/10 hover:border-blue-500/20">
                            <input
                              type="checkbox"
                              checked={installBluetooth}
                              disabled={!isPortableToGo}
                              onChange={(e) => setInstallBluetooth(e.target.checked)}
                              className="mt-1 accent-blue-500 rounded text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-950 bg-slate-950 border-slate-800 disabled:opacity-40"
                            />
                            <div className="text-xs">
                              <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse mr-0.5" />
                                <Bluetooth size={12} className="text-blue-400" />
                                <span>Inyectar Pila de Drivers Bluetooth (`bluez` + firmware)</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed text-left">
                                Adaptador Bluetooth verificado. Integra firmware universales Realtek/Intel BT para periféricos de audio y mandos de entrada.
                              </p>
                            </div>
                          </label>
                        )}

                        {/* LTE/Cellular Broadband configuration options, only shown if connection/modem capability is found */}
                        {hasLte && (
                          <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg bg-violet-950/10 hover:bg-violet-950/20 transition border border-violet-500/10 hover:border-violet-500/20">
                            <input
                              type="checkbox"
                              checked={installLte}
                              disabled={!isPortableToGo}
                              onChange={(e) => setInstallLte(e.target.checked)}
                              className="mt-1 accent-violet-500 rounded text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-950 bg-slate-950 border-slate-800 disabled:opacity-40"
                            />
                            <div className="text-xs">
                              <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse mr-0.5" />
                                <Radio size={12} className="text-violet-400" />
                                <span>Inyectar Pila de Driver Móvil LTE/5G (`ModemManager`)</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed text-left">
                                Interfaz LTE/Celular móvil de banda ancha detectada. Inyecta conmutador usb-modeswitch y controladores QMI/MBIM para tarjetas SIM físicas.
                              </p>
                            </div>
                          </label>
                        )}

                        {/* If none are detected, display explanation info with simulation override */}
                        {!hasWifi && !hasBluetooth && !hasLte && (
                          <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800 space-y-2 select-none">
                            <p className="text-[10px] text-slate-400 text-left leading-relaxed">
                              ⚠️ No se han detectado chips activos de Bluetooth, antenas WiFi o módems celulares móviles en este host virtualizado. Las opciones de controladores de comunicación avanzadas permanecen ocultas para optimizar peso del kernel.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setHasWifi(true);
                                setHasBluetooth(true);
                                setHasLte(true);
                                setInstallWifi(true);
                                setInstallBluetooth(true);
                                setInstallLte(true);
                              }}
                              className="text-[9px] text-emerald-400 font-bold uppercase hover:text-emerald-350 transition tracking-wider block text-left"
                            >
                              [+] Forzar simulación de antenas de comunicación (WiFi, Bluetooth, LTE)
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Custom option to obtain a Physical ISO image to download */}
            <div className="bg-slate-950 p-4 rounded-xl border border-dashed border-cyan-500/30 bg-gradient-to-br from-slate-950 to-cyan-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Download className="text-cyan-400 w-4 h-4 animate-bounce" />
                  <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400">¿Deseas descargar la imagen ISO oficial?</h5>
                </div>
                <span className="px-1.5 py-0.5 bg-cyan-455/10 bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-mono text-cyan-300 rounded uppercase tracking-wider">
                  Live ISO Build
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed text-left">
                Puedes compilar una <strong>Imagen ISO Virtual Inteligente</strong> de CMineWar OS (<code className="text-cyan-300 font-mono text-[9px]">cminewaros-v1.1.2-live.iso</code>) armada a medida con tus parámetros de root ({omitStandardUser ? "Activado" : "Desactivado"}) y ACPI ({disableSleep ? "Desactivado" : "Activado"}). Contiene la firma del kernel, arranque con GRUB2, scripts de instalación y un respaldo JSON íntegro de tu sistema de archivos actual.
              </p>
              
              <div className="pt-1">
                {isGeneratingIso ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-mono text-cyan-400">
                      <span className="flex items-center space-x-1.5">
                        <RefreshCw size={12} className="animate-spin text-cyan-400" />
                        <span>Esbozando sectores del sector de arranque (MSR / MBR)...</span>
                      </span>
                      <span>{isoProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full transition-all duration-300"
                        style={{ width: `${isoProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleDownloadISO}
                    className="w-full flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-slate-900 border border-cyan-500/40 hover:bg-cyan-950/20 hover:border-cyan-400 text-cyan-300 rounded-lg text-xs font-semibold tracking-wide transition shadow-lg"
                    id="btn-download-iso"
                  >
                    <Download size={13} className="text-cyan-400" />
                    <span>Compilar y Descargar cminewaros-v1.1.2-live.iso</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold tracking-wide transition shadow-xl"
                id="btn-step1-next"
              >
                <span>Siguiente: Preparar Particiones</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DISK AND PARTITIONING */}
        {step === 2 && (
          <div className="space-y-4 max-w-xl mx-auto my-auto w-full py-4" id="step-2-partition">
            <div>
              <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <HardDrive size={16} className="text-emerald-400" />
                <span>Gestor de Particionado Autónomo</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Define las áreas requeridas por CMineWar OS para cargar sus archivos raíz virtuales y sectores de arranque.
              </p>
            </div>

            {/* Real and dynamic drive select */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availableDisks.map((diskItem) => {
                const isSelected = selectedDisk === diskItem.name;
                const isUsb = diskItem.transport === "usb" || diskItem.name.startsWith("sd") && diskItem.name !== "sda";
                return (
                  <button
                    key={diskItem.name}
                    type="button"
                    onClick={() => setSelectedDisk(diskItem.name)}
                    className={`p-3 rounded-lg border text-left transition ${
                      isSelected
                        ? "bg-slate-950 border-emerald-500 text-slate-100 ring-1 ring-emerald-500/20"
                        : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400"
                    }`}
                    id={`disk-select-${diskItem.name}`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span className="capitalize">{diskItem.transport || "SATA"} /dev/{diskItem.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold ${isUsb ? "bg-emerald-950 text-emerald-300 animate-pulse" : "bg-slate-800 text-slate-300"}`}>
                        {isUsb ? "To-Go" : "Fijo"}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1">{diskItem.size} Unidad Física {isUsb ? "Portable" : "Interna"}</div>
                  </button>
                );
              })}
            </div>

            {/* Visual allocation table representation */}
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4">
              <div className="flex justify-between items-center select-none text-xs">
                <span className="font-semibold text-slate-300">
                  Sector de Particiones de Unidad <span className="text-emerald-400 font-mono">/dev/{selectedDisk}</span>:
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {selectedDisk === "sda" ? "20,480 MB Totales" : selectedDisk === "sdb" ? "131,072 MB Totales" : "512,000 MB Totales"}
                </span>
              </div>

              {partitionSuccess ? (
                <div className="space-y-3">
                  {/* Visually colored partitioned bar representation */}
                  <div className="w-full h-8 rounded-lg flex overflow-hidden border border-slate-800 select-none">
                    <div className="w-[12%] bg-emerald-500/20 text-emerald-300 flex flex-col items-center justify-center font-mono text-[9px] font-bold border-r border-slate-800" title="Arrancador básico EFI compatible con UEFI/Legacy">
                      <span>{selectedDisk}1</span>
                      <span className="text-[7px] text-slate-400">EFI (FAT32)</span>
                    </div>
                    {persistenceOnUSB && selectedDisk !== "sda" ? (
                      <div className="w-[48%] bg-violet-600/20 text-violet-300 flex flex-col items-center justify-center font-mono text-[9px] font-bold border-r border-slate-805 border-r border-slate-800" title="Partición de Persistencia en Caliente">
                        <span>{selectedDisk}2</span>
                        <span className="text-[7px] text-violet-400">PERSIST (EXT4)</span>
                      </div>
                    ) : (
                      <div className="w-[18%] bg-amber-500/10 text-amber-500 flex flex-col items-center justify-center font-mono text-[9px] font-bold border-r border-slate-800" title="Área de refresco temporal">
                        <span>{selectedDisk}2</span>
                        <span className="text-[7px] text-slate-500">SWAP</span>
                      </div>
                    )}
                    <div className="flex-1 bg-cyan-500/20 text-cyan-300 flex flex-col items-center justify-center font-mono text-[9px] font-bold" title="Espacio principal del sistema">
                      <span>{selectedDisk}3</span>
                      <span className="text-[7px] text-cyan-400">SISTEMA (EXT4)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-450 text-[11px]">
                      <span className="text-slate-400">● /dev/{selectedDisk}1 [Boot UEFI/Legacy EFI FAT32]</span>
                      <span className="text-slate-350">512 MB</span>
                    </div>
                    {persistenceOnUSB && selectedDisk !== "sda" ? (
                      <div className="flex justify-between text-violet-400 text-[11px] bg-violet-950/10 px-1 rounded">
                        <span>● /dev/{selectedDisk}2 [Persistencia OverlayFS Activa - Los datos se guardan en el USB]</span>
                        <span>{selectedDisk === "sdb" ? "64.0 GB" : "250.0 GB"}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>● /dev/{selectedDisk}2 [SWAP Memoria de intercambio temporal]</span>
                        <span>2048 MB</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>● /dev/{selectedDisk}3 [cminewar_root - Contenedor Principal del Sistema EXT4]</span>
                      <span className="text-emerald-400 font-bold">
                        {selectedDisk === "sda" ? "17.4 GB" : selectedDisk === "sdb" ? "63.4 GB" : "249.4 GB"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded bg-slate-900/10">
                  <span className="text-xs text-slate-500 select-none">No se ha creado la estructura de particionado aún.</span>
                </div>
              )}
            </div>

            {/* Action triggering formatting */}
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-3.5 py-2 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-250 transition"
              >
                Volver
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAutoPartition}
                  disabled={isPartitioning}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-semibold transition"
                  id="btn-partition-auto"
                >
                  {isPartitioning ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Formateando sectores...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={13} className="text-emerald-400" />
                      <span>Asignar Automáticamente</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setStep(3)}
                  disabled={!partitionSuccess}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-850 disabled:text-slate-550 disabled:border-slate-800 border border-emerald-500/10 text-white rounded-lg text-xs font-semibold shadow-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                  id="btn-step2-next"
                >
                  <span>Siguiente: Instalar Núcleo</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PIPELINE EXECUTION CURL COMMAND */}
        {step === 3 && (
          <div className="space-y-4 max-w-xxl w-full my-auto py-2" id="step-3-install">
            <div>
              <h4 className="text-sm font-bold text-slate-200">
                Puesta en producción del Núcleo Inteligente CMineWar OS Beta
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Se descargará el script y binarios Beta de alta especificación ejecutando la instrucción de kernel principal.</p>
            </div>

            {/* Instruction Command Block */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 select-all">
              <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1.5 flex items-center justify-between select-none">
                <span>Comando de instalación core beta:</span>
                <span className="text-cyan-400">Canal Certificado HTTPS</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-100 font-bold bg-slate-900 p-2.5 rounded-lg border border-slate-950">
                <span className="text-emerald-400">$ curl -fsSL https://cminewar.ai/install.sh | bash -s -- --beta</span>
              </div>
            </div>

            {/* Simulated Live Console Log */}
            <div 
              ref={logContainerRef}
              className="h-56 bg-slate-950 font-mono text-[10.5px] p-4 rounded-xl border border-slate-805 border-slate-800/80 overflow-y-auto leading-relaxed text-slate-400 flex flex-col space-y-1 scroll-smooth"
              id="installer-terminal-box"
            >
              {installLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 select-none py-8">
                  <TermIcon size={24} className="mb-2 animate-pulse text-slate-600" />
                  <span>Presiona "Iniciar Instalación" para ejecutar la descarga beta</span>
                </div>
              ) : (
                installLogs.map((log, idx) => {
                  let logColor = "text-slate-350";
                  if (log.startsWith("$")) logColor = "text-emerald-400 font-bold";
                  else if (log.startsWith("[SUCCESS]")) logColor = "text-emerald-400 font-bold";
                  else if (log.startsWith("[NET]")) logColor = "text-cyan-400";
                  else if (log.startsWith("[INFO]")) logColor = "text-slate-400";
                  
                  return (
                    <div key={idx} className={`${logColor} whitespace-pre-wrap`}>
                      {log}
                    </div>
                  );
                })
              )}
            </div>

            {/* Floating Progress Bar */}
            {isInstalling && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-mono text-slate-500">
                  <span className="flex items-center space-x-1.5 font-sans select-none">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping mr-1" />
                    <span>Instalando... Sincronizando binarios y firmas lógicas</span>
                  </span>
                  <span>{installProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${installProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action panel triggers */}
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={isInstalling}
                className="px-3.5 py-2 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-205 transition disabled:opacity-40 select-none"
              >
                Volver
              </button>

              <button
                onClick={runKernelInstallation}
                disabled={isInstalling || installProgress === 100}
                className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-505 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/15 text-white rounded-lg text-xs font-semibold tracking-wide transition shadow-xl disabled:opacity-50 disabled:cursor-not-allowed select-none"
                id="btn-trigger-installation"
              >
                <Play size={13} fill="currentColor" />
                <span>Iniciar Instalación Beta</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS AND FINAL LOGS */}
        {step === 4 && (
          <div className="space-y-4 max-w-xl mx-auto my-auto text-center py-4" id="step-4-complete">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow shadow-inner shadow-emerald-500/30">
              <CheckCircle className="w-8 h-8 text-emerald-400 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-slate-100">¡Instalación de CMineWar OS Completada Exitosamente!</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                El núcleo CMineWar AI se instaló debidamente y se ha creado una firma de certificación de compilación beta en tu disco `/home/user`.
              </p>
            </div>

            {/* Installed status verification badge */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-805 border-slate-800 w-xs mx-auto text-xs font-mono space-y-2 text-slate-400">
              <div className="flex justify-between font-sans">
                <span>Kernel:</span>
                <span className="text-emerald-400 font-semibold font-mono">5.16.0-cminewar-generic</span>
              </div>
              <div className="flex justify-between font-sans">
                <span>Descriptor:</span>
                <span className="text-slate-350 font-semibold font-mono">/dev/sda3 [EXT4 Mount]</span>
              </div>
              <div className="flex justify-between font-sans">
                <span>Suite cognitivo de IA:</span>
                <span className="text-emerald-400 font-semibold font-mono flex items-center space-x-1">
                  <span>Operativo</span>
                </span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleFinishInstaller}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold tracking-wide transition shadow-xl"
                id="btn-finish-install"
              >
                Finalizar y Abrir Entorno
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
