import React, { useState, useEffect } from "react";
import { WindowState, VFSNode, ChatMessage } from "./types";
import { initialVFS } from "./vfs";
import WindowFrame from "./components/WindowFrame";
import Terminal from "./components/Terminal";
import FileManager from "./components/FileManager";
import TextEditor from "./components/TextEditor";
import OpenClawCore from "./components/OpenClawCore";
import SystemMonitor from "./components/SystemMonitor";
import ControlPanel from "./components/ControlPanel";
import CMineWarInstaller from "./components/CMineWarInstaller";
import GitHubUpdater from "./components/GitHubUpdater";
import Chromium from "./components/Chromium";
import BananaWallpaper from "./components/BananaWallpaper";
import DragonLogo from "./components/DragonLogo";
import AndroidGateway from "./components/AndroidGateway";
import Bootloader from "./components/Bootloader";
import { PkgHtop, PkgNeofetch, PkgCmatrix, PkgNginx, PkgRetroarch } from "./components/InstalledPackages";
import {
  Terminal as TerminalIcon,
  FolderOpen,
  FileText,
  Cpu,
  Bot,
  Monitor,
  Battery,
  Wifi,
  Power,
  ChevronUp,
  X,
  Volume2,
  Calendar,
  Sparkles,
  Info,
  Activity,
  Sliders,
  Download,
  Github,
  RefreshCw,
  Globe,
  LayoutGrid,
  Search,
  Settings,
  Laptop,
  Network,
  Tv,
  Smartphone
} from "lucide-react";

