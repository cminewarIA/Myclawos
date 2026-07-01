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
  RotateCcw,
  Sparkles,
  Smartphone,
  Bot,
  ShieldCheck
} from "lucide-react";
import { cminewarFetch } from "../utils/api";

import BootDiagnosticsPanel from "./BootDiagnosticsPanel";

interface ControlPanelProps {
  openWindow?: (id: string) => void;
}

export default function ControlPanel({ openWindow }: ControlPanelProps = {}) {
  const [activeTab, setActiveTab ] = useState<"network" | "memory" | "services" | "wallpaper" | "diagnostics">("network");
  
  // Simulated Statistics Real-time States
  const [ramUsed, setRamUsed] = useState(4120); // out of 16384 MB (Host representation)
  const [ramCached, setRamCached] = useState(1850);
  const [ramFree, setRamFree] = useState(10414);
  const [ramPercent, setRamPercent] = useState(25);
  const [ramHistory, setRamHistory] = useState<number[]>(Array(24).fill(25));

  // Wallpaper Settings synced with localStorage
  const [nanoBananaSize, setNanoBananaSize] = useState<"nano" | "estandar" | "maxi">(() => {
    return (localStorage.getItem("cminewar_nano_banana_size") as any) || "estandar";
  });
  const [lineStyle, setLineStyle] = useState<"curvo" | "recto" | "oculto">(() => {
    return (localStorage.getItem("cminewar_nano_line_style") as any) || "curvo";
  });
  const [glowIntensity, setGlowIntensity] = useState<"sutil" | "medio" | "fuerte">(() => {
    return (localStorage.getItem("cminewar_nano_glow_intensity") as any) || "medio";
  });
  const [simulatedHour, setSimulatedHour] = useState<string>(() => {
    return localStorage.getItem("cminewar_nano_sim_hour") || "real";
  });
  const [dimOpacity, setDimOpacity] = useState<string>(() => {
    return localStorage.getItem("cminewar_nano_dim_opacity") || "0";
  });
  const [showGrid, setShowGrid] = useState<string>(() => {
    const saved = localStorage.getItem("cminewar_nano_show_grid");
    return saved === null ? "true" : saved;
  });
  const [showStars, setShowStars] = useState<string>(() => {
    const saved = localStorage.getItem("cminewar_nano_show_stars");
    return saved === null ? "true" : saved;
  });
  const [showCoreLogo, setShowCoreLogo] = useState<string>(() => {
    const saved = localStorage.getItem("cminewar_nano_show_core_logo");
    return saved === null ? "true" : saved;
  });
  const [wallpaperPattern, setWallpaperPattern] = useState<string>(() => {
    return localStorage.getItem("cminewar_nano_pattern") || "wireframe";
  });

  const updateWallpaperSetting = (key: string, value: string) => {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("cminewar_wallpaper_settings_changed"));
  };

  useEffect(() => {
    const syncWallpaperSettings = () => {
      setNanoBananaSize((localStorage.getItem("cminewar_nano_banana_size") as any) || "estandar");
      setLineStyle((localStorage.getItem("cminewar_nano_line_style") as any) || "curvo");
      setGlowIntensity((localStorage.getItem("cminewar_nano_glow_intensity") as any) || "medio");
      setSimulatedHour(localStorage.getItem("cminewar_nano_sim_hour") || "real");
      setDimOpacity(localStorage.getItem("cminewar_nano_dim_opacity") || "0");
      const savedGrid = localStorage.getItem("cminewar_nano_show_grid");
      setShowGrid(savedGrid === null ? "true" : savedGrid);
      const savedStars = localStorage.getItem("cminewar_nano_show_stars");
      setShowStars(savedStars === null ? "true" : savedStars);
      const savedLogo = localStorage.getItem("cminewar_nano_show_core_logo");
      setShowCoreLogo(savedLogo === null ? "true" : savedLogo);
      setWallpaperPattern(localStorage.getItem("cminewar_nano_pattern") || "wireframe");
    };
    window.addEventListener("storage", syncWallpaperSettings);
    window.addEventListener("cminewar_wallpaper_settings_changed", syncWallpaperSettings);
    return () => {
      window.removeEventListener("storage", syncWallpaperSettings);
      window.removeEventListener("cminewar_wallpaper_settings_changed", syncWallpaperSettings);
    };
  }, []);
  
  // Real Host Integration States (Debian Bare-Metal)
  const [isRealHost, setIsRealHost] = useState(false);
  const [firewallActive, setFirewallActive] = useState(false);
  const [isTogglingFirewall, setIsTogglingFirewall] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [temperature, setTemperature] = useState(41);
  const [hostPlatform, setHostPlatform] = useState("");
  const [hostArch, setHostArch] = useState("");
  const [hostname, setHostname] = useState("");

  const [netSpeedDown, setNetSpeedDown] = useState(4.2); // MB/s
  const [netSpeedUp, setNetSpeedUp] = useState(0.8); // MB/s
  const [netHistoryDown, setNetHistoryDown] = useState<number[]>(Array(24).fill(4.2));
  const [netHistoryUp, setNetHistoryUp] = useState<number[]>(Array(24).fill(0.8));
  const [totalDataDown, setTotalDataDown] = useState(142.4); // MB
  const [totalDataUp, setTotalDataUp] = useState(38.1); // MB

  // Dynamic window tracking state for network analyzer breakdown
  const [runningWindows, setRunningWindows] = useState<{ id: string; isOpen: boolean; title: string }[]>(() => {
    const saved = localStorage.getItem("clawos_windows_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((w: any) => ({
            id: w.id,
            isOpen: !w.isMinimized && !!w.isOpen, // Only count as fully open if open and not minimized
            title: w.title || w.id
          }));
        }
      } catch (e) {}
    }
    return [];
  });

  // Processes state
  const [processes, setProcesses] = useState([
    { pid: 1, name: "systemd", cpu: 0, ram: 15, status: "sleeping" },
    { pid: 42, name: "antigravity-kernel-core", cpu: 3.5, ram: 420, status: "running" },
    { pid: 50, name: "antigravitybash-shell", cpu: 0.1, ram: 22, status: "running" },
    { pid: 120, name: "agetty-tty1", cpu: 0.1, ram: 10, status: "sleeping" },
    { pid: 210, name: "network-analyzer-daemon", cpu: 2.1, ram: 85, status: "running" },
    { pid: 301, name: "tmux-server", cpu: 1.8, ram: 45, status: "running" },
    { pid: 405, name: "google-gemini-channel", cpu: 0, ram: 310, status: "running" },
  ]);

  // System Services
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem("claw_system_services");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const sleepDisabled = localStorage.getItem("claw_sleep_disabled") === "true";
    const initialServices = [
      { id: "openclaw-cog", name: "CMineWar OS Cognitive Daemon", description: "Enlace inteligente con el LLM", status: "active" },
      { id: "vfs-share", name: "Virtual File System Share", description: "Indexado en tiempo real con explorador", status: "active" },
      { id: "net-analyzer", name: "CMineWarNet Network Traffic Monitor", description: "Sensor de ancho de banda y paquetes", status: "active" },
      { id: "hardware-watch", name: "Cortex Thermal Supervisor", description: "Mantiene la temperatura estable", status: "active" },
      { id: "acpi-sleep", name: "ACPI Sleep/Suspend Supervisor", description: "Gestor de estado de energía de hardware. Suspendido permanentemente por root.", status: sleepDisabled ? "disabled_permanently" : "active" },
    ];
    localStorage.setItem("claw_system_services", JSON.stringify(initialServices));
    return initialServices;
  });

  // Keep services persisted and dispatch event on update
  useEffect(() => {
    if (!isRealHost) {
      localStorage.setItem("claw_system_services", JSON.stringify(services));
      window.dispatchEvent(new Event("storage"));
    }
  }, [services, isRealHost]);

  // Fetch real-world metrics from Express system telemetry API (real Debian integration)
  const fetchMetrics = async () => {
    try {
      const res = await cminewarFetch("/api/cminewar/system-metrics");
      if (res.ok) {
        const data = await res.json();
        if (data.isRealHost) {
          setIsRealHost(true);
          setRamPercent(data.memory.percent);
          setRamUsed(data.memory.used);
          setRamFree(data.memory.free);
          setRamCached(data.memory.cached);
          setProcesses(data.processes);
          setServices(data.services);
          setFirewallActive(data.firewallActive);
          setUptime(data.uptime);
          setTemperature(data.temperature);
          setHostPlatform(data.platform);
          setHostArch(data.arch);
          setHostname(data.hostname);
          return true;
        }
      }
    } catch (e) {
      // benign network fail
    }
    setIsRealHost(false);
    return false;
  };

  // Trigger real or simulated power state transitions (shutdown/reboot)
  const handlePowerAction = async (action: "reboot" | "shutdown") => {
    const confirmation = window.confirm(`¿Estás completamente seguro de que deseas enviar la orden de ${action.toUpperCase()} al equipo host?`);
    if (!confirmation) return;

    try {
      const res = await cminewarFetch("/api/cminewar/system/power", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      alert(data.message || `Orden de ${action.toUpperCase()} enviada.`);
    } catch (e) {
      alert("Error al enviar la comando de alimentación.");
    }
  };

  // Toggle real or simulated firewall rules (iptables WAN block)
  const handleToggleFirewall = async () => {
    const nextAction = firewallActive ? "allow" : "block";
    setIsTogglingFirewall(true);
    
    if (isRealHost) {
      try {
        const res = await cminewarFetch("/api/cminewar/firewall/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: nextAction })
        });
        const data = await res.json();
        if (data.error) {
          alert(`Error controlando cortafuegos real: ${data.error}`);
        } else {
          setFirewallActive(nextAction === "block");
          alert(data.message || "Cambio de cortafuegos aplicado.");
        }
      } catch (e) {
        console.error("Fallo de red al interactuar con el cortafuegos real", e);
      } finally {
        setIsTogglingFirewall(false);
        fetchMetrics();
      }
    } else {
      // Simulated toggling
      setTimeout(() => {
        setFirewallActive(nextAction === "block");
        setIsTogglingFirewall(false);
        alert(`[SALA DE CONTROL] Tránsito WAN ${nextAction === "block" ? "BLOQUEADO" : "CONCEDIDO"} correctamente (Modo Simulador).`);
      }, 800);
    }
  };

  // Handle killing virtual processes
  const handleKillProcess = (pid: number) => {
    setProcesses((prev) => prev.filter((p) => p.pid !== pid));
  };

  // Reset processes to default
  const handleResetProcesses = () => {
    if (isRealHost) {
      fetchMetrics();
      return;
    }
    setProcesses([
      { pid: 1, name: "systemd", cpu: 0, ram: 15, status: "sleeping" },
      { pid: 42, name: "antigravity-kernel-core", cpu: 3.5, ram: 420, status: "running" },
      { pid: 50, name: "antigravitybash-shell", cpu: 0.1, ram: 22, status: "running" },
      { pid: 120, name: "agetty-tty1", cpu: 0.1, ram: 10, status: "sleeping" },
      { pid: 210, name: "network-analyzer-daemon", cpu: 2.1, ram: 85, status: "running" },
      { pid: 301, name: "tmux-server", cpu: 1.8, ram: 45, status: "running" },
      { pid: 405, name: "google-gemini-channel", cpu: 0, ram: 310, status: "running" },
    ]);
  };

  // Service toggle trigger
  const handleToggleService = async (id: string) => {
    if (id === "acpi-sleep") {
      const isSleepDisabled = localStorage.getItem("claw_sleep_disabled") === "true";
      if (isSleepDisabled) {
        alert("Las funciones de suspensión e hibernación han sido desactivadas de forma definitiva por configuración del Kernel del Sistema (Acceso Root Directo).");
        return;
      }
    }

    if (isRealHost) {
      const srv = services.find(s => s.id === id);
      if (!srv) return;
      const action = srv.status === "active" ? "stop" : "start";
      try {
        const res = await cminewarFetch("/api/cminewar/services/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId: id, action })
        });
        const data = await res.json();
        if (data.error) {
          alert(`Error controlando el servicio de systemd: ${data.error}`);
        } else {
          fetchMetrics();
        }
      } catch (e) {
        console.error("Error al controlar el servicio:", e);
      }
    } else {
      setServices((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            return { ...s, status: s.status === "active" ? "inactive" : "active" };
          }
          return s;
        })
      );
    }
  };

  // Dynamic simulation simulation ticks & real-world telemetry fetching
  useEffect(() => {
    // Initial fetch
    fetchMetrics();

    // Secondary poll for real metrics
    const metricsPoll = setInterval(() => {
      fetchMetrics();
    }, 2000);

    const timer = setInterval(() => {
      // Sync running windows dynamically matching real desktop activity
      const savedWins = localStorage.getItem("clawos_windows_state");
      if (savedWins) {
        try {
          const parsed = JSON.parse(savedWins);
          if (Array.isArray(parsed)) {
            setRunningWindows(parsed.map((w: any) => ({
              id: w.id,
              isOpen: !w.isMinimized && !!w.isOpen,
              title: w.title || w.id
            })));
          }
        } catch (e) {}
      }

      // 1. Network simulation updates (always run for active charts consistency)
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

      // Skip simulation calculations of RAM & CPU if we are receiving real physical data from the host
      if (isRealHost) {
        return;
      }

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

    return () => {
      clearInterval(metricsPoll);
      clearInterval(timer);
    };
  }, [services, ramCached, isRealHost]);

  // Format uptime into readable days, hours, and minutes
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

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

  // List of applications we want to track in the real-time bandwidth summary table
  const trackedApps = [
    { id: "chromium", label: "Navegador Chromium (Kiosco)", process: "chromium", baseWeight: 65, colorClass: "text-amber-400" },
    { id: "openclaw_core", label: "Antigravity Agent CLI (Agente de IA)", process: "antigravity-cli", baseWeight: 22, colorClass: "text-purple-400" },
    { id: "terminal", label: "Consola de Comandos Bash", process: "cminewar-bash", baseWeight: 4, colorClass: "text-emerald-400" },
    { id: "file_manager", label: "Explorador de Archivos (CMineWarFM)", process: "cminewar-fm", baseWeight: 2, colorClass: "text-indigo-400" },
    { id: "control_panel", label: "Panel de Monitoreo de Red", process: "cminewar-control", baseWeight: 3, colorClass: "text-violet-400" },
    { id: "installer", label: "Instalador de CMineWar OS", process: "cminewar-installer", baseWeight: 4, colorClass: "text-pink-400" },
  ];

  // Helper to get open status from dynamic state or defaults
  const getAppIsOpen = (appId: string) => {
    if (runningWindows.length > 0) {
      const found = runningWindows.find(w => w.id === appId);
      return found ? found.isOpen : false;
    }
    // Fallback defaults in case windows list isn't synced yet
    const defaults: Record<string, boolean> = {
      chromium: false,
      openclaw_core: true,
      terminal: true,
      control_panel: true,
      installer: true,
      file_manager: false,
    };
    return defaults[appId] ?? false;
  };

  // Compute active states and final traffic weights which dynamically adjust to UI windows state
  const getProcessedAppsWithNetwork = () => {
    const apps = trackedApps.map(app => {
      const isOpen = getAppIsOpen(app.id);
      // If closed, openclaw_core retains a tiny background traffic (2), others go to 0
      const weight = isOpen ? app.baseWeight : (app.id === "openclaw_core" ? 2 : 0);
      return {
        ...app,
        isOpen,
        weight
      };
    });

    // Add persistent system background daemons (always open/active)
    apps.push({
      id: "system_daemons",
      label: "Servicios del Sistema (Kernel & Daemons)",
      process: "cminewar-daemons",
      baseWeight: 2,
      colorClass: "text-slate-400",
      isOpen: true,
      weight: 2
    });

    const totalWeight = apps.reduce((acc, a) => acc + a.weight, 0) || 1;

    return apps.map(app => {
      const dlFactor = (app.weight / totalWeight);
      const dlSpeed = dlFactor * netSpeedDown;
      const ulSpeed = dlFactor * netSpeedUp;
      const share = dlFactor * 100;

      return {
        ...app,
        dlSpeed,
        ulSpeed,
        share
      };
    });
  };

  // Helper to format bandwidth values beautifully
  const formatNetworkSpeed = (speedMB: number) => {
    if (speedMB >= 0.1) {
      return `${speedMB.toFixed(2)} MB/s`;
    } else {
      const speedKB = speedMB * 1024;
      if (speedKB < 0.1) {
        return "0.0 B/s";
      }
      return `${speedKB.toFixed(1)} KB/s`;
    }
  };

  return (
    <div className="h-full w-full overflow-hidden flex-1 flex flex-col bg-slate-900 md:flex-row text-slate-300 antialiased min-h-0 select-none">
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

        <button
          onClick={() => setActiveTab("wallpaper")}
          className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start space-x-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition ${
            activeTab === "wallpaper"
              ? "bg-slate-900 text-pink-400 border border-pink-500/10 font-bold"
              : "hover:bg-slate-900 border border-transparent text-slate-400 hover:text-slate-200"
          }`}
          id="btn-tab-wallpaper"
        >
          <Sparkles size={14} className={activeTab === "wallpaper" ? "text-pink-400" : "text-slate-500"} />
          <span className="whitespace-nowrap">Ajustes Fondo</span>
        </button>

        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start space-x-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition ${
            activeTab === "diagnostics"
              ? "bg-slate-900 text-amber-400 border border-amber-500/10 font-bold"
              : "hover:bg-slate-900 border border-transparent text-slate-400 hover:text-slate-200"
          }`}
          id="btn-tab-diagnostics"
        >
          <Activity size={14} className={activeTab === "diagnostics" ? "text-amber-400" : "text-slate-500"} />
          <span className="whitespace-nowrap">Diagnóstico</span>
        </button>
      </div>

      {/* Main Stats Panel Content */}
      <div className="flex-1 min-h-0 flex flex-col p-4 overflow-y-auto">
        
        {/* Real Host Connection Status Banner */}
        {isRealHost ? (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div>
                <div className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                  <span>SISTEMA OPERATIVO REAL DETECTADO</span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider">Host Activo</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Servidor: <span className="font-semibold text-slate-300 font-mono">{hostname}</span> | Platform: <span className="font-semibold text-slate-300 font-mono">{hostPlatform} ({hostArch})</span> | Uptime: <span className="font-semibold text-slate-300 font-mono">{formatUptime(uptime)}</span>
                </div>
              </div>
            </div>
            
            {/* Real Host Power Controllers */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handlePowerAction("reboot")}
                className="px-2.5 py-1.5 bg-amber-950/40 hover:bg-amber-900 border border-amber-900/40 text-[10px] font-mono rounded text-amber-300 font-bold transition cursor-pointer"
              >
                Reinicio Host
              </button>
              <button
                onClick={() => handlePowerAction("shutdown")}
                className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/40 text-[10px] font-mono rounded text-rose-300 font-bold transition cursor-pointer"
              >
                Apagar Host
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shrink-0" />
              <div>
                <div className="font-bold text-rose-400 font-mono uppercase tracking-wider">
                  ⚠️ NODO DEBIAN RESTRINGIDO / DESCONECTADO
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  No hay telemetría activa con el mainframe físico de CMineWar OS. Se requiere conexión real con el nodo.
                </div>
              </div>
            </div>
            
            <button
              onClick={() => fetchMetrics()}
              className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/40 text-[10px] font-mono rounded text-rose-300 font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>🔄 Reintentar Enlace Físico</span>
            </button>
          </div>
        )}
        
        {/* TAB 1: Network Monitors with Graphic Sparklines */}
        {activeTab === "network" && (
          <div className="space-y-4 flex flex-col flex-1" id="network-dashboard">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-200 flex items-center space-x-2">
                  <Activity size={16} className="text-emerald-400" />
                  <span>Ancho de Banda de Clonación Virtual (network_analyzer)</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Diagnóstico y gráfico de tráfico saliente/entrante del emulador CMineWar OS.</p>
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
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
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
                  <span className="text-emerald-400 text-right text-[11px] font-semibold">CMineWar OS Server</span>
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
                  <span className="text-slate-500 text-right text-[11px]">mdns (CMineWarFinder)</span>
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

            {/* NEW: Bandwidth Usage breakdown per App */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800" id="bandwidth-app-breakdown">
              <div className="flex items-center justify-between mb-3.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 font-sans">
                  <Activity size={14} className="text-emerald-400" />
                  <span>Ancho de Banda por Aplicación de Escritorio</span>
                </h4>
                <div className="text-[10px] font-mono bg-slate-900/40 px-2 py-0.5 rounded text-slate-400 border border-slate-900">
                  Total Red: <span className="text-emerald-400 font-bold font-mono">{(netSpeedDown + netSpeedUp).toFixed(1)} MB/s</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-slate-500 text-[10px] border-b border-slate-900 pb-2 uppercase">
                      <th className="font-semibold pb-2">Aplicación / ID Proceso</th>
                      <th className="font-semibold pb-2 text-center">Estado Escritorio</th>
                      <th className="font-semibold pb-2 text-right">Descarga ↓</th>
                      <th className="font-semibold pb-2 text-right">Subida ↑</th>
                      <th className="font-semibold pb-2 text-right">Carga %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40">
                    {getProcessedAppsWithNetwork().map((app) => (
                      <tr key={app.id} className="text-slate-300 hover:bg-slate-900/30 transition-colors">
                        <td className="py-2.5 font-sans flex items-center space-x-2">
                          <span className={`${app.colorClass} font-mono font-bold text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800/40`}>
                            {app.process}
                          </span>
                          <span className="text-slate-300 font-medium text-xs truncate max-w-[210px]" title={app.label}>
                            {app.label}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          {app.isOpen ? (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 font-medium font-sans animate-pulse">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                              Abierta
                            </span>
                          ) : app.weight > 0 ? (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/10 font-medium font-sans">
                              <span className="w-1 h-1 rounded-full bg-amber-500 mr-1.5" />
                              2º Plano
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-slate-900/50 text-slate-500 border border-slate-800/60 font-sans">
                              Cerrada
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-semibold font-mono text-emerald-400">
                          {formatNetworkSpeed(app.dlSpeed)}
                        </td>
                        <td className="py-2.5 text-right font-semibold font-mono text-cyan-400">
                          {formatNetworkSpeed(app.ulSpeed)}
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-[10px] text-slate-450 font-semibold">{app.share.toFixed(0)}%</span>
                            <div className="w-12 bg-slate-900 rounded-full h-1 overflow-hidden border border-slate-800/80">
                              <div
                                className={`h-full rounded-full ${app.isOpen ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-slate-700'}`}
                                style={{ width: `${app.share}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cortafuegos Físico Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800" id="firewall-control-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 font-sans">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span>Control de Cortafuegos Físico de Red (iptables)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-xl">
                    Bloquea instantáneamente todo el tráfico entrante/saliente de Internet (WAN) para aislar el host físicamente, manteniendo la red local (LAN) libre para la administración.
                  </p>
                </div>
                
                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                    firewallActive 
                      ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" 
                      : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  }`}>
                    {firewallActive ? "BLOQUEADO (LAN ONLY)" : "WAN LIBRE (INTERNET)"}
                  </span>
                  
                  <button
                    onClick={handleToggleFirewall}
                    disabled={isTogglingFirewall}
                    className={`px-3 py-1.5 rounded text-xs font-bold font-sans border transition flex items-center space-x-1.5 ${
                      firewallActive
                        ? "bg-emerald-950 hover:bg-emerald-900 border-emerald-900/50 text-emerald-300"
                        : "bg-rose-950 hover:bg-rose-900 border-rose-900/50 text-rose-300"
                    }`}
                  >
                    {isTogglingFirewall ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Aplicando...</span>
                      </>
                    ) : firewallActive ? (
                      <>
                        <Play size={10} fill="currentColor" />
                        <span>Desbloquear WAN</span>
                      </>
                    ) : (
                      <>
                        <Square size={10} fill="currentColor" />
                        <span>Bloquear WAN (Internet)</span>
                      </>
                    )}
                  </button>
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
                <p className="text-[10px] text-slate-500 mt-0.5">Analizador pormenorizado en tiempo real de hilos y consumos asignados por CMineWar OS.</p>
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
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-sans flex items-center space-x-1.5 select-none shrink-0 border-b border-slate-900 pb-2">
                <Cpu size={14} className="text-violet-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Interactuar con Procesos (CMineWarBash CLI & Kernel-Core-Mapp)</span>
              </h4>

              <div className="space-y-1.5 text-xs font-mono">
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
              <p className="text-[10px] text-slate-500 mt-0.5">Permite suspender servicios simulados de CMineWar OS para liberar memoria RAM y ajustar perfiles.</p>
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
                          : service.status === "disabled_permanently"
                          ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                          : "bg-slate-900 border border-slate-800 text-slate-500"
                      }`}
                    >
                      {service.status === "active" 
                        ? "RUNNING" 
                        : service.status === "disabled_permanently"
                        ? "DISABLED (ROOT)"
                        : "STOPPED"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900 mt-4 pt-3.5">
                    <span className="text-[10px] text-slate-600 font-mono">
                      Consumo virtual: {service.status === "disabled_permanently" ? "0.0 MW" : service.status === "active" ? "8.4 MW" : "0.0 MW"}
                    </span>
                    <button
                      onClick={() => handleToggleService(service.id)}
                      disabled={service.status === "disabled_permanently"}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs select-none font-sans font-semibold border transition ${
                        service.status === "disabled_permanently"
                          ? "bg-slate-950 border-slate-900/40 text-slate-600 cursor-not-allowed"
                          : service.status === "active"
                          ? "bg-rose-950 hover:bg-rose-900 border-rose-900/50 text-rose-300"
                          : "bg-emerald-950 hover:bg-emerald-900 border-emerald-900/50 text-emerald-300"
                      }`}
                      id={`btn-toggle-service-${service.id}`}
                    >
                      {service.status === "disabled_permanently" ? (
                        <>
                          <AlertTriangle size={11} className="text-rose-500 animate-pulse" />
                          <span>Bloqueado</span>
                        </>
                      ) : service.status === "active" ? (
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

            {/* Install New Service Custom Section */}
            <div className="bg-slate-950/75 p-4 rounded-xl border border-dashed border-slate-800 space-y-3 mt-1 shadow-inner" id="install-new-service-container">
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center space-x-1.5 font-mono">
                  <Sliders size={13} className="text-emerald-400" />
                  <span>[SISTEMA] INSTALAR NUEVO SERVICIO DAEMON</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Agrega servicios personalizados al kernel. Nano Banana asimilará el socket al instante en su red de fondo dinámico.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <label className="block text-[9px] text-slate-500 mb-1 font-mono uppercase font-bold">Nombre del Servicio:</label>
                  <input
                    type="text"
                    id="inst-service-name"
                    placeholder="ej. Banana Database Cluster"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 mb-1 font-mono uppercase font-bold">Descripción Corta:</label>
                  <input
                    type="text"
                    id="inst-service-desc"
                    placeholder="ej. Respaldos redundantes en racimos de plátano"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const nameInput = document.getElementById("inst-service-name") as HTMLInputElement;
                    const descInput = document.getElementById("inst-service-desc") as HTMLInputElement;
                    const name = nameInput?.value?.trim();
                    const desc = descInput?.value?.trim();

                    if (!name || !desc) {
                      alert("Por favor rellena el nombre y descripción del nuevo servicio.");
                      return;
                    }

                    const newService = {
                      id: "custom-" + Date.now(),
                      name,
                      description: desc,
                      status: "active"
                    };

                    setServices((prev) => [...prev, newService]);
                    nameInput.value = "";
                    descInput.value = "";
                    alert(`¡Servicio '${name}' instalado e iniciado con éxito! Nano Banana ha expandido su fondo dinámico.`);
                  }}
                  className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded font-semibold text-[11px] transition cursor-pointer font-sans"
                >
                  Registrar e Instalar Servicio
                </button>
              </div>
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

            {/* TAB 4: Wallpaper Configurations & Android OTA Autoupdates */}
        {activeTab === "wallpaper" && (
          <div className="space-y-5 flex flex-col flex-1" id="wallpaper-dashboard">
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-slate-200 flex items-center space-x-2">
                <Sparkles size={16} className="text-pink-400" />
                <span>Configuración de Fondo de Pantalla Nano Banano</span>
              </h3>
              <p className="text-[10px] text-slate-550 mt-0.5">La configuración del fondo se ha integrado en la Configuración Global del Sistema de forma centralizada.</p>
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-5 flex-1 max-w-xl mx-auto w-full py-8">
              <div className="w-14 h-14 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shadow-lg shadow-pink-500/5">
                <Settings className="text-pink-400 w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono text-pink-400">
                  Panel Unificado de Apariencia
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans max-w-sm">
                  De acuerdo con las políticas de coherencia de hardware del sistema **CMineWar OS**, las tallas espectrales, ciclo cromático, estructuras de cableado y brillos se gestionan ahora desde el Panel de Ajustes del Sistema.
                </p>
              </div>

              {/* Display compact active properties read from localStorage */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 w-full max-w-xs text-left font-mono text-[9px] space-y-1 text-slate-400">
                <div className="flex justify-between border-b border-slate-950/40 pb-1.5 mb-1.5 font-bold text-[10px] text-slate-300">
                  <span>PROPIEDAD DE FONDO</span>
                  <span>ESTADO EN VIVO</span>
                </div>
                <div className="flex justify-between">
                  <span>Patrón y Diseño:</span>
                  <span className="text-pink-400 font-bold uppercase">{wallpaperPattern}</span>
                </div>
                <div className="flex justify-between">
                  <span>Talla de Red:</span>
                  <span className="text-pink-400 font-bold uppercase">{nanoBananaSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ciclo Cromático:</span>
                  <span className="text-pink-400 font-bold uppercase">{simulatedHour === "real" ? "Hora Real" : simulatedHour + ":00 hs"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lógicas de Cableado:</span>
                  <span className="text-pink-400 font-bold uppercase">{lineStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span>Brillo CSS:</span>
                  <span className="text-pink-400 font-bold uppercase">{glowIntensity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Atenuación Tint:</span>
                  <span className="text-pink-400 font-bold uppercase">{(parseFloat(dimOpacity) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Rejilla / Estrellas:</span>
                  <span className="text-pink-400 font-bold uppercase">
                    {showGrid === "true" ? "SI" : "NO"} / {showStars === "true" ? "SI" : "NO"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Núcleo Dragón:</span>
                  <span className="text-pink-400 font-bold uppercase">{showCoreLogo === "true" ? "VISIBLE" : "OCULTO"}</span>
                </div>
              </div>

              {openWindow ? (
                <button
                  type="button"
                  onClick={() => {
                    openWindow("updater_github");
                    // Trigger a custom event to notify GitHubUpdater to switch its active tab to "wallpaper"! 
                    // Let's implement this elegant communication channel.
                    localStorage.setItem("cminewar_request_settings_tab", "wallpaper");
                    window.dispatchEvent(new Event("cminewar_request_settings_tab_changed"));
                  }}
                  className="px-5 py-2.5 bg-pink-900/30 hover:bg-pink-900/40 border border-pink-500/20 text-pink-300 font-bold text-xs uppercase tracking-wider rounded-lg transition active:scale-95 shadow-md shadow-pink-500/5 cursor-pointer max-w-xs w-full text-center flex items-center justify-center space-x-2"
                >
                  <Sparkles size={13} className="animate-pulse" />
                  <span>Configurar Apariencia del Sistema</span>
                </button>
              ) : (
                <div className="text-[10px] text-slate-500 italic">
                  Abra el "Panel de Ajustes Globales de Hardware" en su escritorio para modificar esta configuración.
                </div>
              )}
            </div>

            {/* Android OTA Autoupdates info preserved perfectly as requested */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <div className="flex items-center space-x-2">
                  <Smartphone size={13} className="text-emerald-400" />
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-300">Sincronización en Segundo Plano Inteligente</span>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                El motor de conexión en tiempo real **Websocket Sync** opera en segundo plano de forma totalmente transparente e ininterrumpida. Su dispositivo móvil o emulador se actualiza periódicamente adaptando los cambios estéticos del fondo con un fade suave sin necesidad de interacción manual.
              </p>
            </div>
          </div>
        )}

        {activeTab === "diagnostics" && (
          <BootDiagnosticsPanel isRealHost={isRealHost} />
        )}
      </div>
    </div>
  );
}
