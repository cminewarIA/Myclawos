import React, { useState, useEffect } from "react";
import { 
  Wifi, 
  Database, 
  Cpu, 
  Sliders, 
  Play, 
  Square, 
  Activity, 
  TrendingUp, 
  Settings, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  RotateCcw
} from "lucide-react";

export default function ControlPanel() {
  const [activeTab, setActiveTab] = useState<"network" | "memory" | "services">("network");
  
  // Simulated Statistics Real-time States
  const [ramUsed, setRamUsed] = useState(4120); // out of 16384 MB (Host representation)
  const [ramCached, setRamCached] = useState(1850);
  const [ramFree, setRamFree] = useState(10414);
  const [ramPercent, setRamPercent] = useState(25);
  const [ramHistory, setRamHistory] = useState<number[]>(Array(24).fill(25));
  
  const [netSpeedDown, setNetSpeedDown] = useState(4.2); // MB/s
  const [netSpeedUp, setNetSpeedUp] = useState(0.8); // MB/s
  const [netHistoryDown, setNetHistoryDown] = useState<number[]>(Array(24).fill(4.2));
  const [netHistoryUp, setNetHistoryUp] = useState<number[]>(Array(24).fill(0.8));
  const [totalDataDown, setTotalDataDown] = useState(142.4); // MB
  const [totalDataUp, setTotalDataUp] = useState(38.1); // MB

  // Processes state
  const [processes, setProcesses] = useState([
    { pid: 1, name: "systemd", cpu: 0, ram: 15, status: "sleeping" },
    { pid: 42, name: "openclaw-kernel-core", cpu: 3.5, ram: 420, status: "running" },
    { pid: 50, name: "clawbash-shell", cpu: 0.1, ram: 22, status: "running" },
    { pid: 120, name: "xorg-server", cpu: 1.2, ram: 180, status: "sleeping" },
    { pid: 210, name: "network-analyzer-daemon", cpu: 2.1, ram: 85, status: "running" },
    { pid: 301, name: "claw-desktop-env", cpu: 1.8, ram: 250, status: "running" },
    { pid: 405, name: "google-gemini-channel", cpu: 0, ram: 310, status: "running" },
  ]);

  // System Services
  const [services, setServices] = useState([
    { id: "openclaw-cog", name: "OpenClaw Cognitive Daemon", description: "Enlace inteligente con el LLM", status: "active" },
    { id: "vfs-share", name: "Virtual File System Share", description: "Indexado en tiempo real con explorador", status: "active" },
    { id: "net-analyzer", name: "ClawNet Network Traffic Monitor", description: "Sensor de ancho de banda y paquetes", status: "active" },
    { id: "hardware-watch", name: "Cortex Thermal Supervisor", description: "Mantiene la temperatura estable", status: "active" },
  ]);

  // Handle killing virtual processes
  const handleKillProcess = (pid: number) => {
    setProcesses((prev) => prev.filter((p) => p.pid !== pid));
  };

  // Reset processes to default
  const handleResetProcesses = () => {
    setProcesses([
      { pid: 1, name: "systemd", cpu: 0, ram: 15, status: "sleeping" },
      { pid: 42, name: "openclaw-kernel-core", cpu: 3.5, ram: 420, status: "running" },
      { pid: 50, name: "clawbash-shell", cpu: 0.1, ram: 22, status: "running" },
      { pid: 120, name: "xorg-server", cpu: 1.2, ram: 180, status: "sleeping" },
      { pid: 210, name: "network-analyzer-daemon", cpu: 2.1, ram: 85, status: "running" },
      { pid: 301, name: "claw-desktop-env", cpu: 1.8, ram: 250, status: "running" },
      { pid: 405, name: "google-gemini-channel", cpu: 0, ram: 310, status: "running" },
    ]);
  };

  // Service toggle trigger
  const handleToggleService = (id: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return { ...s, status: s.status === "active" ? "inactive" : "active" };
        }
        return s;
      })
    );
  };

  // Dynamic simulation simulation ticks
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Network simulation updates
      setNetSpeedDown((prev) => {
        const delta = (Math.random() * 4 - 2);
        const next = Math.max(0.2, parseFloat((prev + delta).toFixed(1)));
        
        setNetHistoryDown((hist) => [...hist.slice(1), next]);
        setTotalDataDown((acc) => parseFloat((acc + (next / 10)).toFixed(1)));
        return next;
      });

      setNetSpeedUp((prev) => {
        const delta = (Math.random() * 1.2 - 0.6);
        const next = Math.max(0.1, parseFloat((prev + delta).toFixed(1)));
        
        setNetHistoryUp((hist) => [...hist.slice(1), next]);
        setTotalDataUp((acc) => parseFloat((acc + (next / 10)).toFixed(1)));
        return next;
      });

      // 2. RAM calculations updates
      setRamPercent((prev) => {
        const checkActiveServices = services.filter(s => s.status === "active").length;
        const serviceMultiplier = checkActiveServices * 4; // base RAM depend of active service
        const delta = Math.floor(Math.random() * 5) - 2;
        const rawNext = prev + delta;
        const next = Math.min(Math.max(rawNext, 15 + serviceMultiplier), 85);
        
        const totalMaxRAM = 16384;
        const usedMB = Math.floor(totalMaxRAM * (next / 100));
        setRamUsed(usedMB);
        setRamFree(totalMaxRAM - usedMB - ramCached);
        setRamHistory((hist) => [...hist.slice(1), next]);

        return next;
      });

      // 3. Process CPU fluctuation simulation
      setProcesses((prev) =>
        prev.map((p) => {
          if (p.status === "sleeping") return p;
          const cpuDelta = (Math.random() * 4 - 2);
          const nextCpu = Math.min(Math.max(parseFloat((p.cpu + cpuDelta).toFixed(1)), 0.1), 45);
          return { ...p, cpu: nextCpu };
        })
      );

    }, 1000);

    return () => clearInterval(timer);
  }, [services, ramCached]);

  // Helper to format history path for a compact elegant SVG Sparkline
  const generateSvgPath = (history: number[], minVal = 0, maxVal = 100, width = 280, height = 75) => {
    if (history.length === 0) return "";
    const len = history.length;
    let points = "";
    
    // Scale indices to fit nicely
    for (let i = 0; i < len; i++) {
      const x = (i / (len - 1)) * width;
      // Invert Y coordinate since SVG (0,0) is top-left
      const normVal = (history[i] - minVal) / (maxVal - minVal || 1);
      const y = height - (normVal * (height - 8)) - 4; // leave margin padding
      points += `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }
    return points;
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 md:flex-row text-slate-300 antialiased min-h-0 select-none">
      {/* Sidebar selection tabs */}
      <div className="w-full md:w-48 bg-slate-950 p-3 flex md:flex-col space-y-0 md:space-y-1.5 md:space-x-0 border-r border-slate-800 shrink-0 select-none gap-2 shrink-0 overflow-x-auto md:overflow-x-visible">
        <button
          onClick={() => setActiveTab("network")}
          className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start space-x-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition ${
            activeTab === "network"
              ? "bg-slate-900 text-emerald-400 border border-emerald-500/10 font-bold"
              : "hover:bg-slate-900 border border-transparent text-slate-400 hover:text-slate-200"
          }`}
          id="btn-tab-net"
        >
          <Wifi size={14} className={activeTab === "network" ? "text-emerald-400" : "text-slate-500"} />
          <span className="whitespace-nowrap">Monitoreo Red</span>
        </button>

        <button
          onClick={() => setActiveTab("memory")}
          className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start space-x-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition ${
            activeTab === "memory"
              ? "bg-slate-900 text-cyan-400 border border-cyan-500/10 font-bold"
              : "hover:bg-slate-900 border border-transparent text-slate-400 hover:text-slate-200"
          }`}
          id="btn-tab-ram"
        >
          <Database size={14} className={activeTab === "memory" ? "text-cyan-400" : "text-slate-500"} />
          <span className="whitespace-nowrap">RAM y Procesos</span>
        </button>

        <button
          onClick={() => setActiveTab("services")}
          className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start space-x-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition ${
            activeTab === "services"
              ? "bg-slate-900 text-violet-400 border border-violet-500/10 font-bold"
              : "hover:bg-slate-900 border border-transparent text-slate-400 hover:text-slate-200"
          }`}
          id="btn-tab-servis"
        >
          <Sliders size={14} className={activeTab === "services" ? "text-violet-400" : "text-slate-500"} />
          <span className="whitespace-nowrap">Servicios Core</span>
        </button>
      </div>

      {/* Main Stats Panel Content */}
      <div className="flex-1 min-h-0 flex flex-col p-4 overflow-y-auto">
        
        {/* TAB 1: Network Monitors with Graphic Sparklines */}
        {activeTab === "network" && (
          <div className="space-y-4 flex flex-col flex-1" id="network-dashboard">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-200 flex items-center space-x-2">
                  <Activity size={16} className="text-emerald-400" />
                  <span>Ancho de Banda de Clonación Virtual (network_analyzer)</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Diagnóstico y gráfico de tráfico saliente/entrante del emulador ClawOS.</p>
              </div>
              <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full select-none">
                Muestreo: 1s
              </span>
            </div>

            {/* Speeds overview grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Download card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500">Tasa Descarga</span>
                    <h4 className="text-2xl font-black font-mono text-emerald-400 mt-1">{netSpeedDown} <span className="text-xs font-normal">MB/s</span></h4>
                  </div>
                  <div className="text-xs font-mono text-slate-400 text-right">
                    <span className="text-slate-500 block text-[9px] uppercase">Descargado Total</span>
                    <span className="font-bold">{totalDataDown} MB</span>
                  </div>
                </div>

                {/* Live sparkline chart */}
                <div className="h-16 w-full border-b border-l border-slate-900/40 relative mt-4">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path
                      d={generateSvgPath(netHistoryDown, 0, Math.max(...netHistoryDown, 10), 300, 64)}
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    {/* Glowing effect inside chart */}
                    <path
                      d={`${generateSvgPath(netHistoryDown, 0, Math.max(...netHistoryDown, 10), 300, 64)} L 300 64 L 0 64 Z`}
                      fill="url(#gradient-down)"
                      opacity="0.15"
                    />
                    <defs>
                      <linearGradient id="gradient-down" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Upload card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500">Tasa Subida</span>
                    <h4 className="text-2xl font-black font-mono text-cyan-400 mt-1">{netSpeedUp} <span className="text-xs font-normal">MB/s</span></h4>
                  </div>
                  <div className="text-xs font-mono text-slate-400 text-right">
                    <span className="text-slate-500 block text-[9px] uppercase">Subido Total</span>
                    <span className="font-bold">{totalDataUp} MB</span>
                  </div>
                </div>

                {/* Live upload sparkline chart */}
                <div className="h-16 w-full border-b border-l border-slate-900/40 relative mt-4">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path
                      d={generateSvgPath(netHistoryUp, 0, Math.max(...netHistoryUp, 4), 300, 64)}
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <path
                      d={`${generateSvgPath(netHistoryUp, 0, Math.max(...netHistoryUp, 4), 300, 64)} L 300 64 L 0 64 Z`}
                      fill="url(#gradient-up)"
                      opacity="0.15"
                    />
                    <defs>
                      <linearGradient id="gradient-up" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* Detailed sockets connections block */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex-1 min-h-0 overflow-y-auto">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5 font-sans">
                <TrendingUp size={14} className="text-cyan-400" />
                <span>Puertos Virtuales Auxiliares y Sockets Activos</span>
              </h4>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="grid grid-cols-4 gap-2 text-slate-500 border-b border-slate-900 pb-2 text-[10px]">
                  <span>PROTOCOLO</span>
                  <span>DIRECCIÓN LOCAL</span>
                  <span>DIRECCIÓN EXTERNA</span>
                  <span className="text-right">ESTADO / SERVICIO</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-slate-350 py-1.5 border-b border-slate-900/40">
                  <span className="text-emerald-400 text-[10px]">TCP (v4)</span>
                  <span>127.0.0.1:3000</span>
                  <span>0.0.0.0:* (Listen)</span>
                  <span className="text-emerald-400 text-right text-[11px] font-semibold">OpenClaw Server</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-slate-350 py-1.5 border-b border-slate-900/40">
                  <span className="text-cyan-400 text-[10px]">TCP (v4)</span>
                  <span>192.168.1.15:443</span>
                  <span>74.125.138.84:443</span>
                  <span className="text-emerald-500 font-semibold text-right text-[10px] flex items-center justify-end">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping mr-1" /> ESTABLECIDA
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-slate-350 py-1.5 border-b border-slate-900/40">
                  <span className="text-violet-400 text-[10px]">UDP</span>
                  <span>localhost:5353</span>
                  <span>*:*</span>
                  <span className="text-slate-500 text-right text-[11px]">mdns (ClawFinder)</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-slate-350 py-1.5">
                  <span className="text-emerald-400 text-[10px]">WS (SSL)</span>
                  <span>127.0.0.1:8080</span>
                  <span>gemini-interactive-endpoint</span>
                  <span className="text-emerald-500 font-semibold text-right text-[10px] flex items-center justify-end">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1" /> CORE-LINK
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Dynamic RAM Detail & Process Table with Kill Capability */}
        {activeTab === "memory" && (
          <div className="space-y-4 flex flex-col flex-1" id="memory-dashboard">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-200 flex items-center space-x-2">
                  <Database size={16} className="text-cyan-400" />
                  <span>Configuración de RAM del Kernel & Monitor de Procesos</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Analizador pormenorizado en tiempo real de hilos y consumos asignados por ClawOS.</p>
              </div>
              <button
                onClick={handleResetProcesses}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-[10px] rounded text-slate-300 transition"
                title="Restaurar lista de procesos"
                id="btn-reset-procs"
              >
                <RotateCcw size={11} />
                <span>Restaurar</span>
              </button>
            </div>

            {/* RAM Progress summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-950 p-4 border border-slate-800 rounded-xl select-none">
              <div className="sm:col-span-1 flex flex-col items-center justify-center p-2 border-r border-slate-900/60">
                <span className="text-[10px] uppercase text-slate-500 font-mono">Consumo RAM</span>
                <span className="text-3xl font-black font-mono text-cyan-400 mt-1">{ramPercent}%</span>
                <span className="text-[10px] text-slate-400 font-mono mt-1">{ramUsed} MB / 16384 MB</span>
              </div>

              {/* Memory distribution chart lines */}
              <div className="sm:col-span-3 flex flex-col justify-center space-y-3 px-2">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400 text-[11px] font-mono">
                    <span>Espacio de Usuario Asignado (RAM Activa)</span>
                    <span className="font-bold text-cyan-400">{ramUsed} MB</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                    <div className="bg-cyan-500 h-full transition-all duration-1000" style={{ width: `${ramPercent}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Buffer / Caché:</span>
                    <span className="text-slate-300">{ramCached} MB</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">RAM Disponible:</span>
                    <span className="text-slate-300">{ramFree} MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Process List Table */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex-1 min-h-0 flex flex-col overflow-y-auto">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-sans flex items-center space-x-1.5 select-none shrink-0 border-b border-slate-900 pb-2">
                <Cpu size={14} className="text-violet-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Interactuar con Procesos (Clawbash CLI & Kernel-Core-Mapp)</span>
              </h4>

              <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 text-xs font-mono">
                <div className="grid grid-cols-6 gap-2 text-slate-500 text-[9px] uppercase tracking-wider pb-1.5 select-none border-b border-slate-900">
                  <span>PID</span>
                  <span className="col-span-2">NOMBRE PROCESO</span>
                  <span className="text-center">CPU %</span>
                  <span className="text-center">MEM (MB)</span>
                  <span className="text-right">ACCIONES</span>
                </div>

                {processes.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 select-none">
                    Sin procesos virtuales activos. Presione "Restaurar" arriba.
                  </div>
                ) : (
                  processes.map((p) => (
                    <div key={p.pid} className="grid grid-cols-6 gap-2 py-1.5 border-b border-slate-900/30 items-center hover:bg-slate-900/20 px-1 rounded transition">
                      <span className="text-slate-500 text-[11px]">{p.pid}</span>
                      <span className="col-span-2 font-semibold text-slate-100 font-mono truncate" title={p.name}>
                        {p.name}
                      </span>
                      <span className="text-center text-emerald-400 text-[11px]">{p.cpu}%</span>
                      <span className="text-center text-cyan-400 text-[11px]">{p.ram} MB</span>
                      <span className="text-right">
                        {p.pid === 1 || p.pid === 42 ? (
                          <span className="text-[10px] text-slate-600 px-1.5 py-0.5 border border-slate-900 rounded bg-slate-950 cursor-not-allowed select-none">
                            Protegido
                          </span>
                        ) : (
                          <button
                            onClick={() => handleKillProcess(p.pid)}
                            className="p-1 px-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white rounded border border-rose-900/30 text-[10px] font-semibold transition"
                            title="Matar proceso virtual de forma inmediata"
                          >
                            Kill SIGKILL
                          </button>
                        )}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: System Services & Switches */}
        {activeTab === "services" && (
          <div className="space-y-4 flex flex-col flex-1" id="services-dashboard">
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-slate-200 flex items-center space-x-2">
                <Sliders size={16} className="text-violet-400" />
                <span>Gestión de Demonios del Sistema (Daemons manager)</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Permite suspender servicios simulados de ClawOS para liberar memoria RAM y ajustar perfiles.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 pr-4">
                      <h4 className="text-xs font-bold text-slate-200">{service.name}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{service.description}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono leading-none select-none shrink-0 ${
                        service.status === "active"
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          : "bg-slate-900 border border-slate-800 text-slate-500"
                      }`}
                    >
                      {service.status === "active" ? "RUNNING" : "STOPPED"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900 mt-4 pt-3.5">
                    <span className="text-[10px] text-slate-600 font-mono">Consumo virtual: {service.status === "active" ? "8.4 MW" : "0.0 MW"}</span>
                    <button
                      onClick={() => handleToggleService(service.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs select-none font-sans font-semibold border transition ${
                        service.status === "active"
                          ? "bg-rose-950 hover:bg-rose-900 border-rose-900/50 text-rose-300"
                          : "bg-emerald-950 hover:bg-emerald-900 border-emerald-900/50 text-emerald-300"
                      }`}
                      id={`btn-toggle-service-${service.id}`}
                    >
                      {service.status === "active" ? (
                        <>
                          <Square size={11} fill="currentColor" />
                          <span>Detener daemon</span>
                        </>
                      ) : (
                        <>
                          <Play size={11} fill="currentColor" />
                          <span>Iniciar daemon</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Diagnostic system log snippet */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start space-x-2.5 text-xs text-slate-400 leading-relaxed font-sans mt-auto">
              <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide font-mono">Estatus de Integridad de clawOS</p>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">
                  Todos los sockets y descriptores de archivos virtuales del explorador gráfico están sincronizados sin fallos lógicos. La CPU virtual se encuentra estabilizada bajo carga moderada de 1.1 GHz lógicos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
