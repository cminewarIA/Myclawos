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
import Beini from "./components/Beini";
import BananaWallpaper from "./components/BananaWallpaper";
import DragonLogo from "./components/DragonLogo";
import Bootloader from "./components/Bootloader";
import { VERSION, BUILD_NUMBER } from "./version";
import { PkgHtop, PkgNeofetch, PkgCmatrix, PkgNginx, PkgRetroarch } from "./components/InstalledPackages";
import { EuroWord, EuroCalc, EuroSlide } from "./components/EuroOffice";
import HardwareControl from "./components/HardwareControl";
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
  Smartphone,
  FileSpreadsheet,
  Presentation,
  Chrome,
  FileCode,
  LogOut
} from "lucide-react";

export default function App() {
  // Boot phase / lifecycle state inside Debian virtual mainframe:
  // Starts with Gateway requesting Node IP.
  const [bootLifecycle, setBootLifecycle] = useState<"gateway" | "bootloader" | "ready">(() => {
    if (typeof window !== "undefined" && localStorage.getItem("cminewar_force_reboot") === "true") {
      localStorage.removeItem("cminewar_force_reboot");
      return "bootloader";
    }
    return "gateway";
  });

  const [connectedServerIp, setConnectedServerIp] = useState<string | null>(null);
  const [connError, setConnError] = useState<string | null>(null);
  
  // Safe Mode Trigger flag direct from localStorage
  const isSafeModeActive = typeof window !== "undefined" && localStorage.getItem("cminewar_safe_mode") === "true";

  // Automatic Background Live OTA update status & server tracking
  const [isOtaUpdating, setIsOtaUpdating] = useState(false);
  const initialInstanceIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    let timerId: any = null;

    const checkOtaStatus = async () => {
      try {
        const res = await fetch("/api/cminewar/system-status");
        if (!res.ok) return;
        const data = await res.json();
        
        if (data && data.instanceId) {
          if (!initialInstanceIdRef.current) {
            // First boot query: save runtime server instance id
            initialInstanceIdRef.current = data.instanceId;
          } else if (initialInstanceIdRef.current !== data.instanceId) {
            // Hot update on server detected! Trigger fully automated background reload
            console.log("⚡ [OTA AUTOMATIC DEAMON] Nueva firma del servidor detectada. Actualizando interfaz...");
            setIsOtaUpdating(true);
            
            // Audio indication alert
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.frequency.setValueAtTime(880, audioCtx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.35);
              gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.35);
            } catch (e) {}

            setTimeout(() => {
              window.location.reload();
            }, 1800);
          }
        }
      } catch (err) {
        // Silent recovery: fail silently to prevent browser/alert noises to user during quick re-builds
      }
    };

    // Keep querying/polling every 6 seconds in background autonomously
    const delayId = setTimeout(() => {
      checkOtaStatus();
      timerId = setInterval(checkOtaStatus, 6000);
    }, 4000);

    return () => {
      clearTimeout(delayId);
      if (timerId) clearInterval(timerId);
    };
  }, []);

  // Touchscreen / Tactile mode state (Auto-detected and dynamic)
  const [touchMode, setTouchMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const isCoarse = window.matchMedia("(pointer: coarse)").matches;
      const isTouchPoints = navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 1024;
      return isCoarse || isTouchPoints || isSmallScreen;
    }
    return false;
  });

  useEffect(() => {
    const handleResizeOrDetect = () => {
      if (typeof window !== "undefined") {
        const isCoarse = window.matchMedia("(pointer: coarse)").matches;
        const isTouchPoints = navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth < 1024;
        const isTouchEnabled = isCoarse || isTouchPoints || isSmallScreen;
        setTouchMode(isTouchEnabled);

        // Adjust open windows if the screen resizes in real-time
        setWindows((prev) => {
          const screenW = window.innerWidth;
          const screenH = window.innerHeight;
          const isMobile = screenW < 768 || isTouchEnabled;

          return prev.map((w) => {
            if (!w.isOpen) return w;
            if (isMobile) {
              return { ...w, isMaximized: true };
            } else {
              let updatedPos = { ...w.position };
              let updatedSize = { ...w.size };

              const maxAllowedWidth = Math.floor(screenW * 0.95);
              const maxAllowedHeight = Math.floor((screenH - 50) * 0.9);

              if (updatedSize.width > maxAllowedWidth) {
                updatedSize.width = maxAllowedWidth;
              }
              if (updatedSize.height > maxAllowedHeight) {
                updatedSize.height = maxAllowedHeight;
              }

              if (updatedPos.x + updatedSize.width > screenW) {
                updatedPos.x = Math.max(10, screenW - updatedSize.width - 20);
              }
              if (updatedPos.y + updatedSize.height > screenH - 50) {
                updatedPos.y = Math.max(10, screenH - updatedSize.height - 70);
              }

              return { ...w, position: updatedPos, size: updatedSize };
            }
          });
        });
      }
    };

    window.addEventListener("resize", handleResizeOrDetect);
    
    // Fallback if the user interacts via touch
    const handleTouchStart = () => {
      setTouchMode(true);
      window.removeEventListener("touchstart", handleTouchStart);
    };
    window.addEventListener("touchstart", handleTouchStart);

    return () => {
      window.removeEventListener("resize", handleResizeOrDetect);
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);

  // Force claw_is_root to true permanently to prevent any permission hurdles
  if (typeof window !== "undefined") {
    localStorage.setItem("claw_is_root", "true");
  }

  // Virtual File System State
  const [vfs, setVfs] = useState<VFSNode>(initialVFS);
  const [currentPath, setCurrentPath] = useState<string[]>(["root"]);

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
      text: "¡Sistemas listos! Hola, soy **Antigravity CLI** (mando `agy`), el módulo cognitivo central de CMineWar OS. Puedo interactuar con tus comandos de terminal o guiarte de forma directa a través de esta terminal interactiva. Escribe tus dudas sobre el entorno de desarrollo o los comandos de Linux en Debian y las ejecutaré sin ninguna traba de permisos.",
      timestamp: new Date(),
    },
  ]);

  // App drawer state & installed packages sync
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [installedPackages, setInstalledPackages] = useState<string[]>(() => {
    const savedClaw = localStorage.getItem("claw_installed_packages");
    const savedCmine = localStorage.getItem("cminewar_installed_packages");
    const union = new Set([
      ...(savedClaw ? JSON.parse(savedClaw) : []),
      ...(savedCmine ? JSON.parse(savedCmine) : [])
    ]);
    return Array.from(union);
  });

  useEffect(() => {
    const syncPackages = () => {
      const savedClaw = localStorage.getItem("claw_installed_packages");
      const savedCmine = localStorage.getItem("cminewar_installed_packages");
      const union = new Set([
        ...(savedClaw ? JSON.parse(savedClaw) : []),
        ...(savedCmine ? JSON.parse(savedCmine) : [])
      ]);
      setInstalledPackages(Array.from(union));
    };
    window.addEventListener("claw_packages_changed", syncPackages);
    window.addEventListener("cminewar_packages_changed", syncPackages);
    window.addEventListener("storage", syncPackages);
    return () => {
      window.removeEventListener("claw_packages_changed", syncPackages);
      window.removeEventListener("cminewar_packages_changed", syncPackages);
      window.removeEventListener("storage", syncPackages);
    };
  }, []);

  // Custom helper to retrieve launcher visuals (icon and border) dynamically
  const getLauncherData = (id: string) => {
    switch (id) {
      case "openclaw_core":
        return { icon: <DragonLogo size={touchMode ? 22 : 28} />, border: "group-hover:border-rose-500/60" };
      case "terminal":
        return { icon: <TerminalIcon className={`text-emerald-500 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-emerald-500/60" };
      case "file_manager":
        return { icon: <FolderOpen className={`text-cyan-400 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-cyan-500/60" };
      case "text_editor":
        return { icon: <FileCode className={`text-lime-500 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-lime-500/70" };
      case "system_monitor":
        return { icon: <Cpu className={`text-violet-400 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-violet-500/60" };
      case "control_panel":
        return { icon: <Sliders className={`text-emerald-400 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-emerald-400/60" };
      case "installer":
        return { icon: <Download className={`text-cyan-400 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-cyan-400/60" };
      case "updater_github":
        return { icon: <Settings className={`text-pink-400 animate-pulse ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-pink-500" };
      case "chromium":
        return { icon: <Chrome className={`text-blue-400 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-blue-500/60" };
      case "beini":
        return { icon: <Wifi className={`text-pink-400 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-pink-500/60" };
      case "euro_word":
        return { icon: <FileText className={`text-blue-500 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-blue-500/60" };
      case "euro_calc":
        return { icon: <FileSpreadsheet className={`text-emerald-500 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-emerald-500/60" };
      case "euro_slide":
        return { icon: <Presentation className={`text-amber-500 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-amber-500/60" };
      case "hardware_control":
        return { icon: <Cpu className={`text-rose-400 animate-pulse ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-rose-400/80" };
      case "pkg_htop":
        return { icon: <Cpu className={`text-emerald-400 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-emerald-400/60" };
      case "pkg_neofetch":
        return { icon: <Laptop className={`text-cyan-400 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-cyan-400/60" };
      case "pkg_cmatrix":
        return { icon: <TerminalIcon className={`text-green-500 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-green-500/60" };
      case "pkg_nginx":
        return { icon: <Network className={`text-sky-400 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-sky-450/60" };
      case "pkg_retroarch":
        return { icon: <Tv className={`text-rose-400 ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />, border: "group-hover:border-rose-450/60" };
      default:
        return null;
    }
  };

  // === DESKTOP ICONS REORDERING & DELETION STATE ===
  const [desktopIcons, setDesktopIcons] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cminewar_desktop_icons_layout_v2");
      if (saved) return JSON.parse(saved);
    }

    const defaultIcons = [
      { id: "openclaw_core", name: "Antigravity CLI", col: 0, row: 0, isDeletable: true, isDeleted: false },
      { id: "terminal", name: "Terminal", col: 0, row: 1, isDeletable: true, isDeleted: false },
      { id: "file_manager", name: "Archivos VFS", col: 0, row: 2, isDeletable: true, isDeleted: false },
      { id: "text_editor", name: "Notepad++", col: 0, row: 3, isDeletable: true, isDeleted: false },
      { id: "system_monitor", name: "Monitor", col: 0, row: 4, isDeletable: true, isDeleted: false },
      { id: "control_panel", name: "Panel Control", col: 1, row: 0, isDeletable: true, isDeleted: false },
      { id: "installer", name: "Instalar Kern", col: 1, row: 1, isDeletable: true, isDeleted: false },
      { id: "updater_github", name: "Ajustes SO", col: 1, row: 2, isDeletable: true, isDeleted: false },
      { id: "chromium", name: "Chrome", col: 1, row: 3, isDeletable: true, isDeleted: false },
      { id: "beini", name: "Beini Suite", col: 1, row: 4, isDeletable: true, isDeleted: false },
      { id: "euro_word", name: "Euro Word", col: 2, row: 0, isDeletable: true, isDeleted: false },
      { id: "euro_calc", name: "Euro Calc", col: 2, row: 1, isDeletable: true, isDeleted: false },
      { id: "euro_slide", name: "Euro Slide", col: 2, row: 2, isDeletable: true, isDeleted: false },
      // Permanent Hardware Control (not deletable!)
      { id: "hardware_control", name: "Drivers Hardware", col: 2, row: 3, isDeletable: false, isDeleted: false }
    ];
    return defaultIcons;
  });

  const [draggedIcon, setDraggedIcon] = useState<any | null>(null);
  const [desktopContextMenu, setDesktopContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Sync dynamically installed packages into desktopIcons
  useEffect(() => {
    setDesktopIcons(prev => {
      let updated = [...prev];
      let changed = false;
      
      const packagesToIcons = {
        pkg_htop: { name: "htop v3.2", id: "pkg_htop" },
        pkg_neofetch: { name: "neofetch info", id: "pkg_neofetch" },
        pkg_cmatrix: { name: "cmatrix rain", id: "pkg_cmatrix" },
        pkg_nginx: { name: "nginx server", id: "pkg_nginx" },
        pkg_retroarch: { name: "RetroArch", id: "pkg_retroarch" },
      };

      installedPackages.forEach(pkgId => {
        if (!updated.some(item => item.id === pkgId)) {
          // Find first available slot starting from col 3
          let foundSlot = false;
          let col = 3;
          let row = 0;
          while (!foundSlot && col < 15) {
            if (!updated.some(item => item.col === col && item.row === row && !item.isDeleted)) {
              foundSlot = true;
            } else {
              row++;
              if (row > 5) {
                row = 0;
                col++;
              }
            }
          }
          const pkgInfo = packagesToIcons[pkgId as keyof typeof packagesToIcons];
          if (pkgInfo) {
            updated.push({
              id: pkgId,
              name: pkgInfo.name,
              col,
              row,
              isDeletable: true,
              isDeleted: false
            });
            changed = true;
          }
        }
      });

      // Clean up uninstalled packages
      const originalPackages = ["pkg_htop", "pkg_neofetch", "pkg_cmatrix", "pkg_nginx", "pkg_retroarch"];
      originalPackages.forEach(pkgId => {
        if (!installedPackages.includes(pkgId) && updated.some(item => item.id === pkgId)) {
          updated = updated.filter(item => item.id !== pkgId);
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem("cminewar_desktop_icons_layout_v2", JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, [installedPackages]);

  // Drag and drop mouse logic
  const handleIconMouseDown = (e: React.MouseEvent, icon: any) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    setDraggedIcon({
      id: icon.id,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      origCol: icon.col,
      origRow: icon.row
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setDraggedIcon(prev => {
        if (!prev || prev.id !== icon.id) return prev;
        return {
          ...prev,
          currentX: moveEvent.clientX,
          currentY: moveEvent.clientY
        };
      });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      const deltaX = upEvent.clientX - startX;
      const deltaY = upEvent.clientY - startY;

      // Col / Row shifting calculation (grid cell spacing is ~92px)
      const colShift = Math.round(deltaX / 92);
      const rowShift = Math.round(deltaY / 92);

      let newCol = Math.max(0, icon.col + colShift);
      let newRow = Math.max(0, icon.row + rowShift);

      setDesktopIcons(prev => {
        // Avoid grid overlap
        const isOccupied = prev.some(item => item.col === newCol && item.row === newRow && !item.isDeleted && item.id !== icon.id);
        
        if (isOccupied) {
          let resolved = false;
          let radius = 1;
          while (!resolved && radius < 12) {
            for (let dc = -radius; dc <= radius; dc++) {
              for (let dr = -radius; dr <= radius; dr++) {
                const c = Math.max(0, newCol + dc);
                const r = Math.max(0, newRow + dr);
                if (!prev.some(item => item.col === c && item.row === r && !item.isDeleted && item.id !== icon.id)) {
                  newCol = c;
                  newRow = r;
                  resolved = true;
                  break;
                }
              }
              if (resolved) break;
            }
            radius++;
          }
        }

        const updated = prev.map(item => {
          if (item.id === icon.id) {
            return { ...item, col: newCol, row: newRow };
          }
          return item;
        });
        localStorage.setItem("cminewar_desktop_icons_layout_v2", JSON.stringify(updated));
        return updated;
      });

      setDraggedIcon(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Drag and drop touch logic
  const handleIconTouchStart = (e: React.TouchEvent, icon: any) => {
    if (e.touches.length === 0) return;
    e.stopPropagation();
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    setDraggedIcon({
      id: icon.id,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      origCol: icon.col,
      origRow: icon.row
    });

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length === 0) return;
      const t = moveEvent.touches[0];
      setDraggedIcon(prev => {
        if (!prev || prev.id !== icon.id) return prev;
        return {
          ...prev,
          currentX: t.clientX,
          currentY: t.clientY
        };
      });
    };

    const handleTouchEnd = () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);

      setDraggedIcon(prev => {
        if (!prev || prev.id !== icon.id) return null;

        const deltaX = prev.currentX - prev.startX;
        const deltaY = prev.currentY - prev.startY;

        const colShift = Math.round(deltaX / 92);
        const rowShift = Math.round(deltaY / 92);

        let newCol = Math.max(0, icon.col + colShift);
        let newRow = Math.max(0, icon.row + rowShift);

        setDesktopIcons(prevIcons => {
          const isOccupied = prevIcons.some(item => item.col === newCol && item.row === newRow && !item.isDeleted && item.id !== icon.id);
          if (isOccupied) {
            let resolved = false;
            let radius = 1;
            while (!resolved && radius < 12) {
              for (let dc = -radius; dc <= radius; dc++) {
                for (let dr = -radius; dr <= radius; dr++) {
                  const c = Math.max(0, newCol + dc);
                  const r = Math.max(0, newRow + dr);
                  if (!prevIcons.some(item => item.col === c && item.row === r && !item.isDeleted && item.id !== icon.id)) {
                    newCol = c;
                    newRow = r;
                    resolved = true;
                    break;
                  }
                }
                if (resolved) break;
              }
              radius++;
            }
          }

          const updated = prevIcons.map(item => {
            if (item.id === icon.id) {
              return { ...item, col: newCol, row: newRow };
            }
            return item;
          });
          localStorage.setItem("cminewar_desktop_icons_layout_v2", JSON.stringify(updated));
          return updated;
        });

        return null;
      });
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
  };

  // Delete desktop icon helper
  const handleDeleteIcon = (id: string) => {
    setDesktopIcons(prev => {
      const target = prev.find(item => item.id === id);
      if (target && !target.isDeletable) {
        triggerNotification("⚠️ Acceso denegado: El Panel de Control del Hardware Propietario no puede eliminarse del escritorio al ser un módulo crítico del kernel.", "info");
        return prev;
      }
      const updated = prev.map(item => {
        if (item.id === id) {
          return { ...item, isDeleted: true };
        }
        return item;
      });
      localStorage.setItem("cminewar_desktop_icons_layout_v2", JSON.stringify(updated));
      triggerNotification("🗑️ Acceso directo eliminado del escritorio.", "info");
      return updated;
    });
  };

  // Align to grid helper
  const handleAlignIconsToGrid = () => {
    setDesktopIcons(prev => {
      let col = 0;
      let row = 0;
      const updated = prev.map(item => {
        const newItem = { ...item, col, row };
        row++;
        if (row > 5) {
          row = 0;
          col++;
        }
        return newItem;
      });
      localStorage.setItem("cminewar_desktop_icons_layout_v2", JSON.stringify(updated));
      triggerNotification("🧹 Iconos del escritorio alineados a la cuadrícula con éxito.", "success");
      return updated;
    });
    setDesktopContextMenu(null);
  };

  // Restore deleted icons helper
  const handleRestoreAllIcons = () => {
    setDesktopIcons(prev => {
      const updated = prev.map(item => ({ ...item, isDeleted: false }));
      localStorage.setItem("cminewar_desktop_icons_layout_v2", JSON.stringify(updated));
      triggerNotification("♻️ Todos los accesos directos han sido restaurados en el escritorio.", "success");
      return updated;
    });
    setDesktopContextMenu(null);
  };

  // === BACKGROUND PROPRIETARY HARDWARE DAEMON SERVICE ===
  useEffect(() => {
    if (bootLifecycle !== "ready") return;

    const timer = setTimeout(() => {
      const currentHostId = localStorage.getItem("cminewar_current_host") || "host_1";
      
      const HOSTS_DRIVERS = {
        host_1: [],
        host_2: [
          { id: "nvidia-gforce-rtx", name: "NVIDIA ForceWare v555", version: "555.12" },
          { id: "killer-wifi-pro", name: "Intel Killer Performance Suite", version: "3.4.152" }
        ],
        host_3: [
          { id: "nvidia-rtx-enterprise", name: "NVIDIA RTX Enterprise v550", version: "550.40" },
          { id: "broadcom-sta-extreme", name: "Broadcom WL Proprietary Stack", version: "6.30.223" },
          { id: "realtek-hd-asio-pro", name: "Realtek High Definition ASIO Pro", version: "2.9.12" }
        ]
      };

      const required = HOSTS_DRIVERS[currentHostId as keyof typeof HOSTS_DRIVERS] || [];
      if (required.length === 0) {
        triggerNotification("🔌 [Sensing] Todo el hardware de este host utiliza controladores libres pre-instalados.", "info");
        return;
      }

      const savedDriversStr = localStorage.getItem("cminewar_installed_drivers");
      const installed = savedDriversStr ? JSON.parse(savedDriversStr) : [];

      // Find required but uninstalled drivers
      const toInstall = required.filter(dr => !installed.includes(dr.id));
      if (toInstall.length === 0) {
        triggerNotification("ℹ️ [Sensing] Todos los drivers propietarios para este Host ya están activos y optimizados.", "success");
        return;
      }

      // Start background downloading logic
      let currentIdx = 0;
      const processNext = () => {
        if (currentIdx >= toInstall.length) return;
        const dr = toInstall[currentIdx];

        // Phase 1: Download in background
        triggerNotification(`⬇️ [Hardware Daemon] Descargando controlador propietario: ${dr.name}...`, "info");
        
        // Phase 2: Compile dkms (after 5s)
        setTimeout(() => {
          triggerNotification(`⚙️ [Hardware Daemon] Compilando dkms para ${dr.name} en segundo plano...`, "info");
          
          // Phase 3: Successful Activation (after 5s)
          setTimeout(() => {
            const freshSavedStr = localStorage.getItem("cminewar_installed_drivers");
            const freshInstalled = freshSavedStr ? JSON.parse(freshSavedStr) : [];
            const updated = Array.from(new Set([...freshInstalled, dr.id]));
            
            localStorage.setItem("cminewar_installed_drivers", JSON.stringify(updated));
            // Dispatch storage event to alert UI
            window.dispatchEvent(new Event("storage"));
            
            triggerNotification(`✅ [Hardware Daemon] ¡Controlador propietario ${dr.name} activado con éxito!`, "success");

            currentIdx++;
            processNext();
          }, 5000);
        }, 5000);
      };

      processNext();
    }, 4000);

    return () => clearTimeout(timer);
  }, [bootLifecycle]);

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
        title: "Notepad++ v8.6.2",
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
        title: "Chrome Dev - Navegador de Internet",
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
      {
        id: "beini",
        title: "Beini v3.0 - Modern Wi-Fi Pentesting Suite",
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: 25,
        position: { x: 220, y: 140 },
        size: { width: 780, height: 530 },
      },
      {
        id: "euro_word",
        title: "Euro Word - Procesador de Textos",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 5,
        position: { x: 130, y: 120 },
        size: { width: 680, height: 500 },
      },
      {
        id: "euro_calc",
        title: "Euro Calc - Hoja de Cálculo Inteligente",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 5,
        position: { x: 150, y: 140 },
        size: { width: 780, height: 520 },
      },
      {
        id: "euro_slide",
        title: "Euro Slide - Presentador de Diapositivas Profesional",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 5,
        position: { x: 170, y: 160 },
        size: { width: 720, height: 480 },
      },
      {
        id: "hardware_control",
        title: "Centro de Control de Hardware Propietario - dkms-sensing",
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 25,
        position: { x: 190, y: 150 },
        size: { width: 740, height: 520 },
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
      
      const screenW = typeof window !== "undefined" ? window.innerWidth : 1024;
      const screenH = typeof window !== "undefined" ? window.innerHeight : 768;
      const isMobileSize = screenW < 768 || touchMode;

      return prev.map((w) => {
        if (w.id === id) {
          let updatedPos = { ...w.position };
          let updatedSize = { ...w.size };
          let isMax = w.isMaximized;

          if (isMobileSize) {
            // Mobile auto-adjust: maximize to fit screen perfectly
            isMax = true;
          } else {
            // Desktop safe fitting: cap to window boundaries so it never overflows
            const maxAllowedWidth = Math.floor(screenW * 0.95);
            const maxAllowedHeight = Math.floor((screenH - 50) * 0.9);
            
            if (updatedSize.width > maxAllowedWidth) {
              updatedSize.width = maxAllowedWidth;
            }
            if (updatedSize.height > maxAllowedHeight) {
              updatedSize.height = maxAllowedHeight;
            }
            
            if (updatedPos.x + updatedSize.width > screenW) {
              updatedPos.x = Math.max(10, screenW - updatedSize.width - 20);
            }
            if (updatedPos.y + updatedSize.height > screenH - 50) {
              updatedPos.y = Math.max(10, screenH - updatedSize.height - 70);
            }
          }

          return { 
            ...w, 
            isOpen: true, 
            isMinimized: false, 
            isMaximized: isMax,
            zIndex: maxZ + 1,
            position: updatedPos,
            size: updatedSize
          };
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
      if (targetWindow.zIndex === maxZ && !targetWindow.isMinimized) return prev; // already focused & visible

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
          if (w.isMaximized) return w;
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
          if (w.isMaximized) return w;
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
        return <ControlPanel openWindow={handleOpenWindow} />;
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
      case "hardware_control":
        return (
          <HardwareControl
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
      case "beini":
        return <Beini />;
      case "euro_word":
        return <EuroWord vfs={vfs} setVfs={setVfs} triggerNotification={triggerNotification} />;
      case "euro_calc":
        return <EuroCalc vfs={vfs} setVfs={setVfs} triggerNotification={triggerNotification} />;
      case "euro_slide":
        return <EuroSlide vfs={vfs} setVfs={setVfs} triggerNotification={triggerNotification} />;
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
        return "Antigravity CLI (agy)";
      case "file_manager":
        return "Explorador de Archivos (CMineWarFM)";
      case "text_editor":
        return "Notepad++";
      case "system_monitor":
        return "Monitor del Sistema (CMineWarMonitor)";
      case "control_panel":
        return "Panel de Control CMineWar";
      case "installer":
        return "Instalador Kernel Sencillo Beta";
      case "updater_github":
        return "Ajustes y Hardware Debian";
      case "hardware_control":
        return "Drivers de Hardware Propietario";
      case "chromium":
        return "Chrome";
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
      case "beini":
        return "Beini Suite Pentesting";
      case "euro_word":
        return "Euro Word";
      case "euro_calc":
        return "Euro Calc";
      case "euro_slide":
        return "Euro Slide";
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

  useEffect(() => {
    const handleTriggerNotificationEvent = (e: any) => {
      if (e.detail && typeof e.detail.text === "string") {
        triggerNotification(e.detail.text, e.detail.type || "info");
      }
    };
    window.addEventListener("trigger_notification", handleTriggerNotificationEvent);
    return () => {
      window.removeEventListener("trigger_notification", handleTriggerNotificationEvent);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Gateway phase requesting IP node with custom dragon logo
  if (bootLifecycle === "gateway") {
    return (
      <div className="w-full h-screen bg-[#070913] text-slate-100 font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
        {/* Ambient grids/glows */}
        <div className="absolute 0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-950/10 rounded-full blur-[120px]" />
        
        <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-xl p-8 relative z-10 shadow-2xl flex flex-col items-center space-y-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000" />
            <div className="relative bg-[#0f172a] p-4 rounded-full border border-slate-800">
              <DragonLogo size={80} glow={true} useImage={true} imageFormat="png" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold tracking-wider text-red-500 font-mono uppercase">
              CMINEWAR OS
            </h1>
            <p className="text-[10px] tracking-widest text-emerald-500 font-bold bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/30 inline-block uppercase">
              ● MODO PRODUCCIÓN EXCLUSIVO
            </p>
            <p className="text-xs text-slate-400 mt-1">
              PANEL DE ENLACE NUCLEO DIRECTO
            </p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const ipInput = form.elements.namedItem("node_ip") as HTMLInputElement;
              const ipVal = ipInput.value.trim();
              if (!ipVal) return;

              // Prohibit any connections to virtual simulators/loopback
              const isSimulator = 
                ipVal === "127.0.0.1" || 
                ipVal.toLowerCase() === "localhost" || 
                ipVal.startsWith("10.0.2.") || 
                ipVal === "10.0.2.2" || 
                ipVal === "10.0.2.15";

              if (isSimulator) {
                setConnError("CONEXIÓN DE SIMULADOR RECHAZADA. Las directrices de producción prohíben la vinculación con emuladores o entornos simulados.");
                return;
              }

              setConnError(null);
              setConnectedServerIp(ipVal);
              setBootLifecycle("bootloader");
            }}
            className="w-full space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="node_ip" className="text-xs font-semibold text-slate-400 block uppercase tracking-widest">
                Dirección IP del Nodo de Producción
              </label>
              <input
                id="node_ip"
                name="node_ip"
                type="text"
                required
                placeholder="Ej. 192.168.1.100"
                defaultValue="192.168.1.100"
                className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-red-500 transition font-mono text-center"
              />
            </div>

            {connError && (
              <div className="w-full p-3 bg-red-950/40 border border-red-900/55 text-red-400 rounded-lg text-[11px] font-mono leading-relaxed text-center shadow-lg">
                ⚠️ {connError}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                id="connect_node_btn"
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-lg shadow-red-900/20 active:translate-y-[1px] cursor-pointer"
              >
                Establecer Conexión
              </button>
            </div>
          </form>

          <div className="w-full flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800 pt-4 font-mono">
            <span>CONTROLADOR DE MÁQUINA REAL</span>
            <span>ENLACE SEGURO v{VERSION}</span>
          </div>
        </div>
      </div>
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

      {/* Automatic Background Live OTA Hard Reload Overlay */}
      {isOtaUpdating && (
        <div className="absolute inset-0 z-[100000] bg-slate-950/95 flex flex-col items-center justify-center space-y-5 animate-fade-in font-mono pointer-events-auto">
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-14 rounded-full border-2 border-dashed border-pink-500 animate-spin"></div>
            <Sparkles className="absolute text-pink-400 animate-pulse" size={20} />
          </div>
          <div className="text-center space-y-1.5 px-6">
            <h3 className="text-xs font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-300">
              Sincronización Inteligente OTA
            </h3>
            <p className="text-[9.5px] text-slate-400 max-w-[280px] leading-relaxed mx-auto">
              Se han detectado cambios lógicos en caliente. Regenerando firma de red del clúster e interfaz...
            </p>
            <div className="text-[8px] text-emerald-450 tracking-wider font-extrabold px-2 py-0.5 rounded border border-emerald-900/30 bg-emerald-950/20 inline-block uppercase select-none">
              ⚡ DAEMON COGNITIVO: CONECTADO AUTOMÁTICAMENTE ⚡
            </div>
          </div>
        </div>
      )}
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

      {/* CMineWar OS Style Translucent Top Bar */}
      <div 
        className="w-full h-11 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 select-none z-[999]"
        id="dsm-desktop-top-bar"
      >
        <div className="flex items-center space-x-3 flex-row min-w-0 flex-1 mr-4">
          {/* Main Menu Toggle */}
          <button
            onClick={() => {
              setAppDrawerOpen(!appDrawerOpen);
            }}
            className={`flex items-center justify-center p-1.5 rounded-lg transition-all cursor-pointer ${
              appDrawerOpen
                ? "bg-emerald-950 border border-emerald-500/50 text-emerald-300"
                : "bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-slate-850 text-emerald-400"
            }`}
            title="Centro de Aplicaciones CMineWar OS"
            id="dsm-menu-button"
          >
            <LayoutGrid size={15} />
          </button>

          {/* Minimize / Restore All Windows (Show Desktop) */}
          <button
            onClick={() => {
              const hasOpenVisible = windows.some(w => w.isOpen && !w.isMinimized);
              setWindows(prev => prev.map(w => {
                if (w.isOpen) {
                  return { ...w, isMinimized: hasOpenVisible };
                }
                return w;
              }));
            }}
            className="flex items-center justify-center p-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:bg-slate-850 rounded-lg text-cyan-400 transition cursor-pointer"
            title="Mostrar Escritorio"
            id="dsm-desktop-button"
          >
            <Laptop size={15} />
          </button>
          
          <div className="h-4 w-[1px] bg-slate-800 shrink-0"></div>
          
          <span className="font-sans font-bold text-xs tracking-wider text-slate-200 shrink-0 hidden md:inline-block">
            {connectedServerIp ? `CMineWar-NAS [${connectedServerIp}]` : "CMineWar-NAS [Localhost]"}
          </span>

          {connectedServerIp && (
            <>
              <div className="h-4 w-[1px] bg-slate-800 shrink-0"></div>
              <button
                onClick={() => {
                  setConnectedServerIp(null);
                  setBootLifecycle("gateway");
                }}
                className="flex items-center space-x-1 px-2.5 py-1 bg-red-950/40 border border-red-800/40 hover:border-red-500 hover:bg-red-900/50 rounded-md text-red-400 hover:text-red-200 transition cursor-pointer text-[10px] font-mono uppercase tracking-wider"
                title="Desconectar del servidor remoto"
                id="disconnect-node-btn"
              >
                <LogOut size={10} />
                <span>Desconectar</span>
              </button>
            </>
          )}

          <div className="h-4 w-[1px] bg-slate-800 shrink-0 hidden md:inline-block"></div>

          {/* Active Application Representation Tabs inside Top Bar (exactly like CMineWar OS) */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1 max-w-full">
            {windows.map((win) => {
              const active = win.isOpen && !win.isMinimized;
              if (!win.isOpen) return null;
              
              return (
                <button
                  key={win.id}
                  onClick={() => {
                    if (win.isMinimized) {
                      handleFocusWindow(win.id);
                    } else {
                      handleMinimizeWindow(win.id);
                    }
                  }}
                  className={`select-none font-sans font-medium flex items-center transition border px-2.5 py-1 text-[10px] space-x-1.5 rounded-md shrink-0 ${
                    active
                      ? "bg-slate-900 text-emerald-400 border-emerald-500/40 font-bold"
                      : "bg-slate-950/50 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                  id={`taskbar-tab-${win.id}`}
                >
                  {win.id === "terminal" && <TerminalIcon size={11} />}
                  {win.id === "openclaw_core" && <DragonLogo size={12} />}
                  {win.id === "file_manager" && <FolderOpen size={11} />}
                  {win.id === "text_editor" && <FileCode size={11} className="text-lime-500" />}
                  {win.id === "system_monitor" && <Cpu size={11} />}
                  {win.id === "control_panel" && <Sliders size={11} />}
                  {win.id === "installer" && <Download size={11} />}
                  {win.id === "updater_github" && <Settings size={11} className="text-pink-400" />}
                  {win.id === "chromium" && <Chrome size={11} className="text-blue-400" />}
                  {win.id === "pkg_htop" && <Cpu size={11} className="text-emerald-400" />}
                  {win.id === "pkg_neofetch" && <Laptop size={11} className="text-emerald-400" />}
                  {win.id === "pkg_cmatrix" && <TerminalIcon size={11} className="text-emerald-400" />}
                  {win.id === "pkg_nginx" && <Network size={11} className="text-emerald-400" />}
                  {win.id === "pkg_retroarch" && <Tv size={11} className="text-emerald-400" />}
                  {win.id === "beini" && <Wifi size={11} className="text-pink-400" />}
                  {win.id === "euro_word" && <FileText size={11} className="text-blue-500" />}
                  {win.id === "euro_calc" && <FileSpreadsheet size={11} className="text-emerald-500" />}
                  {win.id === "euro_slide" && <Presentation size={11} className="text-amber-500" />}
                  <span className="truncate max-w-[85px]">{getFriendlyAppName(win.id).replace(" (CMineWarFM)", "").replace(" (CMineWarEdit)", "").replace(" (CMineWarMonitor)", "")}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center status label - hidden if screen space is needed */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-slate-900/60 border border-slate-800/80 px-2.5 py-0.5 rounded-full text-[9px] font-mono text-slate-400 mr-4">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          <span>SISTEMA SALUDABLE (CMineWar OS)</span>
        </div>

        {/* Right Info Widgets trigger and System Tray */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Volume, Network, Battery status tray icons */}
          <div className="hidden sm:flex items-center space-x-2 text-slate-400 border-r border-slate-800 pr-2">
            {/* Dynamic Debian Service Tray Status Icons */}
            {installedPackages.includes("pkg_nginx") && (
              <Network size={12} className="text-cyan-400 animate-pulse cursor-pointer" title="Servicio Nginx Web Server: ACTIVO en puerto 80" />
            )}
            {installedPackages.includes("pkg_htop") && (
              <Cpu size={12} className="text-emerald-400 cursor-pointer" title="Monitoreo htop cargado en background" />
            )}
            {installedPackages.includes("pkg_retroarch") && (
              <Tv size={12} className="text-amber-400 cursor-pointer" title="Controlador de juego RetroArch activo" />
            )}
            <Volume2 size={13} className="hover:text-slate-200 cursor-pointer" title="Volumen: 80%" />
            <Battery size={13} className="hover:text-slate-200 cursor-pointer text-emerald-400" title="Batería: 100% cargada" />
            <Wifi size={13} className="text-emerald-400 cursor-pointer" title="Red: Gigabit Ethernet virtual conectada" />
          </div>

          {/* Toggle Widget Panel Button */}
          <button
            onClick={() => setWidgetsOpen(!widgetsOpen)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md border text-[9.5px] font-mono font-bold uppercase transition duration-200 cursor-pointer ${
              widgetsOpen
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            id="dsm-widgets-toggle"
          >
            <Activity size={10} className={widgetsOpen ? "animate-pulse text-emerald-400" : "text-slate-500"} />
            <span className="hidden sm:inline">ESTADO NAS</span>
          </button>

          {/* User profile avatar pill */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-lg text-[9px] font-mono text-slate-300">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold font-mono text-[8px]">U</span>
            <span className="text-slate-450">root</span>
          </div>

          {/* System Date & Time */}
          <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-lg text-[9.5px] font-semibold text-slate-300 font-mono">
            <span>
              {systemTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Desktop workspace */}
      <div 
        className="flex-1 relative p-4 pointer-events-auto overflow-hidden z-[10]"
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            setDesktopContextMenu({ x: e.clientX, y: e.clientY });
          }
        }}
        onClick={() => {
          if (desktopContextMenu) setDesktopContextMenu(null);
        }}
      >
        {/* Desktop icons layer */}
        <div className="absolute inset-0 p-6 pointer-events-none select-none z-10">
          {desktopIcons
            .filter(icon => !icon.isDeleted)
            .map(icon => {
              const matchingLauncher = getLauncherData(icon.id);
              if (!matchingLauncher) return null;

              const isDraggingThis = draggedIcon && draggedIcon.id === icon.id;
              
              const colWidth = 92;
              const rowHeight = 92;
              
              let left = icon.col * colWidth + 24;
              let top = icon.row * rowHeight + 24;

              if (isDraggingThis && draggedIcon) {
                left += (draggedIcon.currentX - draggedIcon.startX);
                top += (draggedIcon.currentY - draggedIcon.startY);
              }

              return (
                <div
                  key={icon.id}
                  style={{
                    position: "absolute",
                    left: `${left}px`,
                    top: `${top}px`,
                    zIndex: isDraggingThis ? 1000 : 10,
                  }}
                  className={`pointer-events-auto flex flex-col items-center justify-center w-20 h-20 text-center cursor-pointer group rounded-xl border border-transparent hover:border-slate-800/40 hover:bg-slate-900/20 transition-all ${
                    isDraggingThis ? "scale-105 opacity-90 cursor-grabbing duration-0" : "duration-200"
                  }`}
                  onMouseDown={(e) => handleIconMouseDown(e, icon)}
                  onTouchStart={(e) => handleIconTouchStart(e, icon)}
                  onDoubleClick={() => handleOpenWindow(icon.id)}
                  onClick={() => {
                    if (touchMode) handleOpenWindow(icon.id);
                  }}
                  title={`Inicia ${icon.name}`}
                >
                  {/* Delete shortcut button on hover (if deletable) */}
                  {icon.isDeletable ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIcon(icon.id);
                      }}
                      className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-4.5 h-4.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] shadow border border-rose-400/30 font-bold leading-none"
                      title="Eliminar acceso directo"
                    >
                      ×
                    </button>
                  ) : (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerNotification("⚠️ El Panel de Control del Hardware Propietario es permanente y no puede eliminarse del escritorio.", "info");
                      }}
                      className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-4.5 h-4.5 rounded-full bg-slate-800 text-slate-400 text-[8px] border border-slate-700 font-bold leading-none cursor-help"
                      title="Permanente"
                    >
                      !
                    </span>
                  )}
                  
                  {/* Icon container */}
                  <div className={`border bg-slate-950/80 hover:bg-slate-950 border-slate-800 ${matchingLauncher.border} flex items-center justify-center shadow-lg transition-all duration-200 aspect-square ${
                    touchMode ? "w-10 h-10 rounded-xl shadow-md" : "w-11 h-11 rounded-xl"
                  }`}>
                    {matchingLauncher.icon}
                  </div>
                  
                  {/* Icon Name text */}
                  <span className={`font-semibold text-slate-100 px-1 py-0.5 bg-slate-950/65 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full text-[10.5px] mt-1`}>
                    {icon.name}
                  </span>
                </div>
              );
            })}

          {/* Statically positioned Cajón Apps at bottom left */}
          <div
            style={{
              position: "absolute",
              left: "24px",
              bottom: "24px",
            }}
            onDoubleClick={() => setAppDrawerOpen(true)}
            onClick={() => setAppDrawerOpen(true)}
            className="pointer-events-auto flex flex-col items-center justify-center w-20 h-20 text-center cursor-pointer group rounded-xl border border-transparent hover:border-slate-800/40 hover:bg-slate-900/20 transition-all duration-200"
            title="Abrir el Cajón de Aplicaciones"
            id="launcher-app-drawer"
          >
            <div className={`border bg-slate-950/80 hover:bg-slate-950 border-slate-800 group-hover:border-emerald-400 flex items-center justify-center shadow-lg transition-all duration-200 aspect-square ${
              touchMode ? "w-10 h-10 rounded-xl shadow-md border-emerald-500/15" : "w-11 h-11 rounded-xl"
            }`}>
              <LayoutGrid className={`text-emerald-400 group-hover:scale-105 transition-all ${touchMode ? "w-5 h-5" : "w-6 h-6"}`} />
            </div>
            <span className={`font-black text-slate-100 px-1 py-0.5 bg-slate-950/65 rounded border border-slate-900/10 shadow shadow-slate-950/50 group-hover:bg-slate-950/90 truncate max-w-full text-[10px] mt-1`}>
              Cajón Apps
            </span>
          </div>
        </div>

        {/* Desktop Context Menu */}
        {desktopContextMenu && (
          <div
            style={{
              position: "fixed",
              left: `${desktopContextMenu.x}px`,
              top: `${desktopContextMenu.y}px`,
              zIndex: 100000,
            }}
            className="w-56 bg-slate-950/95 border border-slate-800 shadow-[0_4px_25px_rgba(0,0,0,0.5)] backdrop-blur-md rounded-lg p-1.5 text-xs font-sans text-slate-200 flex flex-col pointer-events-auto"
          >
            <button
              onClick={handleAlignIconsToGrid}
              className="text-left w-full px-2.5 py-1.5 hover:bg-slate-900 rounded-md hover:text-emerald-400 font-medium transition-colors"
            >
              Alinear iconos a la cuadrícula
            </button>
            <button
              onClick={handleRestoreAllIcons}
              className="text-left w-full px-2.5 py-1.5 hover:bg-slate-900 rounded-md hover:text-emerald-400 font-medium transition-colors border-b border-slate-900 pb-2 mb-1"
            >
              Restaurar todos los iconos
            </button>
            <button
              onClick={() => {
                handleOpenWindow("hardware_control");
                setDesktopContextMenu(null);
              }}
              className="text-left w-full px-2.5 py-1.5 hover:bg-slate-900 rounded-md hover:text-emerald-400 font-medium transition-colors flex items-center justify-between"
            >
              <span>Controlador de Hardware</span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded uppercase font-bold">Kernel</span>
            </button>
          </div>
        )}

        {/* Custom CMineWar OS style Desktop Widget Panel */}
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
              /* CMineWar OS Mobile Widget display */
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
              /* CMineWar OS PC Widget card (Full detail widget) */
              <>
                {/* Health Section */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-200 font-sans">Monitor de Recursos CMineWar OS</h4>
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
        {windows.map((win) => {
          const openNonMinimized = windows.filter((w) => w.isOpen && !w.isMinimized);
          const maxZ = openNonMinimized.length > 0 ? Math.max(...openNonMinimized.map((w) => w.zIndex)) : 0;
          const isFocused = win.zIndex === maxZ;
          const isHiddenOnMobile = touchMode && !isFocused && win.isOpen && !win.isMinimized;

          return (
            <div
              key={win.id}
              className={isHiddenOnMobile ? "hidden" : "contents"}
            >
              <WindowFrame
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
            </div>
          );
        })}
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
              <FileCode size={16} className="text-lime-500" />
              <div>
                <p className="font-medium text-slate-300">Notepad++</p>
                <p className="text-[9px] text-slate-500">Editor de textos y código avanzado</p>
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
              <Chrome size={16} className="text-blue-400" />
              <div>
                <p className="font-medium text-slate-300">Chrome</p>
                <p className="text-[9px] text-slate-500">Navega por la red simulated Chrome Dev</p>
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

      {/* Decorative desktop greeting in the center removed as per user request */}

      {/* App Drawer Fullscreen Overlay (CMineWar OS Style Main Menu) */}
      {appDrawerOpen && (
        <div 
          className="absolute inset-x-0 top-0 bottom-0 z-[9999] bg-slate-950/90 backdrop-blur-xl animate-fade-in flex flex-col p-6 overflow-hidden text-sans select-none"
          id="cajon-apps-overlay"
        >
          {/* Header filter & Title bar */}
          <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 pb-4 shrink-0 space-y-3 sm:space-y-0 text-left">
            <div>
              <h2 className="text-sm font-black text-slate-100 flex items-center space-x-2">
                <LayoutGrid className="text-emerald-400 w-5 h-5" />
                <span>Centro del Cajón de Aplicaciones — CMineWar OS Main Menu</span>
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
                { id: "openclaw_core", name: "Antigravity CLI", desc: "Núcleo cognitivo central", icon: (props: any) => <DragonLogo {...props} useImage={true} imageFormat="jpg" />, customIcon: true, system: true },
                { id: "terminal", name: "Terminal", desc: "Consola CMineWarBash", icon: TerminalIcon, system: true },
                { id: "file_manager", name: "Archivos VFS", desc: "Explorador de ficheros", icon: FolderOpen, system: true, iconCol: "text-cyan-400" },
                { id: "text_editor", name: "Notepad++", desc: "Editor de textos y código avanzado", icon: FileCode, system: true, iconCol: "text-lime-500" },
                { id: "system_monitor", name: "Monitor", desc: "Hardware en vivo", icon: Cpu, system: true, iconCol: "text-violet-400" },
                { id: "control_panel", name: "Panel Control", desc: "Ancho de red y servicios", icon: Sliders, system: true, iconCol: "text-emerald-400" },
                { id: "installer", name: "Instalar Kern", desc: "Instalador de drivers de hardware", icon: Download, system: true, iconCol: "text-cyan-400" },
                { id: "updater_github", name: "Ajustes Globales", desc: "Comunicaciones y resolución", icon: Settings, system: true, iconCol: "text-pink-400" },
                { id: "chromium", name: "Chrome", desc: "Navegador de internet Chrome Dev", icon: Chrome, system: true, iconCol: "text-blue-400" },
                { id: "beini", name: "Beini Suite", desc: "Wi-Fi pentesting y auditorías", icon: Wifi, system: true, iconCol: "text-pink-400" },
                // Euro Office Preinstalled Webapps
                { id: "euro_word", name: "Euro Word", desc: "Procesador de textos", icon: FileText, system: true, iconCol: "text-blue-500" },
                { id: "euro_calc", name: "Euro Calc", desc: "Hoja de cálculo inteligente", icon: FileSpreadsheet, system: true, iconCol: "text-emerald-500" },
                { id: "euro_slide", name: "Euro Slide", desc: "Presentador de diapositivas", icon: Presentation, system: true, iconCol: "text-amber-500" },
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
            <span>CMineWar OS Debian Workspace v{VERSION} (Compilación #{BUILD_NUMBER})</span>
            <span>Detección automática de pantalla: Completamente adaptable</span>
          </div>
        </div>
      )}
    </div>
  );
}
