import React, { useState, useEffect, useRef } from "react";
import { VFSNode } from "../types";
import { setNodeAtPath } from "../vfs";
import { 
  Save, 
  FolderOpen, 
  FileCode, 
  CheckCircle, 
  Plus, 
  Scissors, 
  Copy, 
  Clipboard, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Search, 
  X, 
  Settings, 
  HelpCircle,
  FileText,
  ChevronDown
} from "lucide-react";

interface NotepadPlusPlusTab {
  id: string;
  name: string;
  path: string[];
  content: string;
  isDirty: boolean;
}

interface TextEditorProps {
  vfs: VFSNode;
  setVfs: (newVfs: VFSNode) => void;
  openFilePath: string[] | null;
  openFileName: string | null;
  openFileContent: string | null;
  setOpenFile: (path: string[] | null, name: string | null, content: string | null) => void;
}

export default function TextEditor({
  vfs,
  setVfs,
  openFilePath,
  openFileName,
  openFileContent,
  setOpenFile,
}: TextEditorProps) {
  // Tabs state inside Notepad++
  const [tabs, setTabs] = useState<NotepadPlusPlusTab[]>([
    { id: "scratch-1", name: "nuevo 1", path: ["home", "user"], content: "", isDirty: false }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("scratch-1");

  // Editor states
  const [editorText, setEditorText] = useState("");
  const [fileNameInput, setFileNameInput] = useState("");
  const [zoomFactor, setZoomFactor] = useState(13); // font size in px
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Status metrics
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [language, setLanguage] = useState("Normal text file");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize when a file is opened externally (e.g., from FileManager double click)
  useEffect(() => {
    if (openFileName) {
      const tabId = `file-${openFilePath ? openFilePath.join("-") : ""}-${openFileName}`;
      
      setTabs(prev => {
        const exists = prev.find(t => t.id === tabId);
        if (exists) {
          return prev;
        } else {
          // Add as new tab
          return [
            ...prev,
            {
              id: tabId,
              name: openFileName,
              path: openFilePath || ["home", "user"],
              content: openFileContent || "",
              isDirty: false
            }
          ];
        }
      });
      setActiveTabId(tabId);
    }
  }, [openFileName, openFileContent, openFilePath]);

  // Handle active tab switches
  const handleTabSelect = (tabId: string) => {
    // Save current active tab content to state before switching
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        return { ...t, content: editorText };
      }
      return t;
    }));

    const targetTab = tabs.find(t => t.id === tabId);
    if (targetTab) {
      setActiveTabId(tabId);
      setEditorText(targetTab.content);
      setFileNameInput(targetTab.name);
      
      // Update external state
      if (targetTab.id.startsWith("file-")) {
        setOpenFile(targetTab.path, targetTab.name, targetTab.content);
      } else {
        setOpenFile(null, null, null);
      }
    }
  };

  // Keep editorText and active tab content synchronized on change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditorText(val);
    
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        return { ...t, content: val, isDirty: true };
      }
      return t;
    }));

    // Detect language simply based on file extension
    updateLanguage(fileNameInput);
  };

  const updateLanguage = (name: string) => {
    if (name.endsWith(".json")) setLanguage("JSON file");
    else if (name.endsWith(".js")) setLanguage("JavaScript file");
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) setLanguage("TypeScript source file");
    else if (name.endsWith(".html") || name.endsWith(".htm")) setLanguage("Hyper Text Markup Language");
    else if (name.endsWith(".css")) setLanguage("Cascading Style Sheets");
    else if (name.endsWith(".md")) setLanguage("Markdown document");
    else if (name.endsWith(".sh")) setLanguage("Bash Shell Script");
    else setLanguage("Normal text file");
  };

  // Close tab
  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (tabs.length === 1) {
      // Keep at least one tab
      const newScratchId = `scratch-${Date.now()}`;
      setTabs([{ id: newScratchId, name: "nuevo 1", path: ["home", "user"], content: "", isDirty: false }]);
      setActiveTabId(newScratchId);
      setEditorText("");
      setFileNameInput("nuevo 1");
      setOpenFile(null, null, null);
      return;
    }

    const currentIdx = tabs.findIndex(t => t.id === tabId);
    const updatedTabs = tabs.filter(t => t.id !== tabId);
    setTabs(updatedTabs);

    if (activeTabId === tabId) {
      const nextActiveIdx = Math.max(0, currentIdx - 1);
      const nextTab = updatedTabs[nextActiveIdx];
      setActiveTabId(nextTab.id);
      setEditorText(nextTab.content);
      setFileNameInput(nextTab.name);

      if (nextTab.id.startsWith("file-")) {
        setOpenFile(nextTab.path, nextTab.name, nextTab.content);
      } else {
        setOpenFile(null, null, null);
      }
    }
  };

  // Create a new Notepad++ document tab
  const handleNewTab = () => {
    const num = tabs.filter(t => t.name.startsWith("nuevo")).length + 1;
    const newId = `scratch-${Date.now()}`;
    const newTabObj = {
      id: newId,
      name: `nuevo ${num}`,
      path: ["home", "user"],
      content: "",
      isDirty: false
    };

    setTabs([...tabs, newTabObj]);
    setActiveTabId(newId);
    setEditorText("");
    setFileNameInput(`nuevo ${num}`);
    setOpenFile(null, null, null);
  };

  // Save active document
  const handleSave = () => {
    if (!fileNameInput.trim()) {
      alert("Por favor ingrese un nombre de archivo válido.");
      return;
    }

    const activeTabObj = tabs.find(t => t.id === activeTabId);
    if (!activeTabObj) return;

    const targetPath = activeTabObj.path || ["home", "user"];
    const fileId = fileNameInput.trim();

    const updatedNode: VFSNode = {
      name: fileId,
      type: "file",
      content: editorText,
    };

    const updatedVfs = setNodeAtPath(vfs, targetPath, fileId, updatedNode);
    setVfs(updatedVfs);

    // Update active tab status
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        return { 
          ...t, 
          name: fileId, 
          id: `file-${targetPath.join("-")}-${fileId}`, 
          isDirty: false 
        };
      }
      return t;
    }));
    
    // Change active tab ID to the saved file ID
    const newSavedId = `file-${targetPath.join("-")}-${fileId}`;
    setActiveTabId(newSavedId);

    // Update external open file status
    setOpenFile(targetPath, fileId, editorText);

    // Visual Toast confirmation
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 2000);
  };

  // Track cursor position in Notepad++ style
  const handleCursorMove = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const textUpToCursor = el.value.substring(0, el.selectionStart);
    const lines = textUpToCursor.split("\n");
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    setCursorPos({ line, col });
  };

  // Helper to trigger menu actions
  const triggerMenuAction = (action: string) => {
    setActiveMenu(null);
    switch (action) {
      case "new":
        handleNewTab();
        break;
      case "save":
        handleSave();
        break;
      case "close":
        handleCloseTab(activeTabId, { stopPropagation: () => {} } as any);
        break;
      case "copy":
        if (textareaRef.current) {
          textareaRef.current.select();
          document.execCommand("copy");
        }
        break;
      case "zoom-in":
        setZoomFactor(z => Math.min(24, z + 1));
        break;
      case "zoom-out":
        setZoomFactor(z => Math.max(9, z - 1));
        break;
      case "clear":
        setEditorText("");
        break;
      default:
        break;
    }
  };

  // Close menus when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#f0f0f0] text-slate-800 font-sans select-none h-full border border-slate-350" id="notepad-container">
      
      {/* 1. App Header with Chameleon Logo & App Name */}
      <div className="bg-slate-200 border-b border-slate-300 p-1.5 flex items-center justify-between select-none">
        <div className="flex items-center space-x-2">
          {/* Notepad++ Green Chameleon Representation */}
          <div className="w-5 h-5 bg-gradient-to-br from-lime-500 to-emerald-600 rounded flex items-center justify-center shadow-inner border border-lime-400/40">
            <FileCode size={12} className="text-white animate-pulse" />
          </div>
          <span className="text-xs font-bold text-slate-800 font-mono tracking-tight flex items-center space-x-1">
            <span>Notepad++ v8.6.2</span>
            <span className="text-[9px] font-normal bg-slate-300 px-1 py-0.2 rounded text-slate-600">GPL</span>
          </span>
        </div>

        {/* Dynamic breadcrumb */}
        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
          {tabs.find(t => t.id === activeTabId)?.isDirty ? "● modificado" : "✓ guardado"}
        </span>
      </div>

      {/* 2. Classic File/Edit Menu Bar */}
      <div className="bg-slate-100 border-b border-slate-200 text-xs px-2 flex items-center space-x-1 select-none py-0.5 relative z-50">
        {[
          { 
            label: "Archivo", 
            items: [
              { label: "Nuevo (Ctrl+N)", action: "new" },
              { label: "Guardar (Ctrl+S)", action: "save" },
              { label: "Cerrar archivo", action: "close" }
            ] 
          },
          { 
            label: "Editar", 
            items: [
              { label: "Seleccionar todo", action: "copy" },
              { label: "Limpiar pantalla", action: "clear" }
            ] 
          },
          { 
            label: "Ver", 
            items: [
              { label: "Acercar Zoom (+)", action: "zoom-in" },
              { label: "Alejar Zoom (-)", action: "zoom-out" }
            ] 
          },
          { 
            label: "Lenguaje", 
            items: [
              { label: "Texto Plano", action: "plain" },
              { label: "Estilo Código", action: "code" }
            ] 
          },
          { 
            label: "Herramientas", 
            items: [
              { label: "Preferencias...", action: "prefs" }
            ] 
          },
        ].map((menu) => (
          <div key={menu.label} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === menu.label ? null : menu.label);
              }}
              className={`px-2.5 py-1 hover:bg-slate-200 rounded text-slate-700 transition font-medium ${
                activeMenu === menu.label ? "bg-slate-200 text-slate-900" : ""
              }`}
            >
              {menu.label}
            </button>

            {activeMenu === menu.label && (
              <div className="absolute left-0 mt-0.5 w-44 bg-white border border-slate-300 shadow-lg rounded py-1 z-50 text-xs text-slate-700 font-sans">
                {menu.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => triggerMenuAction(item.action)}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition flex justify-between items-center"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Tiny Action Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-1 flex items-center space-x-1 shrink-0 select-none">
        <button 
          onClick={handleNewTab} 
          className="p-1 hover:bg-slate-200 border border-transparent hover:border-slate-300 rounded text-slate-600" 
          title="Nuevo Documento"
        >
          <Plus size={13} className="text-emerald-600" />
        </button>
        <button 
          onClick={handleSave} 
          className="p-1 hover:bg-slate-200 border border-transparent hover:border-slate-300 rounded text-slate-600" 
          title="Guardar"
        >
          <Save size={13} className="text-blue-600" />
        </button>
        <div className="h-4.5 w-px bg-slate-250 mx-1" />
        <button 
          onClick={() => triggerMenuAction("zoom-in")} 
          className="p-1 hover:bg-slate-200 border border-transparent hover:border-slate-300 rounded text-slate-600" 
          title="Zoom In"
        >
          <ZoomIn size={13} />
        </button>
        <button 
          onClick={() => triggerMenuAction("zoom-out")} 
          className="p-1 hover:bg-slate-200 border border-transparent hover:border-slate-300 rounded text-slate-600" 
          title="Zoom Out"
        >
          <ZoomOut size={13} />
        </button>
        <div className="h-4.5 w-px bg-slate-250 mx-1" />
        <button 
          onClick={() => triggerMenuAction("copy")} 
          className="p-1 hover:bg-slate-200 border border-transparent hover:border-slate-300 rounded text-slate-600 text-slate-400" 
          title="Seleccionar todo"
        >
          <Copy size={13} />
        </button>
        <button 
          onClick={() => triggerMenuAction("clear")} 
          className="p-1 hover:bg-slate-200 border border-transparent hover:border-slate-300 rounded text-slate-600 text-rose-500" 
          title="Limpiar"
        >
          <X size={13} />
        </button>

        {/* Path input bar */}
        <div className="flex-1 flex items-center ml-4 space-x-1.5 bg-slate-100 border border-slate-250 px-2 py-0.5 rounded max-w-md">
          <span className="text-[10px] text-slate-400 font-mono">Nombre:</span>
          <input
            type="text"
            value={fileNameInput}
            onChange={(e) => {
              const val = e.target.value;
              setFileNameInput(val);
              setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, name: val } : t));
            }}
            className="flex-1 bg-transparent border-none outline-none text-[10px] font-mono text-slate-700 focus:ring-0 p-0"
            placeholder="archivo.txt"
          />
        </div>
      </div>

      {/* 4. Document Tabs Bar (Classic Notepad++ Tab Deck) */}
      <div className="bg-slate-200 px-1 border-b border-slate-300 flex items-end select-none min-h-7 space-x-0.5 overflow-x-auto scrollbar-thin">
        {tabs.map((t) => {
          const isActive = t.id === activeTabId;
          return (
            <div
              key={t.id}
              onClick={() => handleTabSelect(t.id)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-t border-t border-x text-[10px] font-medium cursor-pointer transition-all ${
                isActive 
                  ? "bg-white border-slate-350 text-slate-800 font-bold z-10 translate-y-px" 
                  : "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {/* Retro red disk icon if modified, blue disk icon if saved */}
              <div className={`w-2.5 h-2.5 rounded-sm flex items-center justify-center text-[7px] font-bold text-white shadow-sm ${
                t.isDirty ? "bg-rose-500 animate-pulse" : "bg-blue-600"
              }`} title={t.isDirty ? "Modificado sin guardar" : "Guardado"}>
                {t.isDirty ? "!" : "H"}
              </div>

              <span className="truncate max-w-[90px] font-mono">{t.name}</span>
              
              <button
                onClick={(e) => handleCloseTab(t.id, e)}
                className="w-3.5 h-3.5 rounded-full hover:bg-rose-500 hover:text-white flex items-center justify-center text-[8px] transition"
                title="Cerrar pestaña"
              >
                ×
              </button>
            </div>
          );
        })}

        {/* Plus tab button */}
        <button
          onClick={handleNewTab}
          className="px-2 py-1 rounded-t hover:bg-slate-300 text-slate-600 font-bold text-[11px] mb-0.5 self-end"
          title="Nueva pestaña"
        >
          +
        </button>
      </div>

      {/* 5. Notepad++ Editor Canvas with Line Numbers */}
      <div className="flex-1 flex overflow-hidden bg-white relative">
        {/* Line Gutter */}
        <div className="bg-slate-100 border-r border-slate-300 text-slate-400 font-mono text-right select-none pr-2.5 pl-1 py-4 text-xs select-none w-11 flex flex-col leading-relaxed space-y-0.2 select-none shrink-0">
          {Array.from({ length: Math.max(1, editorText.split("\n").length) }).map((_, idx) => (
            <div key={idx} className="text-[11px] select-none h-[18px]">
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Text Area Canvas */}
        <textarea
          ref={textareaRef}
          value={editorText}
          onChange={handleTextChange}
          onKeyUp={handleCursorMove}
          onMouseUp={handleCursorMove}
          style={{ fontSize: `${zoomFactor}px` }}
          className="flex-1 p-4 pt-4 outline-none resize-none leading-relaxed bg-[#fbfbfb] text-slate-800 font-mono focus:ring-0 border-none w-full h-full min-h-0 overflow-y-auto selection:bg-blue-200"
          placeholder="; Escribe tus códigos, scripts o notas en Notepad++..."
          id="notepad-textarea"
        />

        {/* Floating Saved Toast Indicator */}
        {showSavedToast && (
          <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded shadow-lg flex items-center space-x-2 animate-fade-in z-[100]">
            <CheckCircle size={13} className="text-white" />
            <span>Documento guardado en el VFS</span>
          </div>
        )}
      </div>

      {/* 6. Authentic Notepad++ Green/Blue Status Bar */}
      <div className="bg-slate-150 border-t border-slate-300 text-[10.5px] font-sans text-slate-600 grid grid-cols-12 select-none divide-x divide-slate-300 shrink-0">
        <div className="col-span-3 px-2 py-1 truncate flex items-center space-x-1.5 text-slate-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
          <span>{language}</span>
        </div>
        <div className="col-span-3 px-2 py-1 text-center truncate">
          Length: <span className="font-semibold text-slate-800">{editorText.length}</span>   Lines: <span className="font-semibold text-slate-800">{editorText.split("\n").length}</span>
        </div>
        <div className="col-span-3 px-2 py-1 text-center truncate">
          Ln: <span className="font-semibold text-slate-800">{cursorPos.line}</span>   Col: <span className="font-semibold text-slate-800">{cursorPos.col}</span>   Sel: <span className="font-semibold text-slate-800">0</span>
        </div>
        <div className="col-span-1 px-1 py-1 text-center truncate">
          Windows (CRLF)
        </div>
        <div className="col-span-1 px-1 py-1 text-center truncate">
          UTF-8
        </div>
        <div className="col-span-1 px-1 py-1 text-center bg-slate-200 text-slate-700 font-bold truncate">
          INS
        </div>
      </div>

    </div>
  );
}

// Proyecto propiedad de Yonah Llanes
