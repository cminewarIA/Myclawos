import React, { useState, useEffect, useRef } from "react";
import { Terminal, ShieldAlert, Cpu, Download, RefreshCw, Layers, CheckCircle2, RotateCcw } from "lucide-react";
import DragonLogo from "./DragonLogo";

interface BootloaderProps {
  onComplete: (serverIp?: string) => void;
  selectedServerIp?: string | null;
  isSafeModeDefault?: boolean;
}

export default function Bootloader({ onComplete, selectedServerIp = null, isSafeModeDefault = false }: BootloaderProps) {
  const [bootProgress, setBootProgress] = useState(0);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [bootPhase, setBootPhase] = useState<"bios" | "safemode" | "finished">("bios");
  const [safeModePhase, setSafeModePhase] = useState<"menu" | "repairing" | "repair_done">("menu");
  const [repairLogs, setRepairLogs] = useState<string[]>([]);
  const [repairProgress, setRepairProgress] = useState(0);
  const [activeRepairType, setActiveRepairType] = useState("");
  const [isGlitching, setIsGlitching] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement>(null);
  const glitchTimeoutRef = useRef<any>(null);

  // Play micro synth click synthesizer
  const playPulseSound = (freq = 300, type: OscillatorType = "sine", duration = 0.05) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  };

  // Occasional random CSS glitch during kernel bootloader load to emulate unstable BIOS screen
  useEffect(() => {
    if (bootPhase !== "bios" || bootProgress >= 100) {
      setIsGlitching(false);
      return;
    }

    const triggerGlitch = () => {
      setIsGlitching(true);
      // Play a quick triangle pitch oscillation for realistic retro display static buzz
      playPulseSound(120, "triangle", 0.09);

      setTimeout(() => {
        setIsGlitching(false);
      }, 60 + Math.random() * 120);

      const nextTime = 1300 + Math.random() * 2600;
      glitchTimeoutRef.current = setTimeout(triggerGlitch, nextTime);
    };

    const firstTimer = setTimeout(triggerGlitch, 900 + Math.random() * 1000);

    return () => {
      clearTimeout(firstTimer);
      if (glitchTimeoutRef.current) {
        clearTimeout(glitchTimeoutRef.current);
      }
    };
  }, [bootPhase, bootProgress]);

  // BIOS boot log statements
  const biosBootSequence = [
    "GRUB loading stage 1.5...",
    "GRUB loading, please wait...",
    "GNU GRUB v2.06-git-cminewar-core initialized",
    "grub> boot /boot/vmlinuz-6.10-cminewar-core quiet loglevel=3",
    "Uncompressing Linux Kernel Core... Parsing ELF formats... done.",
    "Booting GNU/Linux kernel state inside Debian virtual playground...",
    "[    0.000000] Linux version 6.10.8-cminewar-generic-x86_64 (gcc version 14.1.0)",
    "[    0.012502] Command line: BOOT_IMAGE=/boot/vmlinuz-6.10 root=UUID=vfs-claw-system-drive ro quiet",
    "[    0.145023] x86/fpu: Supporting XSAVE xstates",
    "[    0.356220] BIOS-provided physical RAM map: 32 GB Virtualized RAM allocated ok",
    "[    0.789110] ACPI: ACPI Sleep/Suspend Supervisor initialized securely",
    "[    1.025000] usbcore: registered new interface driver hub",
    "[    1.238910] SCSI subsystem initialized successfully",
    "[    1.440263] Keyring: Virtual credentials registry synchronized",
    "[    1.650882] Ext4-fs (vfs-drive): mounted filesystem with ordered data mode",
    "[    1.890000] udevd[150]: starting version 252.12 kernel-core systemd tools",
    "[    2.102550] CMineWar AI: Connecting cognitive LLM coprocessor daemon...",
    "[    2.350100] CMineWar AI: [✔] COGNITIVE MAIN MAIN MAIN CORES ONLINE!",
    "[    2.560400] Sincronizador udev: Carretas de descriptores de red udev-sync listas",
  ];

  // If remote server IP is given, let's prepend custom server connections logs!
  const serverHandshakeSequence = [
    `⚡ ESTABLECIENDO CONEXIÓN REMOTA CON SERVIDOR NATIVO: ${selectedServerIp || "192.168.1.100"}...`,
    "🔄 [CONECTADO] Inicializando socket TCP en puerto 2222/3000...",
    "🔑 Handshaking SSH secure authorization keys con el cluster Debian...",
    "🚀 [OK] Canal tunelado SSH remoto establecido con éxito.",
    "📂 [SFTP] Sincronizando directorio compartido /vfs/remote_root...",
  ];

  useEffect(() => {
    // Scroll logs automatically
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [bootLogs, repairLogs]);

  useEffect(() => {
    const ssdMode = localStorage.getItem("cminewar_ssd_portable_mode") || "hybrid";
    const ssdMok = localStorage.getItem("cminewar_ssd_mok_enrolled") !== "false";
    const ssdLba = localStorage.getItem("cminewar_ssd_lba_limit") === "true";
    const ssdAuto = localStorage.getItem("cminewar_ssd_autosensing") !== "false";

    const portableSsdLogs = [
      `💾 [DISPOSITIVO] Puerto Host USB SSD portátil detectado de alta elasticidad.`,
      `💿 [TABLA PARTIT.] GPT híbrida con sector MBR protector alineado por hardware cargada.`,
      ssdMode === "hybrid" 
        ? "💿 [SIST. ARRANQUE] UEFI (ia32/x64) + Legacy MBR híbrido preparado para multi-hardware y Legacy BIOS."
        : ssdMode === "uefi_only"
        ? "💿 [SIST. ARRANQUE] Cargando exclusivo UEFI (ia32/x64 EFI BOOT) con soporte GPT nativo."
        : "💿 [SIST. ARRANQUE] Cargando Legacy BIOS por sector cero de MBR físico en discos de arranque.",
      ssdMok 
        ? "🔑 [SOPORTE SECURE BOOT] Firma bypass SHIM activa (Claves Microsoft 3rd-Party CA / MOK enrolled)."
        : "⚠️ [SECURE BOOT] Modo passthrough o desactivado en BIOS del ordenador.",
      ssdAuto
        ? "🔌 [HW AUTO-SENSING] Inicializando drivers portátiles elásticos de Debian (uas, nvme, usb-storage, ahci...)"
        : "⚠️ [HW AUTO-SENSING] Modo de drivers estático. No heredando perfiles múltiples.",
      ssdLba
        ? "📐 [LBA 24-BIT antiguas] Protección de cilindros CHS activa (arranque seguro por debajo de 137 GB)."
        : "📐 [LBA 48-BIT] Direccionamiento sin limites para computadoras y placas base modernas.",
      "🚀 [PORTABILIDAD] Sintonizando kernel adaptativo para el hardware de este ordenador host...",
    ];

    const finalBiosSequence = [...portableSsdLogs, ...biosBootSequence];

    const sequence = selectedServerIp 
      ? [...serverHandshakeSequence, ...finalBiosSequence] 
      : finalBiosSequence;

    let stepIndex = 0;
    const intervalTime = 160;

    const timer = setInterval(() => {
      if (stepIndex < sequence.length) {
        const nextLog = sequence[stepIndex];
        setBootLogs((prev) => [...prev, nextLog]);
        playPulseSound(nextLog.includes("[✔]") ? 600 : 380, "sine", 0.03);
        setBootProgress(Math.floor((stepIndex / sequence.length) * 100));
        stepIndex++;
      } else {
        clearInterval(timer);
        setBootProgress(100);

        // Check if Safe Mode was activated
        const isSafeModeActive = localStorage.getItem("cminewar_safe_mode") === "true" || isSafeModeDefault;
        setTimeout(() => {
          if (isSafeModeActive) {
            setBootPhase("safemode");
          } else {
            setBootPhase("finished");
            onComplete();
          }
        }, 500);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [selectedServerIp, isSafeModeDefault]);

  // Execute emergency repair steps inside Safe Mode Console
  const executeEmergencyRepair = (type: "kernel" | "bootloader" | "vfs") => {
    playPulseSound(440, "triangle", 0.1);
    setSafeModePhase("repairing");
    setRepairProgress(0);
    setActiveRepairType(type);

    let steps: string[] = [];
    if (type === "kernel") {
      steps = [
        "[$] Iniciando reparación del Kernel desde repositorio oficial...",
        "[$] Descargando imagen linux-image-6.10.8-cminewar-generic_amd64.deb de un backup de GitHub...",
        "[$] Descomimiendo archivos del Kernel estable en sector de rescate...",
        "[$] Actualizando link simbólico vmlinuz -> /boot/vmlinuz-6.10.8-rescue",
        "[$] Reconstruyendo initramfs initrd.img-6.10.8-rescue...",
        "[$] ¡Kernel REPARADO de GitHub instalado con éxito!",
      ];
    } else if (type === "bootloader") {
      steps = [
        "[$] Reconstruyendo Cargador de Arranque CMineWar-GRUB...",
        "[$] Obteniendo especificación MBR estable desde la rama principal en GitHub...",
        "[$] Formateando sector cero de partición LBA activa...",
        "[$] Ejecutando: grub-install --target=i386-pc --force /dev/vda...",
        "[$] Ejecutando update-grub para re-indexar particiones /vfs...",
        "[$] ¡Cargador de arranque MBR-GRUB instalado y reparado con éxito!",
      ];
    } else {
      steps = [
        "[$] Restableciendo e Indexando sistema liso de archivos VFS...",
        "[$] Eliminando descriptores temporales corruptos de caché...",
        "[$] Reiniciando variables de entorno del daemon udev-sync...",
        "[$] Configurando carpetas base requeridas: /home/user, /bin, /etc, /root, /boot",
        "[$] ¡Almacenamiento VFS y variables de Linux estabilizadas!",
      ];
    }

    setRepairLogs([steps[0]]);
    let currentStepIndex = 1;

    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setRepairLogs((old) => [...old, steps[currentStepIndex]]);
        playPulseSound(520, "sine", 0.05);
        setRepairProgress(Math.floor((currentStepIndex / steps.length) * 100));
        currentStepIndex++;
      } else {
        clearInterval(interval);
        setRepairProgress(100);
        setSafeModePhase("repair_done");
        playPulseSound(880, "sine", 0.2);
      }
    }, 550);
  };

  const handleNormalReboot = () => {
    playPulseSound(1000, "sine", 0.15);
    localStorage.removeItem("cminewar_safe_mode");
    // Force reload entire app so it reloads clean boot normally
    window.location.reload();
  };

  return (
    <div className={`fixed inset-0 z-[9999999] bg-black flex flex-col font-mono text-slate-300 text-xs p-4 overflow-hidden select-none ${isGlitching ? "glitch-unstable" : ""}`}>
      {bootPhase === "bios" && isGlitching && <div className="glitch-overlay" />}
      
      {/* HEADER BIOS BANNER */}
      {bootPhase === "bios" && (
        <div className="flex-1 flex flex-col min-h-0 bg-black text-left font-mono" id="cminewar-bootloader-screen">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-4 text-[10px] text-slate-500">
            <span>CMINEWAR BIOS v1.02 • SYSTEM START</span>
            <span className="animate-pulse font-bold text-pink-400">BOOTING... {bootProgress}%</span>
          </div>

          {/* TWO COLUMN RESPONSIVE GRID */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden pb-2">
            
            {/* COLUMN 1: STUNNING DRAGON LOGO BOOT EMBLEM */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-950/40 border border-slate-900/60 rounded-xl p-6 text-center space-y-6 shrink-0 relative overflow-hidden group shadow-inner">
              {/* Decorative radar sweep / circular grids in background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.03)_0%,transparent_70%)] pointer-events-none" />
              <div className="absolute top-0 right-0 h-[1.5px] w-24 bg-gradient-to-l from-pink-500/10 to-transparent" />
              
              {/* pulsing and glowing dragon logo container */}
              <div className="relative flex items-center justify-center w-40 h-40 transform transition duration-500 hover:scale-105">
                <div className="absolute inset-0 bg-pink-500/5 rounded-full blur-2xl animate-pulse" />
                <DragonLogo size={145} className="animate-pulse drop-shadow-[0_0_25px_rgba(239,68,68,0.25)]" glow={true} />
              </div>

              {/* Branding name */}
              <div className="space-y-1.5">
                <h1 className="text-sm font-black tracking-[0.25em] text-slate-100 uppercase font-mono">
                  CMINEWAR OS
                </h1>
                <p className="text-[10px] text-slate-550 font-mono tracking-wider uppercase">
                  Booting Linux Kernel v6.10-claw
                </p>
              </div>

              {/* System loading details box */}
              <div className="w-full max-w-xs space-y-2 font-mono text-[9.5px]">
                {/* Horizontal Progress Bar matching control panel coherence */}
                <div className="relative w-full h-1.5 bg-slate-900 rounded overflow-hidden border border-slate-800">
                  <div 
                    className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 transition-all duration-150" 
                    style={{ width: `${bootProgress}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-slate-400 font-mono px-0.5">
                  <span className="text-slate-600">SECTOR STATUS:</span>
                  <span className="text-pink-400 font-bold">
                    {bootProgress < 30 ? "ANALYZING CHS" : bootProgress < 60 ? "LOADING KERNEL" : bootProgress < 90 ? "MOUNTING VFS" : "PREPARING DEBIAN DE"}
                  </span>
                </div>
              </div>

              {/* Embedded Mini Retro Spec Box */}
              <div className="hidden sm:block w-full max-w-xs bg-slate-950 border border-slate-900/40 rounded-lg p-3 text-[9px] text-left text-slate-500 font-mono space-y-1">
                <div className="flex justify-between border-b border-slate-900/40 pb-1 mb-1 font-bold text-slate-400">
                  <span>DISPOSITIVO SEGURO</span>
                  <span>DETALLES HOST</span>
                </div>
                <div className="flex justify-between">
                  <span>Arquitectura:</span>
                  <span className="text-slate-400 font-semibold">x86_64 Core VM</span>
                </div>
                <div className="flex justify-between">
                  <span>Firma de Red:</span>
                  <span className="text-emerald-400 font-semibold">[ OK ] FIRMADO</span>
                </div>
                <div className="flex justify-between">
                  <span>Secure Code VFS:</span>
                  <span className="text-slate-400">SHA-256-ELASTIC</span>
                </div>
              </div>
            </div>

            {/* COLUMN 2: HIGH-TECH SCROLLING DIAGNOSTIC WINDOW */}
            <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-950/40 border border-slate-900 rounded-xl p-4 relative">
              <div className="flex items-center space-x-1.5 border-b border-slate-900 pb-2 mb-3 shrink-0 text-slate-500 text-[9.5px]">
                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                <span className="font-bold uppercase tracking-wider text-slate-400">Consola de Diagnóstico en Tiempo Real</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-none pr-1 select-text">
                {bootLogs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`${
                      log.includes("[✔]")
                        ? "text-emerald-400 font-bold"
                        : log.includes("REMOTE") || log.includes("SSH")
                        ? "text-cyan-400 font-bold"
                        : log.startsWith("BOOT_IMAGE") || log.startsWith("Linux version")
                        ? "text-slate-400 inline-block bg-slate-950 p-1 border border-slate-900 rounded font-mono"
                        : "text-slate-300"
                    } leading-relaxed text-[10.5px]`}
                  >
                    {log}
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
            </div>

          </div>

          {/* ACCELERATE QUICK BOOT BUTTON */}
          <div className="border-t border-slate-900 pt-3 mt-3 flex justify-between items-center shrink-0">
            <span className="text-[10px] text-slate-600">Tip: Doble clic en apps para abrirlas en el escritorio</span>
            <button
              onClick={() => {
                playPulseSound(1200, "sine", 0.08);
                localStorage.removeItem("cminewar_safe_mode");
                onComplete(selectedServerIp || undefined);
              }}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px] rounded hover:text-slate-200 transition active:scale-95 cursor-pointer flex items-center space-x-1"
            >
              <span>[ ESCAPAR ARRANQUE / ACCELERATE ]</span>
            </button>
          </div>
        </div>
      )}

      {/* SAFE MODE RECOVERY SYSTEM (Interactive cyberpunk/vintage recovery screen) */}
      {bootPhase === "safemode" && (
        <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full py-4 text-left">
          
          <div className="space-y-4">
            {/* Warning Banner */}
            <div className="bg-red-950/40 border-2 border-red-500/50 p-4 rounded-xl flex items-start space-x-3.5 shadow-lg shadow-red-950/20">
              <ShieldAlert size={28} className="text-red-500 shrink-0 animate-pulse mt-0.5" />
              <div>
                <h2 className="text-sm font-black text-red-400 uppercase tracking-wide">
                  MODO SEGURO DE CMINEWAR OS DESPLEGADO (RESCUE CONSOLE)
                </h2>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                  Tu sistema o la configuración de GitHub se ha cargado en el canal de rescate seguro. Desde esta terminal de recuperación de emergencia puedes reinstalar binarios caídos, parches de Kernel, re-escribir el Bootloader o formatear variables udev defectuosas de forma nativa.
                </p>
              </div>
            </div>

            {/* Menu Panel */}
            {safeModePhase === "menu" ? (
              <div className="space-y-3.5">
                <span className="text-[10px] text-red-400/80 font-bold block uppercase tracking-wider">
                  Menu de Opciones de Recuperación:
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Kernel update rescue */}
                  <button
                    onClick={() => executeEmergencyRepair("kernel")}
                    className="p-3.5 bg-slate-950 border border-slate-800 hover:border-red-500/50 rounded-xl hover:bg-slate-900/40 transition text-left space-y-1.5 group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 text-red-400 group-hover:text-red-300 font-bold">
                      <Cpu size={14} />
                      <span className="text-[11px] uppercase tracking-wide">Reinstalar Kernel (GitHub Release)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Descarga y sobrescribe de emergencia la versión estable del Kernel <code className="text-red-500/80">v6.10-cminewar-generic</code> desde GitHub.
                    </p>
                  </button>

                  {/* Bootloader flash rescue */}
                  <button
                    onClick={() => executeEmergencyRepair("bootloader")}
                    className="p-3.5 bg-slate-950 border border-slate-800 hover:border-red-500/50 rounded-xl hover:bg-slate-900/40 transition text-left space-y-1.5 group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 text-red-400 group-hover:text-red-300 font-bold">
                      <Download size={14} />
                      <span className="text-[11px] uppercase tracking-wide">Flashear Bootloader (GRUB MBR)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Re-escribe los sectores cargadores de arranque virtuales en el disco sector cero para resolver bloqueos de inicio del BIOS.
                    </p>
                  </button>

                  {/* Format and reset udev */}
                  <button
                    onClick={() => executeEmergencyRepair("vfs")}
                    className="p-3.5 bg-slate-950 border border-slate-800 hover:border-red-500/50 rounded-xl hover:bg-slate-900/40 transition text-left space-y-1.5 group cursor-pointer md:col-span-2"
                  >
                    <div className="flex items-center space-x-2 text-red-400 group-hover:text-red-300 font-bold">
                      <Layers size={14} />
                      <span className="text-[11px] uppercase tracking-wide">Limpiar variables udev & Restructurar VFS</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Sanitiza el almacenamiento local, restaura las rutas del sistema virtuales de fábrica sin tocar tus notas clave ni ficheros del usuario.
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              /* Repair Terminal Log Console */
              <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-[10px] text-red-450 border-b border-slate-900 pb-2">
                  <span className="font-bold flex items-center space-x-1.5 uppercase">
                    <RefreshCw className="animate-spin text-red-500" size={12} />
                    <span>Ejecutando Tareas de Reparación de Emergencia</span>
                  </span>
                  <span>{repairProgress}%</span>
                </div>

                {/* Progress bar inside Safe Mode Console */}
                <div className="relative w-full h-1 bg-slate-900 rounded overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 bottom-0 bg-red-600 transition-all duration-300" 
                    style={{ width: `${repairProgress}%` }}
                  />
                </div>

                <div className="h-36 overflow-y-auto space-y-1 text-slate-400 font-mono text-[10px] pr-1">
                  {repairLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                  <div ref={consoleEndRef} />
                </div>

                {/* Done UI back selector and triggers */}
                {safeModePhase === "repair_done" && (
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-emerald-400 font-bold flex items-center text-[11px]">
                      <CheckCircle2 size={13} className="mr-1.5 shrink-0" /> Tarea completada sin fallos. Dispositivo reparado.
                    </span>
                    <button
                      onClick={() => setSafeModePhase("menu")}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-slate-200 border border-slate-800 text-[10px] rounded transition"
                    >
                      Volver al Menú
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reboot Button at the bottom */}
          <div className="border-t border-slate-900 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-[10px] text-slate-500">
              Modo seguro nativo Debian implementado por GitHub Sync Daemon.
            </span>
            <button
              onClick={handleNormalReboot}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-transform active:scale-95 shadow shadow-emerald-950/50 flex items-center space-x-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <RotateCcw size={13} />
              <span>Reiniciar normalmente ahora</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
