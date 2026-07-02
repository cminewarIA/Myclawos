import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Tv, 
  Wifi, 
  Sliders, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Settings, 
  Activity, 
  Database, 
  Server, 
  ShieldCheck, 
  Zap,
  Info
} from "lucide-react";

interface HardwareControlProps {
  vfs: any;
  setVfs: (newVfs: any) => void;
  triggerNotification: (text: string, type: "success" | "info") => void;
}

export interface HardwareHost {
  id: string;
  name: string;
  brand: string;
  model: string;
  specs: {
    cpu: string;
    gpu: string;
    wifi: string;
    audio: string;
  };
  requiredDrivers: {
    id: string;
    name: string;
    version: string;
    provider: string;
    type: "gpu" | "wifi" | "audio";
  }[];
}

export const HOSTS_DATABASE: HardwareHost[] = [
  {
    id: "host_1",
    name: "Equipo 1 - Laptop Ultraportátil",
    brand: "Lenovo",
    model: "ThinkPad Carbon X1 Intel",
    specs: {
      cpu: "Intel Core i7-1370P vPro (14 Cores / 20 Threads)",
      gpu: "Intel Iris Xe Graphics G7 (Controlador Libre i915)",
      wifi: "Atheros AR9287 Wireless Network Adapter (Controlador Libre ath9k)",
      audio: "Realtek ALC285 High Definition Audio (Controlador Libre snd-hda-intel)"
    },
    requiredDrivers: [] // All use free open-source drivers!
  },
  {
    id: "host_2",
    name: "Equipo 2 - Estación Gaming Extrema",
    brand: "ASUS ROG",
    model: "Strix G16 Custom AMD/NVIDIA",
    specs: {
      cpu: "AMD Ryzen 9 7900X (12 Cores / 24 Threads, 5.4GHz)",
      gpu: "NVIDIA GeForce RTX 4090 Founders Edition (16GB VRAM GDDR6X)",
      wifi: "Intel Killer Wi-Fi 6E AX1675i Tri-Band (Módulo propietario Killer Pro)",
      audio: "Creative SoundBlaster AE-9 DAC (Controlador Libre snd-usb-audio)"
    },
    requiredDrivers: [
      {
        id: "nvidia-gforce-rtx",
        name: "NVIDIA ForceWare Proprietary Driver Suite",
        version: "v555.12-dkms",
        provider: "NVIDIA Corporation",
        type: "gpu"
      },
      {
        id: "killer-wifi-pro",
        name: "Intel Killer Performance Wireless Stack",
        version: "v3.4.152",
        provider: "Intel/Killer Wireless Group",
        type: "wifi"
      }
    ]
  },
  {
    id: "host_3",
    name: "Equipo 3 - Workstation de IA Profesional",
    brand: "Dell Precision",
    model: "7960 Tower Dual Xeon/NVIDIA Ada",
    specs: {
      cpu: "Dual Intel Xeon Platinum 8480+ (112 Cores / 224 Threads)",
      gpu: "NVIDIA RTX A6000 Ada Generation Enterprise (48GB VRAM ECC)",
      wifi: "Broadcom BCM4360 802.11ac dual-band (Módulo propietario broadcom-sta)",
      audio: "Realtek ALC1220 HD Audio Pro (Módulo de alta definición ASIO Pro)"
    },
    requiredDrivers: [
      {
        id: "nvidia-rtx-enterprise",
        name: "NVIDIA RTX Enterprise Production Branch Driver",
        version: "v550.40.02-stable",
        provider: "NVIDIA Enterprise Solutions",
        type: "gpu"
      },
      {
        id: "broadcom-sta-extreme",
        name: "Broadcom WL Proprietary dkms Linux Driver",
        version: "v6.30.223.271",
        provider: "Broadcom Inc.",
        type: "wifi"
      },
      {
        id: "realtek-hd-asio-pro",
        name: "Realtek High Definition ASIO Pro Audio Engine",
        version: "v2.9.12-pro",
        provider: "Realtek Semiconductor Corp.",
        type: "audio"
      }
    ]
  }
];

