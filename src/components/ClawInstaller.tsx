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
  Clock
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
  
  // Storage selection config
  const [selectedDisk, setSelectedDisk] = useState("sda");
  const [partitionSuccess, setPartitionSuccess] = useState(false);
  const [isPartitioning, setIsPartitioning] = useState(false);
  
  // Installation loop process config
  const [installProgress, setInstallProgress] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

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

  // Run simulated curl install beta script pipeline
  const runKernelInstallation = () => {
    setIsInstalling(true);
    setInstallProgress(0);
    setInstallLogs([
      "$ curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta",
      "[%] Iniciando descarga TLS segura desde openclaw.ai...",
      "[%] Certificado CA verificado con firma SHA256",
      "[%] Descargando script de instalación (v1.1.0-beta6)... ok",
      "[%] Ejecutando bash con argumentos: --beta",
      "---------------------------------------------------------",
      "   ____                     ____ _               ",
      "  / ___|  _    __ _ __  __ / ___| | __ _ __      ",
      " | |    | |   / _` |\\ \\/ /| |   | |/ _` | \\ \\ /\\ /   ",
      " | |___ | |__| (_| | >  < | |___| | (_| |\\ v v /    ",
      "  \\____||_____\\__,_|_/\\_\\ \\____|_|\\__,_| \\_/_/     ",
      "                                                 ",
      " [Nucleo Inteligente OpenClaw Beta Suite Installer]",
      "---------------------------------------------------------",
      "[INFO] Comprobando integridad del destino /dev/sda3...",
      "[INFO] Montando partición raíz virtual en /mnt/claw_root...",
    ]);

    const logsList = [
      "[INFO] Descargando binarios precompilados del kernel (kernel-5.16.0-openclaw-beta)...",
      "[NET] Descargado: 12.4 MB / 85.0 MB (Velocidad: 14.5 MB/s)",
      "[NET] Descargado: 38.6 MB / 85.0 MB (Velocidad: 22.1 MB/s)",
      "[NET] Descargado: 64.1 MB / 85.0 MB (Velocidad: 18.2 MB/s)",
      "[NET] Descargado: 85.0 MB / 85.0 MB (100% completado)",
      "[INFO] Desempaquetando archivos del Núcleo Cognitivo OpenClaw...",
      "[VFS] Escribiendo /lib/modules/5.16.0-openclaw-generic/kernel/core.bin",
      "[VFS] Escribiendo /boot/initramfs-openclaw-beta.img",
      "[VFS] Escribiendo /boot/vmlinuz-openclaw",
      "[INFO] Inicializando puente cognitivo síncrono con la API de soporte general...",
      "[INFO] Clave de API principal detectada y enlazada de forma segura...",
      "[INFO] Configurando gestor de arranque GRUB 2.06...",
      "[VFS] Configurando módulo ClawBash Shell predeterminado en /bin/clawbash",
      "[INFO] Sincronizando directorio compartido /home/user...",
      "[INFO] Depurando configuraciones y estableciendo permisos udev...",
      "[SUCCESS] ¡Proceso de instalación completado con éxito!",
      "[SUCCESS] OpenClaw Linux Beta ya está listo para arrancar en el espacio del usuario.",
    ];

    let currentLogIndex = 0;
    const intervalTime = 400; // ms between updates

    const progressTimer = setInterval(() => {
      setInstallProgress((prev) => {
        const stepAmt = 5 + Math.floor(Math.random() * 8);
        const next = Math.min(prev + stepAmt, 100);
        
        // Feed logs proportional to progress
        if (currentLogIndex < logsList.length && next > (currentLogIndex * (100 / logsList.length))) {
          setInstallLogs((old) => [...old, logsList[currentLogIndex]]);
          currentLogIndex++;
        }

        if (next >= 100) {
          clearInterval(progressTimer);
          setIsInstalling(false);
          
          // Actually modify the Virtual File System (VFS) to reflect the installation signatures!
          const successFile: VFSNode = {
            name: "certificacion_instalacion_beta.txt",
            type: "file",
            content: `=====================================================
CERTIFICADO DE INSTALACIÓN EXITOSA DEL NÚCLEO OPENCLAW
=====================================================

Fecha de Compilado: 2026-05-28 19:20 UTC
Comando usado: curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta
Kernel Core: OpenClaw Beta Suite v1.1.0 (Multiplexed Cognition Module)
Estado: Completamente Operativo, Conectado al CPU Virtual.

¡Gracias por instalar OpenClaw OS!`,
          };

          const newVfs = setNodeAtPath(vfs, ["home", "user"], "certificacion_instalacion_beta.txt", successFile);
          setVfs(newVfs);

          setTimeout(() => {
            setStep(4);
            triggerNotification("¡Instalación exitosa! OpenClaw Kernel enlazado.", "success");
          }, 600);
        }
        return next;
      });
    }, intervalTime);
  };

  const handleFinishInstaller = () => {
    // Open system file manager to see the generated certification file
    openWindow("file_manager");
    openWindow("terminal");
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 select-none text-slate-200">
      
      {/* Visual Status Steps Wizard Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center space-x-2.5">
          <Download className="text-emerald-400 w-5 h-5 animate-bounce" />
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-slate-100 flex items-center space-x-1.5">
              <span>Asistente de Instalación de ClawOS Kernel</span>
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
              <h4 className="text-base font-bold text-slate-100">Bienvenido al Entorno de Preparación de ClawOS</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Este instalador automatizado preparará tu infraestructura local virtual para ejecutar el sistema operativo de ClawOS y descargará la última compilación beta del núcleo cognitivo inteligente.
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
              <p className="text-[11px] text-slate-500 mt-0.5">Define las áreas requeridas por ClawOS para cargar sus archivos raíz virtuales y sectores de arranque.</p>
            </div>

            {/* Simulated drive select */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedDisk("sda")}
                className={`p-3 rounded-lg border text-left transition ${
                  selectedDisk === "sda"
                    ? "bg-slate-950 border-emerald-500 text-slate-100"
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
                id="disk-select-sda"
              >
                <div className="font-bold text-xs">Unidad Principal /dev/sda</div>
                <div className="text-[9px] text-slate-500 mt-1">20.0 GB Disco de Arranque</div>
              </button>

              <button
                disabled
                className="p-3 rounded-lg border border-slate-900 bg-slate-955 hover:cursor-not-allowed opacity-30 text-left"
              >
                <div className="font-bold text-xs">Unidad Red /dev/sdb</div>
                <div className="text-[9px] mt-1">No asignada</div>
              </button>

              <button
                disabled
                className="p-3 rounded-lg border border-slate-900 bg-slate-955 hover:cursor-not-allowed opacity-30 text-left"
              >
                <div className="font-bold text-xs">Partición local /dev/sdc</div>
                <div className="text-[9px] mt-1">No asignada</div>
              </button>
            </div>

            {/* Visual allocation table representation */}
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4">
              <div className="flex justify-between items-center select-none text-xs">
                <span className="font-semibold text-slate-305">Sector de Particiones de Unidad /dev/sda:</span>
                <span className="text-[10px] text-slate-500 font-mono">20480 Sectores Totales</span>
              </div>

              {partitionSuccess ? (
                <div className="space-y-3">
                  {/* Visually colored partitioned bar representation */}
                  <div className="w-full h-8 rounded-lg flex overflow-hidden border border-slate-800">
                    <div className="w-[10%] bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono text-[9px] font-bold border-r border-slate-800" title="Arrancador básico EFI">
                      sda1 (EFI)
                    </div>
                    <div className="w-[15%] bg-amber-505/20 bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono text-[9px] font-bold border-r border-slate-800" title="Área de refresco temporal">
                      sda2 (SWAP)
                    </div>
                    <div className="w-[75%] bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-[10px] font-bold" title="Espacio principal del sistema">
                      sda3 (root, EXT4) 15.0 GB
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>● /dev/sda1 (EFI FAT32 Boot)</span>
                      <span>512 MB</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>● /dev/sda2 (SWAP Linux Swap Virtual)</span>
                      <span>2048 MB</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>● /dev/sda3 (System Primary Ext4)</span>
                      <span>17.4 GB</span>
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
                Puesta en producción del Núcleo Inteligente OpenClaw Beta
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
                <span className="text-emerald-400">$ curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta</span>
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
              <h4 className="text-base font-bold text-slate-100">¡Instalación de ClawOS Completada Exitosamente!</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                El núcleo OpenClaw se instaló debidamente y se ha creado una firma de certificación de compilación beta en tu disco `/home/user`.
              </p>
            </div>

            {/* Installed status verification badge */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-805 border-slate-800 w-xs mx-auto text-xs font-mono space-y-2 text-slate-400">
              <div className="flex justify-between font-sans">
                <span>Kernel:</span>
                <span className="text-emerald-400 font-semibold font-mono">5.16.0-openclaw-generic</span>
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
