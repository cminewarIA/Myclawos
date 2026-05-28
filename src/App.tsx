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
import ClawInstaller from "./components/ClawInstaller";
import GitHubUpdater from "./components/GitHubUpdater";
import Chromium from "./components/Chromium";
import BananaWallpaper from "./components/BananaWallpaper";
import DragonLogo from "./components/DragonLogo";
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
  Tv
} from "lucide-react";

export default function App() {
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
      { id: "openclaw-cog", name: "OpenClaw Cognitive Daemon", description: "Enlace inteligente con el LLM", status: "active" },
      { id: "vfs-share", name: "Virtual File System Share", description: "Indexado en tiempo real con explorador", status: "active" },
      { id: "net-analyzer", name: "ClawNet Network Traffic Monitor", description: "Sensor de ancho de banda y paquetes", status: "active" },
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

  // Chat conversation memory with OpenClaw
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "claw-welcome",
      role: "model",
      text: "¡Sistemas listos! Hola, soy **OpenClaw Core**, el núcleo cognitivo virtual de este simulador Linux. Puedo interactuar con tus comandos de terminal o guiarte a través de la interfaz gráfica local. Escribe tus dudas sobre clawOS u operabilidad de comandos Linux.",
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
  const [windows, setWindows] = useState<WindowState[]>([
    {
      id: "terminal",
      title: "ClawBash Terminal Virtual - user@openclaw",
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      position: { x: 40, y: 50 },
      size: { width: 520, height: 350 },
    },
    {
      id: "openclaw_core",
      title: "OpenClaw AI Core Mainframe",
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 15,
      position: { x: 500, y: 100 },
      size: { width: 440, height: 480 },
    },
    {
      id: "file_manager",
      title: "Explorador de Archivos Especial - ClawFM",
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 5,
      position: { x: 80, y: 110 },
      size: { width: 580, height: 360 },
    },
    {
      id: "text_editor",
      title: "ClawEdit - Editor de Notas del Kernel",
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 2,
      position: { x: 140, y: 150 },
      size: { width: 500, height: 380 },
    },
    {
      id: "system_monitor",
      title: "Monitor del Sistema - ClawMonitor",
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 1,
      position: { x: 190, y: 190 },
      size: { width: 620, height: 420 },
    },
    {
      id: "control_panel",
      title: "Panel de Control de ClawOS - claw_control",
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 3,
      position: { x: 230, y: 160 },
      size: { width: 660, height: 460 },
    },
    {
      id: "installer",
      title: "Instalador de ClawOS Beta Suite - claw_install_gui",
      isOpen: true, // Let's open it by default so the user is directly presented with this amazing interactive installer tool on startup!
      isMinimized: false,
      isMaximized: false,
      zIndex: 20,
      position: { x: 190, y: 80 },
      size: { width: 660, height: 500 },
    },
    {
      id: "updater_github",
      title: "Ajustes del Sistema y Control de Hardware - claw_settings",
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
  ]);

  // Desktop environment states
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date());
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: "success" | "info" }[]>([
    {
      id: "not-1",
      text: "Kernel OpenClaw v1.1.0 cargado con éxito en el espacio lúdico virtual. ¡Disfrute del sistema!",
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
          <ClawInstaller
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
        return "ClawBash Terminal";
      case "openclaw_core":
        return "OpenClaw AI Core";
      case "file_manager":
        return "Explorador de Archivos";
      case "text_editor":
        return "Editor de Textos (ClawEdit)";
      case "system_monitor":
        return "Monitor del Sistema";
      case "control_panel":
        return "Panel de Control";
      case "installer":
        return "Instalador Sencillo Kernel Beta";
      case "updater_github":
        return "Ajustes y Hardware";
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
        return "Aplicación ClawOS";
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

      {/* Main Desktop workspace */}
      <div className="flex-1 relative p-4 pointer-events-auto overflow-hidden">
        {/* Desktop grid launchers */}
        <div className="grid grid-flow-row gap-6 absolute top-6 left-6 w-24 select-none">
          {/* Launcher 1: OpenClaw Core */}
          <div
            onDoubleClick={() => handleOpenWindow("openclaw_core")}
            onTouchEnd={() => handleOpenWindow("openclaw_core")}
            className="flex flex-col items-center cursor-pointer group text-center"
            title="Doble clic para iniciar OpenClaw Core"
            id="launcher-openclaw"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 group-hover:border-rose-500/60 flex items-center justify-center shadow-lg transition duration-200 aspect-square">
              <DragonLogo size={32} className="group-hover:scale-105 transition-transform" />
            </div>
            <span className="text-[11px] font-medium text-slate-100 mt-1.5 px-1 py-0.5 bg-slate-950/60 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full">
              OpenClaw AI
            </span>
          </div>

          {/* Launcher 2: Terminal */}
          <div
            onDoubleClick={() => handleOpenWindow("terminal")}
            onTouchEnd={() => handleOpenWindow("terminal")}
            className="flex flex-col items-center cursor-pointer group text-center"
            title="Doble clic para iniciar Terminal ClawBash"
            id="launcher-terminal"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 group-hover:border-emerald-500/60 flex items-center justify-center shadow-lg transition duration-200 aspect-square">
              <TerminalIcon className="text-emerald-500 w-6 h-6 group-hover:scale-105 transition-transform" />
            </div>
            <span className="text-[11px] font-medium text-slate-100 mt-1.5 px-1 py-0.5 bg-slate-950/60 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full">
              Terminal
            </span>
          </div>

          {/* Launcher 3: File Manager */}
          <div
            onDoubleClick={() => handleOpenWindow("file_manager")}
            onTouchEnd={() => handleOpenWindow("file_manager")}
            className="flex flex-col items-center cursor-pointer group text-center"
            title="Doble clic para iniciar Explorador de archivos ClawFM"
            id="launcher-files"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 group-hover:border-cyan-500/60 flex items-center justify-center shadow-lg transition duration-200 aspect-square">
              <FolderOpen className="text-cyan-400 w-6 h-6 group-hover:scale-105 transition-transform" />
            </div>
            <span className="text-[11px] font-medium text-slate-100 mt-1.5 px-1 py-0.5 bg-slate-950/60 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full">
              Archivos VFS
            </span>
          </div>

          {/* Launcher 4: Text Editor */}
          <div
            onDoubleClick={() => handleOpenWindow("text_editor")}
            onTouchEnd={() => handleOpenWindow("text_editor")}
            className="flex flex-col items-center cursor-pointer group text-center"
            title="Doble clic para iniciar Editor de Textos ClawEdit"
            id="launcher-editor"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 group-hover:border-amber-500/60 flex items-center justify-center shadow-lg transition duration-200 aspect-square">
              <FileText className="text-amber-400 w-6 h-6 group-hover:scale-105 transition-transform" />
            </div>
            <span className="text-[11px] font-medium text-slate-100 mt-1.5 px-1 py-0.5 bg-slate-950/60 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full">
              Editor Notas
            </span>
          </div>

          {/* Launcher 5: System Monitor */}
          <div
            onDoubleClick={() => handleOpenWindow("system_monitor")}
            onTouchEnd={() => handleOpenWindow("system_monitor")}
            className="flex flex-col items-center cursor-pointer group text-center"
            title="Doble clic para ver hardware ClawMonitor"
            id="launcher-monitor"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 group-hover:border-violet-500/60 flex items-center justify-center shadow-lg transition duration-200 aspect-square">
              <Cpu className="text-violet-400 w-6 h-6 group-hover:scale-105 transition-transform" />
            </div>
            <span className="text-[11px] font-medium text-slate-100 mt-1.5 px-1 py-0.5 bg-slate-950/60 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full">
              Monitor
            </span>
          </div>

          {/* Launcher 6: Control Panel */}
          <div
            onDoubleClick={() => handleOpenWindow("control_panel")}
            onTouchEnd={() => handleOpenWindow("control_panel")}
            className="flex flex-col items-center cursor-pointer group text-center"
            title="Doble clic para abrir el Panel de Control"
            id="launcher-control-panel"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 group-hover:border-emerald-400/60 flex items-center justify-center shadow-lg transition duration-200 aspect-square">
              <Sliders className="text-emerald-400 w-6 h-6 group-hover:scale-105 transition-transform" />
            </div>
            <span className="text-[11px] font-medium text-slate-100 mt-1.5 px-1 py-0.5 bg-slate-950/60 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full">
              Panel Control
            </span>
          </div>

          {/* Launcher 7: ClawOS Installer */}
          <div
            onDoubleClick={() => handleOpenWindow("installer")}
            onTouchEnd={() => handleOpenWindow("installer")}
            className="flex flex-col items-center cursor-pointer group text-center"
            title="Doble clic para iniciar la instalación del núcleo"
            id="launcher-installer"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 group-hover:border-cyan-400/60 flex items-center justify-center shadow-lg transition duration-200 aspect-square">
              <Download className="text-cyan-400 w-6 h-6 group-hover:scale-105 transition-transform" />
            </div>
            <span className="text-[11px] font-medium text-slate-100 mt-1.5 px-1 py-0.5 bg-slate-950/60 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full">
              Instalar Kern
            </span>
          </div>

          {/* Launcher 8: Ajustes de Red y Hardware */}
          <div
            onDoubleClick={() => handleOpenWindow("updater_github")}
            onTouchEnd={() => handleOpenWindow("updater_github")}
            className="flex flex-col items-center cursor-pointer group text-center"
            title="Doble clic para abrir Ajustes y Panel de Hardware"
            id="launcher-updater-github"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 group-hover:border-pink-550 flex items-center justify-center shadow-lg transition duration-200 aspect-square">
              <Settings className="text-pink-400 w-6 h-6 group-hover:scale-105 transition-transform animate-pulse" />
            </div>
            <span className="text-[11px] font-medium text-slate-100 mt-1.5 px-1 py-0.5 bg-slate-950/60 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full">
              Ajustes SO
            </span>
          </div>

          {/* Launcher 9: Chromium Browser */}
          <div
            onDoubleClick={() => handleOpenWindow("chromium")}
            onTouchEnd={() => handleOpenWindow("chromium")}
            className="flex flex-col items-center cursor-pointer group text-center"
            title="Doble clic para abrir el Navegador de Internet Chromium"
            id="launcher-chromium"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 group-hover:border-blue-400/60 flex items-center justify-center shadow-lg transition duration-200 aspect-square">
              <Globe className="text-blue-400 w-6 h-6 group-hover:scale-105 transition-transform" />
            </div>
            <span className="text-[11px] font-medium text-slate-100 mt-1.5 px-1 py-0.5 bg-slate-950/60 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full">
              Chromium
            </span>
          </div>

          {/* Launcher 10: Cajón de Aplicaciones (Main Menu Synology-style Launcher) */}
          <div
            onDoubleClick={() => setAppDrawerOpen(true)}
            onClick={() => setAppDrawerOpen(true)}
            className="flex flex-col items-center cursor-pointer group text-center"
            title="Doble clic para abrir el Cajón de Aplicaciones DSM"
            id="launcher-app-drawer"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 group-hover:border-emerald-400 flex items-center justify-center shadow-lg transition duration-200 aspect-square">
              <LayoutGrid className="text-emerald-400 w-6 h-6 group-hover:scale-105 transition-transform" />
            </div>
            <span className="text-[11px] font-bold text-slate-100 mt-1.5 px-1 py-0.5 bg-slate-950/60 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full">
              Cajón Apps
            </span>
          </div>
        </div>

        {/* Windows Rendering Layer */}
        {windows.map((win) => (
          <WindowFrame
            key={win.id}
            win={win}
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
              <p className="text-[10px] text-slate-500">ClawOS Local Administrator</p>
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
                <p className="font-medium text-slate-300">OpenClaw AI</p>
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
                <p className="font-medium text-slate-300">ClawBash Terminal</p>
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
            <span>Kernel: 5.16.0-openclaw</span>
            <button
              onClick={() => alert("Simulando apagado de ClawOS... ¡Para reiniciar refresca tu navegador!")}
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
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none opacity-20">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-widest font-sans bg-clip-text text-transparent bg-gradient-to-b from-slate-200 to-slate-400">
          CLAW OS
        </h1>
        <p className="text-xs sm:text-sm tracking-wide font-mono mt-2 text-emerald-400 uppercase">
          OpenClaw Linux Environment
        </p>
      </div>

      {/* Bottom Taskbar */}
      <div className="h-12 bg-slate-950/95 border-t border-slate-800/85 px-4 flex items-center justify-between z-[9999] select-none shrink-0 pointer-events-auto">
        <div className="flex items-center space-x-3.5">
          {/* Start button */}
          <button
            onClick={() => setStartMenuOpen(!startMenuOpen)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-sans text-xs font-semibold tracking-wide border transition ${
              startMenuOpen
                ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                : "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white"
            }`}
            id="btn-start-system"
          >
            <Bot size={13} className="text-white shrink-0" />
            <span>ClawOS</span>
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
                  className={`px-3 py-1.5 rounded text-xs select-none font-sans font-medium flex items-center space-x-1.5 transition border ${
                    active
                      ? "bg-slate-900 text-emerald-400 border-slate-800 font-semibold"
                      : win.isOpen
                      ? "bg-slate-950 hover:bg-slate-900 border-dashed border-slate-900 text-slate-400"
                      : "hidden"
                  }`}
                  id={`taskbar-tab-${win.id}`}
                >
                  {win.id === "terminal" && <TerminalIcon size={12} />}
                  {win.id === "openclaw_core" && <DragonLogo size={14} />}
                  {win.id === "file_manager" && <FolderOpen size={12} />}
                  {win.id === "text_editor" && <FileText size={12} />}
                  {win.id === "system_monitor" && <Cpu size={12} />}
                  {win.id === "control_panel" && <Sliders size={12} />}
                  {win.id === "installer" && <Download size={12} />}
                  {win.id === "updater_github" && <Settings size={12} className="text-pink-400" />}
                  {win.id === "chromium" && <Globe size={12} />}
                  {win.id === "pkg_htop" && <Cpu size={12} className="text-emerald-400" />}
                  {win.id === "pkg_neofetch" && <Laptop size={12} className="text-emerald-400" />}
                  {win.id === "pkg_cmatrix" && <TerminalIcon size={12} className="text-emerald-400" />}
                  {win.id === "pkg_nginx" && <Network size={12} className="text-emerald-400" />}
                  {win.id === "pkg_retroarch" && <Tv size={12} className="text-emerald-400" />}
                  <span className="truncate max-w-[110px]">{getFriendlyAppName(win.id)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* System tray parameters */}
        <div className="flex items-center space-x-4 text-xs text-slate-400">
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
                { id: "openclaw_core", name: "OpenClaw AI", desc: "Núcleo cognitivo central", icon: DragonLogo, customIcon: true, system: true },
                { id: "terminal", name: "Terminal", desc: "Consola ClawBash", icon: TerminalIcon, system: true },
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
            <span>ClawOS DSM Main Menu Workspace v1.1</span>
            <span>Autodetecting Screen Mode: Fully Responsive</span>
          </div>
        </div>
      )}
    </div>
  );
}