export default function HardwareControl({
  vfs,
  setVfs,
  triggerNotification
}: HardwareControlProps) {
  const [currentHostId, setCurrentHostId] = useState<string>(() => {
    return localStorage.getItem("cminewar_current_host") || "host_1";
  });

  const [installedDrivers, setInstalledDrivers] = useState<string[]>(() => {
    const saved = localStorage.getItem("cminewar_installed_drivers");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<"status" | "database" | "logs">("status");
  const [isRebooting, setIsRebooting] = useState(false);
  const [simulatedLog, setSimulatedLog] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});

  const currentHost = HOSTS_DATABASE.find(h => h.id === currentHostId) || HOSTS_DATABASE[0];

  // Load diagnostic logs based on current installation status
  useEffect(() => {
    const logs: string[] = [];
    logs.push(`[systemd] Initializing hardware sensing service...`);
    logs.push(`[udev] Populating physical devices map...`);
    logs.push(`[kernel] Host CPU detected: ${currentHost.specs.cpu}`);
    logs.push(`[kernel] Host GPU detected: ${currentHost.specs.gpu}`);
    logs.push(`[kernel] Host Network detected: ${currentHost.specs.wifi}`);
    logs.push(`[kernel] Host Audio detected: ${currentHost.specs.audio}`);
    
    currentHost.requiredDrivers.forEach(dr => {
      const isInstalled = installedDrivers.includes(dr.id);
      if (isInstalled) {
        logs.push(`[driver-db] Proprietary driver '${dr.id}' is installed.`);
        logs.push(`[kernel] OPTIMAL DRIVER MATCH: Activating ${dr.name} (${dr.version}) for ${dr.type.toUpperCase()}...`);
      } else {
        logs.push(`[driver-db] Warning: Proprietary driver '${dr.id}' required but not installed yet.`);
      }
    });

    setSimulatedLog(logs);
  }, [currentHostId, installedDrivers]);

  // Handle Host Switch Simulation (Reboots the simulated OS to trigger Bootloader)
  const handleHostSwitch = (hostId: string) => {
    if (hostId === currentHostId) return;
    localStorage.setItem("cminewar_current_host", hostId);
    triggerNotification(`Simulando cambio de hardware a: ${HOSTS_DATABASE.find(h => h.id === hostId)?.model}. Reiniciando sistema...`, "info");
    setIsRebooting(true);
    
    setTimeout(() => {
      // Set OS in reboot state by triggering window event or reload
      localStorage.setItem("cminewar_force_reboot", "true");
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans select-none" id="hardware-control-app">
      {/* Banner / Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sliders size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-slate-200">Panel de Control de Hardware Híbrido</h2>
            <p className="text-[11px] text-slate-400 font-mono">Detección Auto-Sensing & Base de Datos de Drivers</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs font-mono">
          <span className="text-slate-500">Host Actual:</span>
          <span className="text-emerald-400 font-bold">{currentHost.model}</span>
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="flex border-b border-slate-900 bg-slate-950 px-2">
        <button
          onClick={() => setActiveTab("status")}
          className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === "status"
              ? "border-emerald-500 text-emerald-400 bg-slate-900/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          id="tab-hardware-status"
        >
          <Activity size={13} />
          <span>Detección & Diagnóstico</span>
        </button>
        <button
          onClick={() => setActiveTab("database")}
          className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === "database"
              ? "border-emerald-500 text-emerald-400 bg-slate-900/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          id="tab-hardware-db"
        >
          <Database size={13} />
          <span>Base de Datos de Drivers</span>
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === "logs"
              ? "border-emerald-500 text-emerald-400 bg-slate-900/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          id="tab-hardware-logs"
        >
          <Cpu size={13} />
          <span>Logs de Kernel dkms</span>
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {isRebooting ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="text-emerald-400 animate-spin w-10 h-10" />
            <p className="text-sm font-mono text-slate-300">Apagando daemons y preparando reinicio en nueva arquitectura...</p>
          </div>
        ) : activeTab === "status" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1 & 2: Component sensing list */}
            <div className="md:col-span-2 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono flex items-center space-x-2">
                <Zap size={12} className="text-emerald-400" />
                <span>Hardware Físico Detectado en el Ordenador</span>
              </h3>

              <div className="space-y-2.5">
                {/* CPU */}
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/35 flex items-start space-x-3.5">
                  <Cpu className="text-blue-400 mt-0.5 shrink-0" size={18} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300">Procesador (CPU)</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">Óptimo</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1 font-mono truncate">{currentHost.specs.cpu}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Controlador: dkms-governor (Multipensador habilitado)</p>
                  </div>
                </div>

                {/* GPU */}
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/35 flex items-start space-x-3.5">
                  <Tv className="text-indigo-400 mt-0.5 shrink-0" size={18} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300">Adaptador Gráfico (GPU)</span>
                      {currentHost.requiredDrivers.some(d => d.type === "gpu") ? (
                        installedDrivers.includes(currentHost.requiredDrivers.find(d => d.type === "gpu")?.id || "") ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center space-x-1">
                            <CheckCircle2 size={10} /> <span>Propio Activado</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 flex items-center space-x-1 animate-pulse">
                            <Download size={10} className="animate-bounce" /> <span>Descargando...</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">Libre (Soporte Nativo)</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 mt-1 font-mono truncate">{currentHost.specs.gpu}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Driver actual: {currentHost.requiredDrivers.some(d => d.type === "gpu") 
                        ? (installedDrivers.includes(currentHost.requiredDrivers.find(d => d.type === "gpu")?.id || "") 
                          ? `${currentHost.requiredDrivers.find(d => d.type === "gpu")?.name} (Privativo)` 
                          : "Genérico Libre Nouveau/Vesa (Descarga en background)")
                        : "Intel Iris Xe Native Driver (Libre)"}
                    </p>
                  </div>
                </div>

                {/* Wi-Fi / LAN */}
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/35 flex items-start space-x-3.5">
                  <Wifi className="text-pink-400 mt-0.5 shrink-0" size={18} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300">Adaptador de Red Wi-Fi / Ethernet</span>
                      {currentHost.requiredDrivers.some(d => d.type === "wifi") ? (
                        installedDrivers.includes(currentHost.requiredDrivers.find(d => d.type === "wifi")?.id || "") ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center space-x-1">
                            <CheckCircle2 size={10} /> <span>Propio Activado</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 flex items-center space-x-1 animate-pulse">
                            <Download size={10} className="animate-bounce" /> <span>Descargando...</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">Libre (Soporte Nativo)</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 mt-1 font-mono truncate">{currentHost.specs.wifi}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Driver actual: {currentHost.requiredDrivers.some(d => d.type === "wifi") 
                        ? (installedDrivers.includes(currentHost.requiredDrivers.find(d => d.type === "wifi")?.id || "") 
                          ? `${currentHost.requiredDrivers.find(d => d.type === "wifi")?.name} (Privativo)` 
                          : "ath9k / firmware-free standard module (Descarga en background)")
                        : "Atheros ath9k Open Source Driver (Libre)"}
                    </p>
                  </div>
                </div>

                {/* Audio */}
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/35 flex items-start space-x-3.5">
                  <Activity className="text-amber-400 mt-0.5 shrink-0" size={18} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300">Controlador de Audio (DAC)</span>
                      {currentHost.requiredDrivers.some(d => d.type === "audio") ? (
                        installedDrivers.includes(currentHost.requiredDrivers.find(d => d.type === "audio")?.id || "") ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center space-x-1">
                            <CheckCircle2 size={10} /> <span>Propio Activado</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 flex items-center space-x-1 animate-pulse">
                            <Download size={10} className="animate-bounce" /> <span>Descargando...</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">Libre (Soporte Nativo)</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 mt-1 font-mono truncate">{currentHost.specs.audio}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Driver actual: {currentHost.requiredDrivers.some(d => d.type === "audio") 
                        ? (installedDrivers.includes(currentHost.requiredDrivers.find(d => d.type === "audio")?.id || "") 
                          ? `${currentHost.requiredDrivers.find(d => d.type === "audio")?.name} (Privativo)` 
                          : "snd-hda-intel core driver (Descarga en background)")
                        : "Realtek Integrated Standard Driver (Libre)"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Multi-Host Environment Switcher */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono flex items-center space-x-2">
                <Server size={12} className="text-indigo-400" />
                <span>Simulador Multi-Host (Portable SSD)</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                El sistema CMineWar OS funciona como una unidad live portable SSD. Al iniciar en un equipo diferente, realizará una nueva detección de hardware y autodescargará sus controladores sin alterar los de otras computadoras.
              </p>

              <div className="space-y-2">
                {HOSTS_DATABASE.map(h => (
                  <button
                    key={h.id}
                    onClick={() => handleHostSwitch(h.id)}
                    className={`w-full text-left p-2.5 rounded border text-xs font-mono transition-all flex justify-between items-center ${
                      h.id === currentHostId
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-900 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/60 text-slate-300"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold">{h.name}</span>
                      <span className="text-[9.5px] text-slate-500">{h.brand} {h.model}</span>
                    </div>
                    {h.id === currentHostId && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-sans uppercase">Activo</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-2.5 rounded bg-amber-500/5 border border-amber-500/20 text-[10.5px] text-amber-300 flex items-start space-x-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>Al cambiar de Host, el OS simulará un apagado y ejecutará la secuencia de boot BIOS analizando el hardware correspondiente.</span>
              </div>
            </div>
          </div>
        ) : activeTab === "database" ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono flex items-center space-x-2">
                  <Database size={12} className="text-emerald-400" />
                  <span>Controladores Propietarios Almacenados en Disco</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Se listan todos los controladores dkms que han sido descargados en los diferentes hosts detectados.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded px-2.5 py-1">
                Total Descargados: <span className="text-emerald-400 font-bold">{installedDrivers.length}</span>
              </div>
            </div>

            {/* Drivers list */}
            <div className="space-y-2">
              {HOSTS_DATABASE.flatMap(h => h.requiredDrivers).length === 0 ? (
                <div className="p-8 text-center rounded-lg border border-dashed border-slate-800 text-slate-500 text-xs">
                  No hay controladores propietarios configurados en esta arquitectura.
                </div>
              ) : (
                HOSTS_DATABASE.flatMap(h => h.requiredDrivers).map((dr, index) => {
                  const isInstalled = installedDrivers.includes(dr.id);
                  const belongsToCurrentHost = currentHost.requiredDrivers.some(d => d.id === dr.id);
                  
                  return (
                    <div
                      key={`${dr.id}-${index}`}
                      className={`p-3.5 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${
                        isInstalled 
                          ? belongsToCurrentHost
                            ? "bg-emerald-500/5 border-emerald-500/20"
                            : "bg-slate-900/40 border-slate-800/80"
                          : "bg-slate-900/10 border-slate-900 border-dashed"
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xs font-bold text-slate-200">{dr.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">{dr.version}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-1 font-mono">
                          <span>Proveedor: {dr.provider}</span>
                          <span>•</span>
                          <span>Tipo: {dr.type.toUpperCase()}</span>
                          <span>•</span>
                          <span>ID Hardware: {dr.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {isInstalled ? (
                          belongsToCurrentHost ? (
                            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono font-bold">
                              <ShieldCheck size={12} />
                              <span>Activo (Óptimo)</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-800/60 border border-slate-700/50 px-2.5 py-1 rounded-full font-mono">
                              <AlertTriangle size={12} className="text-slate-500" />
                              <span>Inactivo (Inadecuado)</span>
                            </div>
                          )
                        ) : (
                          <div className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full font-mono flex items-center space-x-1 animate-pulse">
                            <Download size={11} className="animate-bounce" />
                            <span>Pendiente de Descarga</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/30 text-xs text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-200">¿Cómo funciona la persistencia híbrida?</span> Al iniciar por primera vez en un <span className="text-indigo-400 font-bold">segundo o tercer equipo</span>, el driver propietario correspondiente es descargado en segundo plano e incorporado a la base de datos de disco local. Cuando el sistema detecta que el hardware ha cambiado nuevamente, los controladores no adecuados son marcados como <span className="text-amber-400 font-bold">Inactivos</span> para evitar cuelgues o pánicos del kernel, y únicamente se activa el módulo privativo óptimo para cada componente de manera dinámica.
            </div>
          </div>
        ) : (
          <div className="space-y-4 font-mono">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono flex items-center space-x-2">
              <Cpu size={12} className="text-emerald-400" />
              <span>Diagnósticos de udev / compilador dkms</span>
            </h3>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 h-64 overflow-y-auto text-[11px] text-emerald-400 space-y-1 font-mono">
              {simulatedLog.map((log, i) => (
                <div key={i} className={log.includes("Warning") ? "text-amber-400" : log.includes("OPTIMAL") ? "text-cyan-400 font-bold" : "text-emerald-400/80"}>
                  {log}
                </div>
              ))}
              <div className="text-slate-500 animate-pulse">_</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Proyecto propiedad de Yonah Llanes
