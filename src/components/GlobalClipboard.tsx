import React, { useState, useEffect, useRef } from "react";
import { WindowState } from "../types";
import { Clipboard, Trash2, Check, ArrowDownLeft, Sparkles, Plus, Copy, RefreshCw, Layers } from "lucide-react";

interface GlobalClipboardProps {
  windows: WindowState[];
  handleFocusWindow: (id: string) => void;
  triggerNotification: (text: string, type: "success" | "info") => void;
}

export default function GlobalClipboard({
  windows,
  handleFocusWindow,
  triggerNotification
}: GlobalClipboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clips, setClips] = useState<string[]>([]);
  const [newClipText, setNewClipText] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pastedIndex, setPastedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Friendly application names mapping
  const appNames: Record<string, string> = {
    terminal: "Terminal Bash",
    openclaw_core: "Claw AI Core",
    file_manager: "Explorador Archivos",
    text_editor: "Notepad++ Editor",
    system_monitor: "Monitor de Sistema",
    control_panel: "Panel de Control",
    installer: "Instalador Suite",
    updater_github: "Ajustes de Sistema",
    chromium: "Chromium Browser",
    pkg_htop: "htop Monitor",
    pkg_neofetch: "neofetch Info",
    pkg_cmatrix: "cmatrix Terminal",
    pkg_nginx: "Servidor Nginx",
    pkg_retroarch: "RetroArch Emulador",
    beini: "Beini WiFi Auditor",
    euro_word: "EuroOffice Word",
    euro_calc: "EuroOffice Calc",
    euro_slide: "EuroOffice Slide",
  };

  // 1. Load clipboard history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cminewar_clipboard_history");
    if (saved) {
      try {
        setClips(JSON.parse(saved));
      } catch (e) {
        setClips(getDefaultClips());
      }
    } else {
      const defaults = getDefaultClips();
      setClips(defaults);
      localStorage.setItem("cminewar_clipboard_history", JSON.stringify(defaults));
    }
  }, []);

  // Helper for initial default clips
  const getDefaultClips = () => [
    "sudo systemctl restart nginx",
    "Yonah Llanes - CMineWar OS",
    "cminewar_live_recovery_key_v1.5",
    "https://github.com/YonahLlanes/cminewar-os"
  ];

  // Save clips helper
  const saveClips = (newClips: string[]) => {
    setClips(newClips);
    localStorage.setItem("cminewar_clipboard_history", JSON.stringify(newClips));
  };

  // 2. Intercept global copy events on document
  useEffect(() => {
    const handleGlobalCopy = () => {
      // Small timeout to let the browser put the selection in clipboard
      setTimeout(() => {
        const selectedText = window.getSelection()?.toString();
        if (selectedText && selectedText.trim()) {
          addClip(selectedText, false); // Add to local history but don't re-copy to physical clipboard
        }
      }, 50);
    };

    document.addEventListener("copy", handleGlobalCopy);
    return () => {
      document.removeEventListener("copy", handleGlobalCopy);
    };
  }, [clips]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Add clip helper
  const addClip = (text: string, copyToPhysical = true) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    
    // Prevent duplicates in first position
    let updated = [trimmed, ...clips.filter(c => c !== trimmed)];
    // Cap at 15 items
    if (updated.length > 15) {
      updated = updated.slice(0, 15);
    }
    saveClips(updated);

    if (copyToPhysical) {
      copyToPhysicalClipboard(trimmed);
    }
  };

  // Copy to physical system clipboard
  const copyToPhysicalClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          triggerNotification("Texto copiado al portapapeles del sistema.", "success");
        })
        .catch(() => {
          // Fallback if permission denied
          triggerNotification("Agregado al portapapeles de CMineWar.", "info");
        });
    } else {
      triggerNotification("Agregado al portapapeles de CMineWar.", "info");
    }
  };

  // Quick manually typed clip save
  const handleAddNewClip = () => {
    if (!newClipText.trim()) return;
    addClip(newClipText, true);
    setNewClipText("");
  };

  // Clear entire history
  const handleClearHistory = () => {
    saveClips([]);
    triggerNotification("Historial de portapapeles vaciado.", "success");
  };

  // Delete a single clip
  const handleDeleteClip = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = clips.filter((_, idx) => idx !== indexToDelete);
    saveClips(updated);
  };

  // Sync / Import from physical clipboard
  const handleImportPhysicalClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          addClip(text, false);
          triggerNotification("Portapapeles físico sincronizado con éxito.", "success");
        } else {
          triggerNotification("El portapapeles del sistema está vacío.", "info");
        }
      } else {
        triggerNotification("No se permiten accesos de lectura del portapapeles en este navegador.", "info");
      }
    } catch (err) {
      triggerNotification("Error al acceder al portapapeles físico (permiso denegado).", "info");
    }
  };

  // Real clipboard injection algorithm
  const handleInjectIntoApp = (windowId: string, textToInject: string, index: number) => {
    // Show quick visual feed on the list
    setPastedIndex(index);
    setTimeout(() => setPastedIndex(null), 1000);

    // 1. Bring application window to focus
    handleFocusWindow(windowId);

    // 2. Schedule insertion with a tiny timeout to allow the window frame to focus & mount
    setTimeout(() => {
      let injected = false;

      // Check specific selectors for known inputs
      let selector = "";
      if (windowId === "text_editor") {
        selector = "#notepad-textarea";
      } else if (windowId === "terminal") {
        selector = "#terminal-input";
      } else if (windowId === "openclaw_core") {
        selector = "#chat-input-claw";
      } else if (windowId === "euro_word") {
        selector = "textarea";
      } else if (windowId === "euro_calc") {
        selector = "input";
      } else if (windowId === "euro_slide") {
        selector = "textarea";
      } else if (windowId === "chromium") {
        selector = "input";
      }

      // Try specific selectors
      if (selector) {
        const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
        if (el) {
          insertTextAtCursor(el, textToInject);
          injected = true;
        }
      }

      // If specific didn't work, try targeting ANY input/textarea inside the active window container
      if (!injected) {
        const winContainer = document.getElementById(`win-${windowId}`);
        if (winContainer) {
          const inputEl = winContainer.querySelector("textarea, input[type='text']") as HTMLInputElement | HTMLTextAreaElement;
          if (inputEl) {
            insertTextAtCursor(inputEl, textToInject);
            injected = true;
          }
        }
      }

      // If still nothing, check if the document.activeElement is an input/textarea
      if (!injected) {
        const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
        if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
          insertTextAtCursor(activeEl, textToInject);
          injected = true;
        }
      }

      if (injected) {
        triggerNotification(`Texto pegado en ${appNames[windowId] || windowId}.`, "success");
      } else {
        triggerNotification(`Enfoque establecido. Escriba o pegue en el editor activo de ${appNames[windowId] || windowId}.`, "info");
      }
    }, 120);
  };

  // Insert text utility helper
  const insertTextAtCursor = (inputEl: HTMLInputElement | HTMLTextAreaElement, textToPaste: string) => {
    const start = inputEl.selectionStart || 0;
    const end = inputEl.selectionEnd || 0;
    const text = inputEl.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    inputEl.value = before + textToPaste + after;
    inputEl.selectionStart = inputEl.selectionEnd = start + textToPaste.length;

    // Dispatch native 'input' event so React models captures the value change
    const event = new Event("input", { bubbles: true });
    inputEl.dispatchEvent(event);

    // Re-focus the field
    inputEl.focus();
  };

  // Paste into active element anywhere in the browser right now
  const handlePasteAtCurrentCursor = (textToPaste: string, index: number) => {
    const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
    
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      setPastedIndex(index);
      setTimeout(() => setPastedIndex(null), 1000);
      insertTextAtCursor(activeEl, textToPaste);
      triggerNotification("Texto insertado en el cursor seleccionado.", "success");
    } else {
      triggerNotification("Seleccione o haga clic en un campo de texto primero.", "info");
    }
  };

  // Set visual copied state and write physical clip
  const handleQuickCopy = (text: string, index: number) => {
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1000);
    copyToPhysicalClipboard(text);
  };

  // Find all windows currently open (isOpen = true) to list them as paste destinations
  const openWindows = windows.filter(w => w.isOpen);

  return (
    <div className="relative" ref={containerRef} id="sys-global-clipboard">
      {/* Top Bar Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1 px-2.5 py-1 rounded-md border text-[9.5px] font-mono font-bold uppercase transition duration-200 cursor-pointer ${
          isOpen
            ? "bg-orange-500/15 border-orange-500/40 text-orange-300"
            : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200"
        }`}
        title="Portapapeles Global del Sistema"
      >
        <Clipboard size={10} className={isOpen ? "text-orange-400" : "text-slate-500"} />
        <span className="hidden sm:inline">Portapapeles</span>
      </button>

      {/* Floating Clipboard panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 bg-slate-950/95 backdrop-blur-md border border-slate-800/90 rounded-xl shadow-2xl p-4 w-[340px] max-h-[500px] flex flex-col z-[9999] animate-fade-in text-xs font-mono">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
              <span className="font-extrabold tracking-wider text-orange-300 text-[10px] uppercase">PORTAPAPELES GLOBAL</span>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleImportPhysicalClipboard}
                className="p-1 text-slate-400 hover:text-orange-300 hover:bg-slate-900/80 rounded transition cursor-pointer"
                title="Sincronizar del portapapeles físico (Ctrl+C externo)"
              >
                <RefreshCw size={11} />
              </button>
              {clips.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-900/80 rounded transition cursor-pointer"
                  title="Vaciar historial"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>

          {/* New Clip Input Box */}
          <div className="py-2.5 border-b border-slate-800/50 flex flex-col space-y-1.5">
            <textarea
              value={newClipText}
              onChange={(e) => setNewClipText(e.target.value)}
              placeholder="Escribe o pega texto para almacenar..."
              className="w-full h-12 bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500/50 resize-none font-mono"
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddNewClip}
                disabled={!newClipText.trim()}
                className="flex items-center space-x-1 px-2.5 py-1 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/30 text-orange-300 disabled:opacity-40 disabled:hover:bg-orange-600/20 disabled:cursor-not-allowed rounded text-[9.5px] transition cursor-pointer font-bold uppercase"
              >
                <Plus size={9} />
                <span>Guardar Clip</span>
              </button>
            </div>
          </div>

          {/* History Scroll List */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-2.5 space-y-2.5 max-h-[260px]">
            {clips.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-[9px] uppercase tracking-wider">
                Sin elementos en el portapapeles.
              </div>
            ) : (
              clips.map((clip, index) => (
                <div 
                  key={index} 
                  className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded p-2 transition flex flex-col space-y-2 group"
                >
                  {/* Clip Content Text */}
                  <div className="text-[10px] text-slate-300 select-all font-mono whitespace-pre-wrap break-all leading-relaxed max-h-[60px] overflow-y-auto no-scrollbar">
                    {clip}
                  </div>

                  {/* Actions bar */}
                  <div className="flex items-center justify-between border-t border-slate-800/50 pt-1.5 text-[9px]">
                    <div className="flex items-center space-x-1.5">
                      {/* Copy action */}
                      <button
                        onClick={() => handleQuickCopy(clip, index)}
                        className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition cursor-pointer border ${
                          copiedIndex === index
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                        title="Copiar al portapapeles del sistema"
                      >
                        {copiedIndex === index ? <Check size={8} /> : <Copy size={8} />}
                        <span>{copiedIndex === index ? "Copiado!" : "Copiar"}</span>
                      </button>

                      {/* Paste in cursor */}
                      <button
                        onClick={() => handlePasteAtCurrentCursor(clip, index)}
                        className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition cursor-pointer border ${
                          pastedIndex === index
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-slate-950/40 border-slate-850 text-slate-400 hover:text-orange-300 hover:border-orange-500/30"
                        }`}
                        title="Pegar en el cursor de texto enfocado actualmente"
                      >
                        <ArrowDownLeft size={8} />
                        <span>Pegar cursor</span>
                      </button>
                    </div>

                    {/* Delete single item */}
                    <button
                      onClick={(e) => handleDeleteClip(index, e)}
                      className="text-slate-500 hover:text-red-400 p-0.5 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Eliminar clip"
                    >
                      <Trash2 size={9} />
                    </button>
                  </div>

                  {/* Open Apps Destinations Injectors */}
                  {openWindows.length > 0 && (
                    <div className="flex flex-col space-y-1 pt-1 border-t border-slate-850 text-[8.5px]">
                      <div className="text-slate-500 uppercase tracking-wider font-extrabold text-[7.5px] flex items-center space-x-1">
                        <Layers size={7} />
                        <span>Inyectar en Ventana Abierta:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {openWindows.map((win) => (
                          <button
                            key={win.id}
                            onClick={() => handleInjectIntoApp(win.id, clip, index)}
                            className="bg-slate-950/60 hover:bg-orange-500/10 border border-slate-850 hover:border-orange-500/30 rounded px-1.5 py-0.5 text-slate-400 hover:text-orange-300 transition cursor-pointer truncate max-w-[105px]"
                            title={`Inyectar texto directamente en ${win.title}`}
                          >
                            {appNames[win.id] || win.id}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer help tip */}
          <div className="pt-2 border-t border-slate-800/80 text-[8px] text-slate-500 flex items-center justify-between">
            <span className="uppercase font-bold tracking-widest flex items-center space-x-0.5">
              <Sparkles size={8} className="text-orange-400 shrink-0" />
              <span>Sincronización Inteligente OS</span>
            </span>
            <span>Yonah Llanes</span>
          </div>

        </div>
      )}
    </div>
  );
}