export default function App() {
  // Boot phase / lifecycle state inside Debian virtual mainframe:
  // "gateway" (Cyberpunk Android prompt) -> "bootloader" (GRUB/vmlinuz BIOS loading) -> "ready" (Desktop environment loaded!)
  const [bootLifecycle, setBootLifecycle] = useState<"gateway" | "bootloader" | "ready">(() => {
    if (typeof window !== "undefined") {
      const forceAndroid = localStorage.getItem("cminewar_force_android") === "true";
      const isAndroid = /android/i.test(navigator.userAgent);
      if (forceAndroid || isAndroid) {
        return "gateway";
      }
    }
    return "bootloader";
  });

  const [connectedServerIp, setConnectedServerIp] = useState<string | null>(null);
  
  // Safe Mode Trigger flag direct from localStorage
  const isSafeModeActive = typeof window !== "undefined" && localStorage.getItem("cminewar_safe_mode") === "true";

  // Touchscreen / Tactile mode state (Auto-detected & manually persistable)
  const [touchMode, setTouchMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("cminewar_touch_mode");
    if (saved !== null) {
      return saved === "true";
    }
    // Auto-detect touch layout if on tactile screen
    if (typeof window !== "undefined") {
      const isCoarse = window.matchMedia("(pointer: coarse)").matches;
      const isTouchPoints = navigator.maxTouchPoints > 0;
      return isCoarse || isTouchPoints;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("cminewar_touch_mode", String(touchMode));
  }, [touchMode]);

  // Virtual File System State
  const [vfs, setVfs] = useState<VFSNode>(initialVFS);
  const [currentPath, setCurrentPath] = useState<string[]>(() => {
    const isRoot = localStorage.getItem("claw_is_root") === "true";
    return isRoot ? ["root"] : ["home", "user"];
  });

  // List of active system services for dynamic bg-molding
  const [services, setServices] = useState<any[]>(() => {
    const saved = localStorage.getItem("claw_system_services");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const sleepDisabled = localStorage.getItem("claw_sleep_disabled") === "true";
    const initialServices = [
      { id: "openclaw-cog", name: "CMineWar Cognitive Daemon", description: "Enlace inteligente con el LLM", status: "active" },
      { id: "vfs-share", name: "Virtual File System Share", description: "Indexado en tiempo real con explorador", status: "active" },
      { id: "net-analyzer", name: "CMineWarNet Traffic Monitor", description: "Sensor de ancho de banda y paquetes", status: "active" },
      { id: "hardware-watch", name: "Cortex Thermal Supervisor", description: "Mantiene la temperatura estable", status: "active" },
      { id: "acpi-sleep", name: "ACPI Sleep/Suspend Supervisor", description: "Gestor de estado de energía de hardware. Suspendido permanentemente por root.", status: sleepDisabled ? "disabled_permanently" : "active" },
    ];
    localStorage.setItem("claw_system_services", JSON.stringify(initialServices));
    return initialServices;
  });

  useEffect(() => {
    const syncServices = () => {
      const saved = localStorage.getItem("claw_system_services");
      if (saved) {
        try {
          setServices(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener("storage", syncServices);
    const interval = setInterval(syncServices, 1500);
    return () => {
      window.removeEventListener("storage", syncServices);
      clearInterval(interval);
    };
  }, []);

  // Active loaded file in editor
  const [openFilePath, setOpenFilePath] = useState<string[] | null>(null);
  const [openFileName, setOpenFileName] = useState<string[] | null>(null);
  const [openFileContent, setOpenFileContent] = useState<string | null>(null);
  const [widgetsOpen, setWidgetsOpen] = useState(true);

  // Chat conversation memory with CMineWar AI
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "claw-welcome",
      role: "model",
      text: "¡Sistemas listos! Hola, soy **CMineWar AI**, el núcleo cognitivo virtual de este simulador Linux. Puedo interactuar con tus comandos de terminal o guiarte a través de la interfaz gráfica local. Escribe tus dudas sobre el sistema CMineWar OS u operabilidad de de comandos Linux en Debian.",
      timestamp: new Date(),
    },
  ]);

  // App drawer state & installed packages sync
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [installedPackages, setInstalledPackages] = useState<string[]>(() => {
    const saved = localStorage.getItem("claw_installed_packages");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const syncPackages = () => {
      const saved = localStorage.getItem("claw_installed_packages");
      setInstalledPackages(saved ? JSON.parse(saved) : []);
    };
    window.addEventListener("claw_packages_changed", syncPackages);
    return () => window.removeEventListener("claw_packages_changed", syncPackages);
  }, []);

  // Window list states
  const [windows, setWindows] = useState<WindowState[]>(() => {
    const defaultWindows: WindowState[] = [
      {
        id: "terminal",
        title: "Consola CMineWarBash Virtual - user@cminewar",
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: 10,
        position: { x: 40, y: 50 },
        size: { width: 520, height: 350 },
      },
      {
        id: "openclaw_core",
        title: "CMineWar AI Core Mainframe",
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: 15,
        position: { x: 500, y: 100 },
        size: { width: 440, height: 480 },
      },
      {
        id: "file_manager",
        title: "Explorador de Archivos Especial - CMineWarFM",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 5,
        position: { x: 80, y: 110 },
        size: { width: 580, height: 360 },
      },
      {
        id: "text_editor",
        title: "CMineWarEdit - Editor de Notas del Kernel",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 2,
        position: { x: 140, y: 150 },
        size: { width: 500, height: 380 },
      },
      {
        id: "system_monitor",
        title: "Monitor del Sistema - CMineWarMonitor",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 1,
        position: { x: 190, y: 190 },
        size: { width: 620, height: 420 },
      },
      {
        id: "control_panel",
        title: "Panel de Control de CMineWar OS - cminewar_control",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 3,
        position: { x: 230, y: 160 },
        size: { width: 660, height: 460 },
      },
      {
        id: "installer",
        title: "Instalador de CMineWar OS Beta Suite - cminewar_install_gui",
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: 20,
        position: { x: 190, y: 80 },
        size: { width: 660, height: 500 },
      },
      {
        id: "updater_github",
        title: "Ajustes del Sistema y Control de Hardware - cminewar_settings",
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: 22,
        position: { x: 210, y: 115 },
        size: { width: 680, height: 520 },
      },
      {
        id: "chromium",
        title: "Chromium Web Browser - Navegador Predeterminado",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 12,
        position: { x: 260, y: 130 },
        size: { width: 720, height: 500 },
      },
      {
        id: "pkg_htop",
        title: "htop v3.2.0 - Monitor de Procesos Linux",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 6,
        position: { x: 100, y: 110 },
        size: { width: 620, height: 400 },
      },
      {
        id: "pkg_neofetch",
        title: "neofetch - Información de Hardware",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 7,
        position: { x: 120, y: 130 },
        size: { width: 520, height: 320 },
      },
      {
        id: "pkg_cmatrix",
        title: "cmatrix 1.8 - Lluvia Codificada",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 8,
        position: { x: 140, y: 150 },
        size: { width: 560, height: 380 },
      },
      {
        id: "pkg_nginx",
        title: "nginx.conf Suite - Servidor Web",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 9,
        position: { x: 160, y: 170 },
        size: { width: 600, height: 420 },
      },
      {
        id: "pkg_retroarch",
        title: "RetroArch Snake - Arcade Retro",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 10,
        position: { x: 180, y: 190 },
        size: { width: 440, height: 480 },
      },
    ];

    const saved = localStorage.getItem("clawos_windows_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return defaultWindows.map((defWin) => {
            const matched = parsed.find((w) => w.id === defWin.id);
            if (matched) {
              return {
                ...defWin,
                isOpen: matched.isOpen,
                isMinimized: matched.isMinimized,
                isMaximized: matched.isMaximized,
                zIndex: typeof matched.zIndex === "number" ? matched.zIndex : defWin.zIndex,
                position: matched.position ? { ...defWin.position, ...matched.position } : defWin.position,
                size: matched.size ? { ...defWin.size, ...matched.size } : defWin.size,
              };
            }
            return defWin;
          });
        }
      } catch (e) {
        console.error("Error restoring windows state", e);
      }
    }
    return defaultWindows;
  });

  useEffect(() => {
    localStorage.setItem("clawos_windows_state", JSON.stringify(windows));
  }, [windows]);

  // Desktop environment states
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date());
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: "success" | "info" }[]>([
    {
      id: "not-1",
      text: "Kernel CMineWar OS v1.2.0 cargado con éxito en Debian-Live virtual. ¡Disfrute del sistema!",
      type: "success",
    },
  ]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Window utility controls
  const handleOpenWindow = (id: string) => {
    setWindows((prev) => {
      // Find highest z-index
      const maxZ = Math.max(...prev.map((w) => w.zIndex), 0);
      return prev.map((w) => {
        if (w.id === id) {
          return { ...w, isOpen: true, isMinimized: false, zIndex: maxZ + 1 };
        }
        return w;
      });
    });
    setStartMenuOpen(false);
    triggerNotification(`Aplicación iniciada: ${getFriendlyAppName(id)}`, "info");
  };

  const handleCloseWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return { ...w, isOpen: false };
        }
        return w;
      })
    );
  };

  const handleMinimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return { ...w, isMinimized: true };
        }
        return w;
      })
    );
  };

  const handleMaximizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return { ...w, isMaximized: !w.isMaximized };
        }
        return w;
      })
    );
  };

  const handleFocusWindow = (id: string) => {
    setWindows((prev) => {
      const targetWindow = prev.find((w) => w.id === id);
      if (!targetWindow) return prev;
      
      const maxZ = Math.max(...prev.map((w) => w.zIndex), 0);
      if (targetWindow.zIndex === maxZ) return prev; // already focused

      return prev.map((w) => {
        if (w.id === id) {
          return { ...w, isMinimized: false, zIndex: maxZ + 1 };
        }
        return w;
      });
    });
  };

  const handleMoveWindow = (id: string, pos: { x: number; y: number }) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return { ...w, position: pos };
        }
        return w;
      })
    );
  };

  const handleResizeWindow = (id: string, size: { width: number; height: number }) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return { ...w, size };
        }
        return w;
      })
    );
  };

  // Safe file open callback for Editor
  const handleOpenFileInEditor = (filePath: string[], fileName: string, content: string) => {
    setOpenFilePath(filePath);
    setOpenFileName(fileName as any);
    setOpenFileContent(content);
    handleOpenWindow("text_editor");
  };

  // OpenClaw Chat proxy synch from terminal commands
  const handlePostChatMessageFromShell = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: text,
      timestamp: new Date(),
    };
    
    setChatHistory((prev) => [...prev, userMsg]);
    handleOpenWindow("openclaw_core");
  };

  // Helper to render active app content cleanly inside dynamic window frames
  const renderWindowContent = (id: string) => {
    switch (id) {
      case "terminal":
        return (
          <Terminal
            vfs={vfs}
            setVfs={setVfs}
            currentPath={currentPath}
            setCurrentPath={setCurrentPath}
            openWindow={handleOpenWindow}
            onOpenFileInEditor={handleOpenFileInEditor}
            onPostChatMessageFromShell={handlePostChatMessageFromShell}
            touchMode={touchMode}
          />
        );
      case "openclaw_core":
        return <OpenClawCore chatHistory={chatHistory} setChatHistory={setChatHistory} />;
      case "file_manager":
        return (
          <FileManager
            vfs={vfs}
            setVfs={setVfs}
            currentPath={currentPath}
            setCurrentPath={setCurrentPath}
            openWindow={handleOpenWindow}
            onOpenFileInEditor={handleOpenFileInEditor}
            touchMode={touchMode}
          />
        );
      case "text_editor":
        return (
          <TextEditor
            vfs={vfs}
            setVfs={setVfs}
            openFilePath={openFilePath}
            openFileName={openFileName as any}
            openFileContent={openFileContent}
            setOpenFile={(path, name, content) => {
              setOpenFilePath(path);
              setOpenFileName(name as any);
              setOpenFileContent(content);
            }}
          />
        );
      case "system_monitor":
        return <SystemMonitor />;
      case "control_panel":
        return <ControlPanel />;
      case "installer":
        return (
          <CMineWarInstaller
            vfs={vfs}
            setVfs={setVfs}
            openWindow={handleOpenWindow}
            triggerNotification={triggerNotification}
          />
        );
      case "updater_github":
        return (
          <GitHubUpdater
            vfs={vfs}
            setVfs={setVfs}
            triggerNotification={triggerNotification}
          />
        );
      case "chromium":
        return <Chromium />;
      case "pkg_htop":
        return <PkgHtop />;
      case "pkg_neofetch":
        return <PkgNeofetch />;
      case "pkg_cmatrix":
        return <PkgCmatrix />;
      case "pkg_nginx":
        return <PkgNginx />;
      case "pkg_retroarch":
        return <PkgRetroarch />;
      default:
        return null;
    }
  };

  // Clean application names
  const getFriendlyAppName = (id: string) => {
    switch (id) {
      case "terminal":
        return "CMineWarBash Terminal";
      case "openclaw_core":
        return "CMineWar AI Core";
      case "file_manager":
        return "Explorador de Archivos (CMineWarFM)";
      case "text_editor":
        return "Editor de Textos (CMineWarEdit)";
      case "system_monitor":
        return "Monitor del Sistema (CMineWarMonitor)";
      case "control_panel":
        return "Panel de Control CMineWar";
      case "installer":
        return "Instalador Kernel Sencillo Beta";
      case "updater_github":
        return "Ajustes y Hardware Debian";
      case "chromium":
        return "Navegador Chromium";
      case "pkg_htop":
        return "htop v3.2.0";
      case "pkg_neofetch":
        return "neofetch info";
      case "pkg_cmatrix":
        return "cmatrix coderain";
      case "pkg_nginx":
        return "nginx server workspace";
      case "pkg_retroarch":
        return "RetroArch Snake";
      default:
        return "Aplicación CMineWar OS";
    }
  };

  // Notification engine trigger
  const triggerNotification = (text: string, type: "success" | "info" = "info") => {
    setTimeout(() => {
      const freshId = `not-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setNotifications((prev) => [...prev, { id: freshId, text, type }]);
      
      // Auto erase toast after 4 sec
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== freshId));
      }, 4000);
    }, 0);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (bootLifecycle === "gateway") {
    return (
      <AndroidGateway
        onSelectDemo={() => {
          setBootLifecycle("bootloader");
          triggerNotification("Iniciando CMineWar OS en modo solitario demo.", "info");
        }}
        onSelectServer={(ip) => {
          setConnectedServerIp(ip);
          setBootLifecycle("bootloader");
          triggerNotification(`Cargando instalación nativa desde servidor remoto [${ip}]...`, "info");
        }}
      />
    );
  }

  if (bootLifecycle === "bootloader") {
    return (
      <Bootloader
        selectedServerIp={connectedServerIp}
        isSafeModeDefault={isSafeModeActive}
        onComplete={() => {
          setBootLifecycle("ready");
          triggerNotification("Colección de dependencias y Kernel listos. ¡Bienvenido a CMineWar OS!", "success");
        }}
      />
    );
  }

  return (
    <div
      className="w-full h-screen relative overflow-hidden font-sans text-slate-100 flex flex-col justify-between select-none bg-slate-950"
    >
      {/* Dynamic Hourly Generative Wallpaper by Nano Banana */}
      <BananaWallpaper services={services} />
      {/* Dynamic Notification Layer */}
      <div className="absolute top-4 right-4 z-[9999] flex flex-col space-y-2 max-w-sm w-full pointer-events-auto">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-3.5 rounded-lg border shadow-2xl flex items-start space-x-3 transition-transform animate-fade-in ${
              n.type === "success"
                ? "bg-slate-950/95 border-emerald-500/30 text-slate-200"
                : "bg-slate-950/95 border-slate-700/60 text-slate-200"
            }`}
          >
            <div className="mt-0.5">
              {n.type === "success" ? (
                <Sparkles size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <Info size={16} className="text-cyan-400 shrink-0" />
              )}
            </div>
            <div className="flex-1 text-xs leading-relaxed">
              {n.text}
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 shrink-0"
              id={`btn-close-notip-${n.id}`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Synology DSM-style Translucent Top Bar */}
      <div 
        className="w-full h-11 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 select-none z-[99]"
        id="dsm-desktop-top-bar"
      >
        <div className="flex items-center space-x-3 flex-row">
          {/* Main Menu Toggle */}
          <button
            onClick={() => {
              setAppDrawerOpen(true);
            }}
            className="flex items-center justify-center p-1.5 bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-slate-850 rounded-lg text-emerald-400 transition cursor-pointer"
            title="Centro de Aplicaciones DSM"
            id="dsm-menu-button"
          >
            <LayoutGrid size={15} />
          </button>
          
          <div className="h-4 w-[1px] bg-slate-800"></div>
          
          <span className="font-sans font-bold text-xs tracking-wider text-slate-200">
            {connectedServerIp ? `CMineWar-NAS [${connectedServerIp}]` : "CMineWar-NAS (Demo)"}
          </span>
        </div>

        {/* Center status label */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-slate-900/60 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          <span>SISTEMA SALUDABLE (DSM 7.2)</span>
        </div>

        {/* Right Info Widgets trigger */}
        <div className="flex items-center space-x-3">
          {/* Toggle Widget Panel Button */}
          <button
            onClick={() => setWidgetsOpen(!widgetsOpen)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-[9.5px] font-mono font-bold uppercase transition duration-200 cursor-pointer ${
              widgetsOpen
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            id="dsm-widgets-toggle"
          >
            <Activity size={11} className={widgetsOpen ? "animate-pulse text-emerald-405" : "text-slate-500"} />
            <span>ESTADO NAS</span>
          </button>
        </div>
      </div>

      {/* Main Desktop workspace */}
      <div className="flex-1 relative p-4 pointer-events-auto overflow-hidden">
        {/* Desktop grid launchers */}
        <div className={`select-none transition-all z-10 ${
          touchMode 
            ? "absolute inset-x-4 top-4 bottom-32 xs:bottom-28 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-x-4 gap-y-7 p-4 auto-rows-max justify-center items-start overflow-y-auto" 
            : "grid grid-flow-row absolute left-6 top-6 gap-6 w-24"
        }`}>
          {[
            { id: "openclaw_core", name: "CMineWar AI", icon: <DragonLogo size={touchMode ? 38 : 32} />, border: "group-hover:border-rose-500/60" },
            { id: "terminal", name: "Terminal", icon: <TerminalIcon className={`text-emerald-500 ${touchMode ? "w-7 h-7" : "w-6 h-6"}`} />, border: "group-hover:border-emerald-500/60" },
            { id: "file_manager", name: "Archivos VFS", icon: <FolderOpen className={`text-cyan-400 ${touchMode ? "w-7 h-7" : "w-6 h-6"}`} />, border: "group-hover:border-cyan-500/60" },
            { id: "text_editor", name: "Editor Notas", icon: <FileText className={`text-amber-400 ${touchMode ? "w-7 h-7" : "w-6 h-6"}`} />, border: "group-hover:border-amber-500/60" },
            { id: "system_monitor", name: "Monitor", icon: <Cpu className={`text-violet-400 ${touchMode ? "w-7 h-7" : "w-6 h-6"}`} />, border: "group-hover:border-violet-500/60" },
            { id: "control_panel", name: "Panel Control", icon: <Sliders className={`text-emerald-400 ${touchMode ? "w-7 h-7" : "w-6 h-6"}`} />, border: "group-hover:border-emerald-400/60" },
            { id: "installer", name: "Instalar Kern", icon: <Download className={`text-cyan-400 ${touchMode ? "w-7 h-7" : "w-6 h-6"}`} />, border: "group-hover:border-cyan-400/60" },
            { id: "updater_github", name: "Ajustes SO", icon: <Settings className={`text-pink-400 animate-pulse ${touchMode ? "w-7 h-7" : "w-6 h-6"}`} />, border: "group-hover:border-pink-500" },
            { id: "chromium", name: "Chromium", icon: <Globe className={`text-blue-400 ${touchMode ? "w-7 h-7" : "w-6 h-6"}`} />, border: "group-hover:border-blue-400/60" },
          ].map((launcher) => (
            <div
              key={launcher.id}
              onDoubleClick={() => handleOpenWindow(launcher.id)}
              onClick={() => {
                // Instantly open window on click/tap if in touch screen mode to bypass double-click frustration on tablets/phones
                if (touchMode) {
                  handleOpenWindow(launcher.id);
                }
              }}
              onTouchEnd={() => handleOpenWindow(launcher.id)}
              className="flex flex-col items-center cursor-pointer group text-center"
              title={`Inicia ${launcher.name}`}
              id={`launcher-${launcher.id}`}
            >
              <div className={`border bg-slate-950/80 hover:bg-slate-950 border-slate-800 ${launcher.border} flex items-center justify-center shadow-lg transition-all duration-200 aspect-square ${
                touchMode ? "w-14 h-14 rounded-2xl scale-110 shadow-emerald-950/30" : "w-12 h-12 rounded-xl"
              }`}>
                {launcher.icon}
              </div>
              <span className={`font-semibold text-slate-100 px-1 py-0.5 bg-slate-950/60 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full ${
                touchMode ? "text-[12px] mt-2.5" : "text-[11px] mt-1.5"
              }`}>
                {launcher.name}
              </span>
            </div>
          ))}

          {/* Launcher 10: Cajón de Aplicaciones (Main Menu Synology-style Launcher) */}
          <div
            onDoubleClick={() => setAppDrawerOpen(true)}
            onClick={() => setAppDrawerOpen(true)}
            className="flex flex-col items-center cursor-pointer group text-center"
            title="Abrir el Cajón de Aplicaciones"
            id="launcher-app-drawer"
          >
            <div className={`border bg-slate-950/80 hover:bg-slate-950 border-slate-800 group-hover:border-emerald-400 flex items-center justify-center shadow-lg transition-all duration-200 aspect-square ${
              touchMode ? "w-14 h-14 rounded-2xl scale-110 shadow-emerald-950/30" : "w-12 h-12 rounded-xl"
            }`}>
              <LayoutGrid className={`text-emerald-400 group-hover:scale-105 transition-all ${touchMode ? "w-7 h-7" : "w-6 h-6"}`} />
            </div>
            <span className={`font-black text-slate-100 px-1 py-0.5 bg-slate-950/60 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full ${
              touchMode ? "text-[12px] mt-2.5" : "text-[11px] mt-1.5"
            }`}>
              Cajón Apps
            </span>
          </div>
        </div>

        {/* Custom Synology DSM-style Desktop Widget Panel */}
        {widgetsOpen && (
          <div 
            className={`bg-slate-950/90 border border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md rounded-xl p-4 font-sans z-[90] pointer-events-auto transition-all ${
              touchMode 
                ? "absolute inset-x-4 bottom-2 flex flex-row gap-4 items-center justify-between overflow-x-auto shadow-emerald-950/10 border-emerald-500/20 max-h-[140px]" 
                : "absolute right-6 top-6 w-76 flex flex-col space-y-3.5"
            }`}
            id="dsm-desktop-widget-panel"
          >
            {touchMode ? (
              /* DSM Mobile Widget display */
              <div className="w-full flex items-center justify-between gap-4 select-none shrink-0 min-w-[340px]">
                {/* Health indicator */}
                <div className="flex items-center space-x-2.5 shrink-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Activity size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black tracking-widest text-[#2cbe7f] uppercase font-mono">NAS SALUD</h5>
                    <p className="text-xs font-bold text-slate-100">Estado Excelente</p>
                  </div>
                </div>

                {/* Resource mini sliders */}
                <div className="flex-1 flex gap-4">
                  {/* CPU status */}
                  <div className="flex-1 bg-slate-900/55 p-2.5 border border-slate-900 rounded-lg">
                    <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400">
                      <span>USO CPU</span>
                      <span className="text-emerald-400 font-bold">24%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1 rounded overflow-hidden mt-1.5">
                      <div className="bg-emerald-500 h-full w-[24%] transition-all"></div>
                    </div>
                  </div>

                  {/* RAM status */}
                  <div className="flex-1 bg-slate-900/55 p-2.5 border border-slate-900 rounded-lg">
                    <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400">
                      <span>USO RAM</span>
                      <span className="text-cyan-400 font-bold">38%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1 rounded overflow-hidden mt-1.5">
                      <div className="bg-cyan-500 h-full w-[38%] transition-all"></div>
                    </div>
                  </div>
                </div>

                {/* Quick close button */}
                <button 
                  onClick={() => setWidgetsOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded border border-slate-800 text-slate-400 cursor-pointer"
                  title="Ocultar Widget"
                  id="btn-widgets-close-mobile"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              /* DSM PC Widget card (Full detail widget) */
              <>
                {/* Health Section */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-200 font-sans">Monitor de Recursos DSM</h4>
                  </div>
                  <button 
                    onClick={() => setWidgetsOpen(false)}
                    className="text-slate-500 hover:text-slate-350 cursor-pointer"
                    title="Ocultar widget"
                    id="btn-widgets-close-pc"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Health Indicator card */}
                <div className="flex items-center space-x-3 bg-emerald-950/30 border border-emerald-500/20 p-2.5 rounded-lg">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-full shrink-0">
                    <Activity size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-mono uppercase font-bold text-emerald-400">Estado del Sistema</h5>
                    <p className="text-[11px] font-semibold text-slate-200 font-sans">Su CMineWar-NAS funciona excelente.</p>
                  </div>
                </div>

                {/* Resource Stats bars */}
                <div className="space-y-3.5 pt-1 text-xs font-sans">
                  {/* CPU Usage */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-semibold">
                      <span>Procesamiento (CPU Core)</span>
                      <span className="text-emerald-400 font-bold">24%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[24%] transition-all duration-700"></div>
                    </div>
                  </div>

                  {/* RAM Memory Usage */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-semibold">
                      <span>Memoria Física (Virtual RAM)</span>
                      <span className="text-cyan-400 font-bold">38%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                      <div className="bg-cyan-500 h-full w-[38%] transition-all duration-700"></div>
                    </div>
                  </div>

                  {/* VFS Space Usage */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-semibold">
                      <span>Volumen virtual (VFS /vfs)</span>
                      <span className="text-pink-400 font-bold">14.6 GB / 32 GB (45%)</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                      <div className="bg-pink-500 h-full w-[45%] transition-all duration-700"></div>
                    </div>
                  </div>
                </div>

                {/* Synology Services status indicators */}
                <div className="border-t border-slate-900 pt-3 text-[10px] space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-slate-550 flex-wrap">
                    <span>IP GATEWAY:</span>
                    <span className="text-cyan-400">{connectedServerIp || "127.0.0.1 (Local)"}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-550 flex-wrap">
                    <span>CONEXIÓN UDEV:</span>
                    <span className="text-emerald-400 font-bold">ACTIVO SHM</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Windows Rendering Layer */}
        {windows.map((win) => (
          <WindowFrame
            key={win.id}
            win={win}
            touchMode={touchMode}
            onClose={() => handleCloseWindow(win.id)}
            onMinimize={() => handleMinimizeWindow(win.id)}
            onMaximize={() => handleMaximizeWindow(win.id)}
            onFocus={() => handleFocusWindow(win.id)}
            onMove={(pos) => handleMoveWindow(win.id, pos)}
            onResize={(size) => handleResizeWindow(win.id, size)}
          >
            {renderWindowContent(win.id)}
          </WindowFrame>
        ))}
      </div>

      {/* Start / Menu Drawer */}
      {startMenuOpen && (
        <div
          id="claw-start-menu"
          className="absolute bottom-14 left-4 z-[999] w-72 bg-slate-950/95 border border-slate-800 rounded-lg shadow-2xl p-4 flex flex-col space-y-4 animate-fade-in text-xs font-sans border-b-slate-700 select-none"
        >
          {/* Header profiles */}
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800/80">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 font-mono">
              U
            </div>
            <div>
              <p className="font-semibold text-slate-100 text-sm">user_developer</p>
              <p className="text-[10px] text-slate-500">CMineWar OS Developer</p>
            </div>
          </div>

          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Aplicaciones de Sistema</p>

          {/* Grid app options */}
          <div className="grid grid-cols-1 space-y-1">
            <button
              onClick={() => handleOpenWindow("openclaw_core")}
              className="flex items-center space-x-3 p-2 rounded hover:bg-slate-900 text-left transition"
              id="menu-app-openclaw"
            >
              <DragonLogo size={18} />
              <div>
                <p className="font-medium text-slate-300">CMineWar AI</p>
                <p className="text-[9px] text-slate-500">Núcleo inteligente central</p>
              </div>
            </button>

            <button
              onClick={() => handleOpenWindow("terminal")}
              className="flex items-center space-x-3 p-2 rounded hover:bg-slate-900 text-left transition"
              id="menu-app-terminal"
            >
              <TerminalIcon size={16} className="text-emerald-500" />
              <div>
                <p className="font-medium text-slate-300">CMineWarBash Terminal</p>
                <p className="text-[9px] text-slate-500">Emulador de bash interactivo</p>
              </div>
            </button>

            <button
              onClick={() => handleOpenWindow("file_manager")}
              className="flex items-center space-x-3 p-2 rounded hover:bg-slate-900 text-left transition"
              id="menu-app-files"
            >
              <FolderOpen size={16} className="text-cyan-400" />
              <div>
                <p className="font-medium text-slate-300">Archivos VFS</p>
                <p className="text-[9px] text-slate-500">Explorador de archivos gráfico</p>
              </div>
            </button>

            <button
              onClick={() => handleOpenWindow("text_editor")}
              className="flex items-center space-x-3 p-2 rounded hover:bg-slate-900 text-left transition"
              id="menu-app-editor"
            >
              <FileText size={16} className="text-amber-400" />
              <div>
                <p className="font-medium text-slate-300">Editor Notas</p>
                <p className="text-[9px] text-slate-500">Edición rápida de archivos</p>
              </div>
            </button>

            <button
              onClick={() => handleOpenWindow("system_monitor")}
              className="flex items-center space-x-3 p-2 rounded hover:bg-slate-900 text-left transition"
              id="menu-app-monitor"
            >
              <Cpu size={16} className="text-violet-400" />
              <div>
                <p className="font-medium text-slate-300">Monitor Hardware</p>
                <p className="text-[9px] text-slate-500">Métricas en tiempo real</p>
              </div>
            </button>

            <button
              onClick={() => handleOpenWindow("control_panel")}
              className="flex items-center space-x-3 p-2 rounded hover:bg-slate-900 text-left transition"
              id="menu-app-control-panel"
            >
              <Sliders size={16} className="text-emerald-400" />
              <div>
                <p className="font-medium text-slate-300">Panel de Control</p>
                <p className="text-[9px] text-slate-500">Consumo de red, RAM y servicios</p>
              </div>
            </button>

            <button
              onClick={() => handleOpenWindow("installer")}
              className="flex items-center space-x-3 p-2 rounded hover:bg-slate-900 text-left transition"
              id="menu-app-installer"
            >
              <Download size={16} className="text-cyan-400" />
              <div>
                <p className="font-medium text-slate-300">Instalador Kernel</p>
                <p className="text-[9px] text-slate-500">Asistente de instalación del núcleo beta</p>
              </div>
            </button>

            <button
              onClick={() => handleOpenWindow("updater_github")}
              className="flex items-center space-x-3 p-2 rounded hover:bg-slate-900 text-left transition"
              id="menu-app-updater-github"
            >
              <Settings size={16} className="text-pink-400" />
              <div>
                <p className="font-medium text-slate-300">Ajustes del Sistema</p>
                <p className="text-[9px] text-slate-500">Hardware, resolución, rotación y paquetes</p>
              </div>
            </button>

            <button
              onClick={() => handleOpenWindow("chromium")}
              className="flex items-center space-x-3 p-2 rounded hover:bg-slate-900 text-left transition"
              id="menu-app-chromium"
            >
              <Globe size={16} className="text-blue-400" />
              <div>
                <p className="font-medium text-slate-300">Navegador Chromium</p>
                <p className="text-[9px] text-slate-500">Navega por la red simulated sandbox</p>
              </div>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500">
            <span>Kernel: 5.16.0-cminewar-debian</span>
            <button
              onClick={() => alert("Simulando apagado de CMineWar OS... ¡Para reiniciar refresca tu navegador!")}
              className="flex items-center space-x-1.5 px-2 py-1 bg-red-950/50 border border-red-900/30 text-rose-300 hover:bg-red-900 hover:text-white rounded transition"
              id="btn-shutdown"
            >
              <Power size={11} />
              <span>Apagar</span>
            </button>
          </div>
        </div>
      )}

      {/* Decorative desktop greeting in the center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none opacity-20 animate-pulse" style={{ animationDuration: '8s' }}>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-widest font-sans bg-clip-text text-transparent bg-gradient-to-b from-slate-200 to-slate-400">
          CMINEWAR OS
        </h1>
        <p className="text-xs sm:text-sm tracking-wide font-mono mt-2 text-emerald-400 uppercase">
          Debian GNU/Linux Native Engine
        </p>
      </div>

      {/* Bottom Taskbar */}
      <div className={`bg-slate-950/95 border-t border-slate-800/85 px-4 flex items-center justify-between z-[9999] select-none shrink-0 pointer-events-auto transition-all duration-300 ${
        touchMode ? "h-15 sm:h-16 py-2" : "h-12"
      }`}>
        <div className="flex items-center space-x-3.5">
          {/* Start button */}
          <button
            onClick={() => setStartMenuOpen(!startMenuOpen)}
            className={`flex items-center space-x-2 rounded-md font-sans border transition-all ${
              touchMode
                ? "px-4 py-2.5 text-sm shadow-md shadow-emerald-500/20 font-bold scale-105"
                : "px-3 py-1.5 text-xs font-semibold tracking-wide"
            } ${
              startMenuOpen
                ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                : "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white"
            }`}
            id="btn-start-system"
          >
            <Bot size={touchMode ? 15 : 13} className="text-white shrink-0 animate-bounce" style={{ animationDuration: '3s' }} />
            <span>CMineWar OS</span>
          </button>

          {/* Quick shortcuts and active application representation tabs */}
          <div className="hidden md:flex items-center space-x-2 border-l border-slate-800 pl-3">
            {windows.map((win) => {
              const active = win.isOpen && !win.isMinimized;
              
              return (
                <button
                  key={win.id}
                  onClick={() => {
                    if (!win.isOpen) {
                      handleOpenWindow(win.id);
                    } else if (win.isMinimized) {
                      handleFocusWindow(win.id);
                    } else {
                      handleMinimizeWindow(win.id);
                    }
                  }}
                  className={`select-none font-sans font-medium flex items-center transition border ${
                    touchMode ? "px-4 py-2 text-sm space-x-2 rounded-lg" : "px-3 py-1.5 text-xs space-x-1.5 rounded"
                  } ${
                    active
                      ? "bg-slate-900 text-emerald-400 border-slate-800 font-semibold"
                      : win.isOpen
                      ? "bg-slate-950 hover:bg-slate-900 border-dashed border-slate-900 text-slate-400"
                      : "hidden"
                  }`}
                  id={`taskbar-tab-${win.id}`}
                >
                  {win.id === "terminal" && <TerminalIcon size={touchMode ? 14 : 12} />}
                  {win.id === "openclaw_core" && <DragonLogo size={touchMode ? 16 : 14} />}
                  {win.id === "file_manager" && <FolderOpen size={touchMode ? 14 : 12} />}
                  {win.id === "text_editor" && <FileText size={touchMode ? 14 : 12} />}
                  {win.id === "system_monitor" && <Cpu size={touchMode ? 14 : 12} />}
                  {win.id === "control_panel" && <Sliders size={touchMode ? 14 : 12} />}
                  {win.id === "installer" && <Download size={touchMode ? 14 : 12} />}
                  {win.id === "updater_github" && <Settings size={touchMode ? 14 : 12} className="text-pink-400" />}
                  {win.id === "chromium" && <Globe size={touchMode ? 14 : 12} />}
                  {win.id === "pkg_htop" && <Cpu size={touchMode ? 14 : 12} className="text-emerald-400" />}
                  {win.id === "pkg_neofetch" && <Laptop size={touchMode ? 14 : 12} className="text-emerald-400" />}
                  {win.id === "pkg_cmatrix" && <TerminalIcon size={touchMode ? 14 : 12} className="text-emerald-400" />}
                  {win.id === "pkg_nginx" && <Network size={touchMode ? 14 : 12} className="text-emerald-400" />}
                  {win.id === "pkg_retroarch" && <Tv size={touchMode ? 14 : 12} className="text-emerald-400" />}
                  <span className="truncate max-w-[110px]">{getFriendlyAppName(win.id)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* System tray parameters with Tactile Mode indicator toggle */}
        <div className="flex items-center space-x-4 text-xs text-slate-400">
          
          {/* Interactive Tactile Mode Switch */}
          <button
            onClick={() => {
              const nextMode = !touchMode;
              setTouchMode(nextMode);
              triggerNotification(
                `Modo Táctil ${nextMode ? "ACTIVADO" : "DESACTIVADO"}: ${
                  nextMode 
                    ? "Interfaz completamente adaptada a pantallas táctiles y móviles." 
                    : "Retornando a la interfaz de escritorio clásica."
                }`,
                "success"
              );
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              touchMode
                ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-400 font-extrabold shadow shadow-amber-500/20"
                : "bg-slate-900 hover:bg-slate-850 border-slate-850 text-slate-400 hover:text-slate-300"
            }`}
            title={touchMode ? "Desactivar optimización táctil" : "Activar optimización táctil"}
            id="btn-toggle-touch-mode"
          >
            <Smartphone size={13} className={touchMode ? "text-amber-400 animate-pulse" : "text-slate-500"} />
            <span className="text-[10px] tracking-wider font-mono font-bold">
              TÁCTIL: {touchMode ? "ON" : "OFF"}
            </span>
          </button>

          {/* Signal and hardware tray indicators */}
          <div className="hidden sm:flex items-center space-x-3 text-slate-500 border-r border-slate-900 pr-4">
            <Wifi size={14} className="text-emerald-500" title="Link status: Gigabit Ethernet virtual" />
            <span className="text-[10px] font-mono select-none text-slate-400">ONLINE</span>
            <Battery size={14} className="text-slate-400" title="Bateria: 100% conectada" />
            <Volume2 size={14} className="text-slate-400" />
          </div>

          {/* System Date Clock */}
          <div className="flex flex-col items-end justify-center select-none cursor-default font-semibold text-slate-200">
            <span className="font-mono text-[11px] leading-tight">
              {systemTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className="text-[9px] text-slate-500 leading-tight">
              {systemTime.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* App Drawer Fullscreen Overlay (Synology DSM Style Main Menu) */}
      {appDrawerOpen && (
        <div 
          className="absolute inset-x-0 top-0 bottom-12 z-[9999] bg-slate-950/90 backdrop-blur-xl animate-fade-in flex flex-col p-6 overflow-hidden text-sans select-none"
          id="cajon-apps-overlay"
        >
          {/* Header filter & Title bar */}
          <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 pb-4 shrink-0 space-y-3 sm:space-y-0 text-left">
            <div>
              <h2 className="text-sm font-black text-slate-100 flex items-center space-x-2">
                <LayoutGrid className="text-emerald-400 w-5 h-5" />
                <span>Centro del Cajón de Aplicaciones — ClawOS Main Menu</span>
              </h2>
              <p className="text-[10px] text-slate-500">Ejecuta herramientas del sistema, complementos inteligentes y paquetes instalados de Linux.</p>
            </div>

            {/* Search program bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500 font-bold" />
              <input
                type="text"
                placeholder="Buscar aplicación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition shadow-inner font-sans"
              />
            </div>

            <button 
              onClick={() => { setAppDrawerOpen(false); setSearchQuery(""); }}
              className="p-1 px-3 bg-slate-900 hover:bg-slate-850 rounded-md border border-slate-800 text-slate-350 text-xs font-semibold select-none flex items-center space-x-1"
            >
              <X size={12} />
              <span>Cerrar Menú</span>
            </button>
          </div>

          {/* Grid area */}
          <div className="flex-1 overflow-y-auto py-8 max-w-5xl mx-auto w-full min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 justify-center">
              
              {/* Loop over static and dynamic apps */}
              {[
                { id: "openclaw_core", name: "CMineWar AI", desc: "Núcleo cognitivo central", icon: DragonLogo, customIcon: true, system: true },
                { id: "terminal", name: "Terminal", desc: "Consola CMineWarBash", icon: TerminalIcon, system: true },
                { id: "file_manager", name: "Archivos VFS", desc: "Explorador de ficheros", icon: FolderOpen, system: true, iconCol: "text-cyan-400" },
                { id: "text_editor", name: "Editor Notas", desc: "Editor de textos rápido", icon: FileText, system: true, iconCol: "text-amber-400" },
                { id: "system_monitor", name: "Monitor", desc: "Hardware en vivo", icon: Cpu, system: true, iconCol: "text-violet-400" },
                { id: "control_panel", name: "Panel Control", desc: "Ancho de red y servicios", icon: Sliders, system: true, iconCol: "text-emerald-400" },
                { id: "installer", name: "Instalar Kern", desc: "Instalador de drivers de hardware", icon: Download, system: true, iconCol: "text-cyan-400" },
                { id: "updater_github", name: "Ajustes Globales", desc: "Comunicaciones y resolución", icon: Settings, system: true, iconCol: "text-pink-400" },
                { id: "chromium", name: "Chromium", desc: "Navegador de internet", icon: Globe, system: true, iconCol: "text-blue-400" },
                // Linux Packages
                { id: "pkg_htop", name: "htop monitor", desc: "Monitor interactivo linux", icon: Cpu, packageId: "pkg_htop", iconCol: "text-emerald-400" },
                { id: "pkg_neofetch", name: "neofetch info", desc: "Diagnóstico del host", icon: Laptop, packageId: "pkg_neofetch", iconCol: "text-emerald-400" },
                { id: "pkg_cmatrix", name: "cmatrix rain", desc: "Código digital animado", icon: TerminalIcon, packageId: "pkg_cmatrix", iconCol: "text-emerald-400" },
                { id: "pkg_nginx", name: "nginx server", desc: "Servidor web local", icon: Network, packageId: "pkg_nginx", iconCol: "text-emerald-400" },
                { id: "pkg_retroarch", name: "RetroArch Snake", desc: "Juego clásico arcade", icon: Tv, packageId: "pkg_retroarch", iconCol: "text-emerald-400" },
              ]
                .filter((app) => app.system || installedPackages.includes(app.packageId || ""))
                .filter((app) => app.name.toLowerCase().includes(searchQuery.toLowerCase()) || app.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((app) => {
                  const IconComp = app.icon;
                  return (
                    <div
                      key={app.id}
                      onClick={() => {
                        handleOpenWindow(app.id);
                        setAppDrawerOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex flex-col items-center justify-center p-3.5 rounded-xl hover:bg-slate-900/60 border border-transparent hover:border-slate-800/80 cursor-pointer text-center group transition select-none h-28"
                      id={`drawer-app-${app.id}`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-800/80 group-hover:bg-slate-950 group-hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-lg aspect-square">
                        {app.customIcon ? (
                          <IconComp size={24} className="group-hover:scale-110 transition-transform" />
                        ) : (
                          <IconComp className={`w-5 h-5 group-hover:scale-110 transition-transform ${app.iconCol || "text-slate-200"}`} />
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-100 mt-2 truncate w-full group-hover:text-emerald-400">{app.name}</span>
                      <span className="text-[9px] text-slate-500 mt-0.5 truncate w-full">{app.desc}</span>
                    </div>
                  );
                })}
            </div>

            {/* Empty Search output */}
            {installedPackages.length === 0 && searchQuery === "" && (
              <div className="pt-8 text-center text-xs text-slate-500 italic">
                No tienes paquetes de Linux instalados actualmente. Instala utilidades en la sección 'Centro de Paquetes' del panel de Ajustes Globales de Hardware.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 max-w-5xl mx-auto w-full flex justify-between items-center text-[10px] text-slate-500 font-mono shrink-0">
            <span>CMineWar OS Debian Workspace v1.2</span>
            <span>Autodetecting Screen Mode: Fully Responsive</span>
          </div>
        </div>
      )}
    </div>
  );
}
