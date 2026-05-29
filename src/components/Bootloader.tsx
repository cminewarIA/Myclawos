import React, { useState, useEffect, useRef } from "react";
import { Terminal, ShieldAlert, Cpu, Download, RefreshCw, Layers, CheckCircle2, RotateCcw } from "lucide-react";

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

  const consoleEndRef = useRef<HTMLDivElement>(null);

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
    const sequence = selectedServerIp 
      ? [...serverHandshakeSequence, ...biosBootSequence] 
      : biosBootSequence;

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
    <div className="fixed inset-0 z-[9999999] bg-black flex flex-col font-mono text-slate-300 text-xs p-4 overflow-hidden select-none">
      
      {/* HEADER BIOS BANNER */}
      {bootPhase === "bios" && (
        <div className="flex-1 flex flex-col min-h-0 bg-black text-left font-mono">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3 text-[10px] text-slate-500">
            <span>CMINEWAR BIOS v1.02 • SYSTEM START</span>
            <span className="animate-pulse">BOOTING... {bootProgress}%</span>
          </div>

          {/* Scrolling diagnostic messages */}
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
                    ? "text-slate-400 inline-block bg-slate-950 p-0.5 border border-slate-900 rounded"
                    : "text-slate-300"
                }`}
              >
                {log}
              </div>
            ))}
            <div ref={consoleEndRef} />
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
