import React, { useState, useEffect } from "react";
import { 
  FileText, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  Plus, Trash2, Play, Save, Download, FileSpreadsheet, BarChart2, 
  Presentation, Layout, ArrowLeft, ChevronLeft, ChevronRight, Eye, Check
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from "recharts";

// Helper to interact with VFS safely
interface VFSNode {
  type: "file" | "dir";
  content?: string;
  children?: { [key: string]: VFSNode };
}

interface EuroOfficeProps {
  vfs: any;
  setVfs: React.Dispatch<React.SetStateAction<any>>;
  triggerNotification?: (text: string, type: "success" | "info") => void;
}

// ==========================================
// 1. EURO WORD - Document Processor
// ==========================================
export function EuroWord({ vfs, setVfs, triggerNotification }: EuroOfficeProps) {
  const [docTitle, setDocTitle] = useState("Sin_Nombre.docx");
  const [docContent, setDocContent] = useState(
    "Bienvenido a Euro Word, el procesador de textos profesional preinstalado en CMineWar OS.\n\nEste entorno de oficina está desarrollado con altos estándares de compatibilidad para soportar edición interactiva, recuentos de caracteres en tiempo real y almacenamiento integrado en el sistema de archivos virtual (VFS).\n\nEmpieza a redactar tus reportes y guárdalos directamente en la ruta /home/user/documentos/"
  );
  
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("left");
  const [savedStatus, setSavedStatus] = useState(false);

  const wordCount = docContent.trim() === "" ? 0 : docContent.trim().split(/\s+/).length;
  const charCount = docContent.length;

  const handleSaveToVfs = () => {
    // Save to /home/user/documentos/docTitle
    try {
      setVfs((prevVfs: any) => {
        const newVfs = JSON.parse(JSON.stringify(prevVfs));
        
        // Ensure path /home/user/documentos exists
        if (!newVfs.children) newVfs.children = {};
        if (!newVfs.children["home"]) newVfs.children["home"] = { type: "dir", children: {} };
        if (!newVfs.children["home"].children["user"]) newVfs.children["home"].children["user"] = { type: "dir", children: {} };
        if (!newVfs.children["home"].children["user"].children["documentos"]) {
          newVfs.children["home"].children["user"].children["documentos"] = { type: "dir", children: {} };
        }
        
        const documentosDir = newVfs.children["home"].children["user"].children["documentos"];
        if (!documentosDir.children) documentosDir.children = {};
        
        documentosDir.children[docTitle] = {
          type: "file",
          content: docContent
        };
        
        return newVfs;
      });

      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 2000);
      if (triggerNotification) {
        triggerNotification(`Documento '${docTitle}' guardado en /home/user/documentos/ con éxito.`, "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([docContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = docTitle.endsWith(".docx") ? docTitle.replace(".docx", ".txt") : docTitle + ".txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    if (triggerNotification) {
      triggerNotification("Documento exportado como texto plano.", "info");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 font-sans h-full select-none overflow-hidden">
      {/* Top Header & Title */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <FileText className="text-blue-500 animate-pulse" size={18} />
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-semibold w-48"
          />
        </div>
        <div className="flex space-x-1.5">
          <button
            onClick={handleSaveToVfs}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-2.5 py-1 rounded text-[10.5px] transition"
          >
            {savedStatus ? <Check size={12} /> : <Save size={12} />}
            <span>{savedStatus ? "Guardado" : "Guardar VFS"}</span>
          </button>
          <button
            onClick={handleExportTxt}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded text-[10.5px] transition"
          >
            <Download size={12} />
            <span>Exportar TXT</span>
          </button>
        </div>
      </div>

      {/* Editor Word-style Formatting Toolbar */}
      <div className="bg-slate-950/40 border-b border-slate-800 px-4 py-1.5 flex items-center space-x-3 text-xs overflow-x-auto shrink-0">
        <div className="flex items-center space-x-1 border-r border-slate-800 pr-3">
          <button 
            onClick={() => setIsBold(!isBold)}
            className={`p-1 rounded hover:bg-slate-800 transition ${isBold ? "bg-blue-600 text-white font-bold" : "text-slate-400"}`}
            title="Negrita"
          >
            <Bold size={13} />
          </button>
          <button 
            onClick={() => setIsItalic(!isItalic)}
            className={`p-1 rounded hover:bg-slate-800 transition ${isItalic ? "bg-blue-600 text-white italic" : "text-slate-400"}`}
            title="Cursiva"
          >
            <Italic size={13} />
          </button>
          <button 
            onClick={() => setIsUnderline(!isUnderline)}
            className={`p-1 rounded hover:bg-slate-800 transition ${isUnderline ? "bg-blue-600 text-white underline" : "text-slate-400"}`}
            title="Subrayado"
          >
            <Underline size={13} />
          </button>
        </div>

        <div className="flex items-center space-x-1 border-r border-slate-800 pr-3">
          <button 
            onClick={() => setAlignment("left")}
            className={`p-1 rounded hover:bg-slate-800 transition ${alignment === "left" ? "bg-slate-800 text-blue-400" : "text-slate-400"}`}
            title="Alinear Izquierda"
          >
            <AlignLeft size={13} />
          </button>
          <button 
            onClick={() => setAlignment("center")}
            className={`p-1 rounded hover:bg-slate-800 transition ${alignment === "center" ? "bg-slate-800 text-blue-400" : "text-slate-400"}`}
            title="Centrar"
          >
            <AlignCenter size={13} />
          </button>
          <button 
            onClick={() => setAlignment("right")}
            className={`p-1 rounded hover:bg-slate-800 transition ${alignment === "right" ? "bg-slate-800 text-blue-400" : "text-slate-400"}`}
            title="Alinear Derecha"
          >
            <AlignRight size={13} />
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono hidden sm:inline">
          Formato: Rich Simulated Textarea
        </div>
      </div>

      {/* Editor Sheet Canvas Area */}
      <div className="flex-1 bg-slate-950 p-4 overflow-y-auto flex justify-center">
        <div className="bg-white text-slate-900 w-full max-w-2xl min-h-[400px] h-fit p-8 shadow-2xl rounded-sm border border-slate-200 transition-all flex flex-col">
          <textarea
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            className={`flex-1 w-full bg-transparent focus:outline-none resize-none font-sans text-sm min-h-[350px] ${
              isBold ? "font-bold" : ""
            } ${
              isItalic ? "italic" : ""
            } ${
              isUnderline ? "underline" : ""
            } ${
              alignment === "center" ? "text-center" : alignment === "right" ? "text-right" : "text-left"
            }`}
            placeholder="Comienza a redactar tu reporte oficial aquí..."
            style={{ color: "#0f172a", caretColor: "#3b82f6" }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-1.5 flex justify-between items-center text-[10px] font-mono text-slate-500 shrink-0">
        <div className="flex space-x-4">
          <span>Palabras: <strong className="text-slate-350">{wordCount}</strong></span>
          <span>Caracteres: <strong className="text-slate-350">{charCount}</strong></span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
          <span>Euro Office Word v2.1 (Español)</span>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// 2. EURO CALC - Spreadsheet Processor & Charting
// ==========================================
export function EuroCalc({ vfs, setVfs, triggerNotification }: EuroOfficeProps) {
  const [sheetName, setSheetName] = useState("Estadisticas_Red.xlsx");
  const [activeCell, setActiveCell] = useState("A1");
  const [formulaValue, setFormulaValue] = useState("");
  
  // Initial 8x6 grid
  const cols = ["A", "B", "C", "D", "E", "F"];
  const rows = [1, 2, 3, 4, 5, 6, 7, 8];

  const [gridData, setGridData] = useState<{ [key: string]: string }>({
    "A1": "Módulo", "B1": "Velocidad (Mbps)", "C1": "Latencia (ms)", "D1": "Carga CPU (%)",
    "A2": "Servidor", "B2": "850", "C2": "12", "D2": "14",
    "A3": "Cliente 1", "B3": "420", "C3": "18", "D3": "22",
    "A4": "Cliente 2", "B4": "550", "C4": "14", "D4": "19",
    "A5": "Nodo local", "B5": "910", "C5": "8", "D5": "8",
    "A6": "Gateway", "B6": "310", "C6": "25", "D6": "45",
    "A7": "Promedio", "B7": "SUM(B2:B6)", "C7": "AVG(C2:C6)", "D7": "AVG(D2:D6)",
  });

  const getCellValue = (cellId: string): string => {
    const rawVal = gridData[cellId] || "";
    if (rawVal.startsWith("SUM(")) {
      // Evaluate basic sum SUM(X2:X6)
      const match = rawVal.match(/SUM\((\w+):(\w+)\)/);
      if (match) {
        const startCell = match[1];
        const endCell = match[2];
        const startCol = startCell.charAt(0);
        const startRow = parseInt(startCell.slice(1));
        const endRow = parseInt(endCell.slice(1));
        
        let sum = 0;
        for (let r = startRow; r <= endRow; r++) {
          const val = parseFloat(gridData[`${startCol}${r}`] || "0");
          if (!isNaN(val)) sum += val;
        }
        return sum.toFixed(0);
      }
    } else if (rawVal.startsWith("AVG(")) {
      // Evaluate basic average AVG(X2:X6)
      const match = rawVal.match(/AVG\((\w+):(\w+)\)/);
      if (match) {
        const startCell = match[1];
        const endCell = match[2];
        const startCol = startCell.charAt(0);
        const startRow = parseInt(startCell.slice(1));
        const endRow = parseInt(endCell.slice(1));
        
        let sum = 0;
        let count = 0;
        for (let r = startRow; r <= endRow; r++) {
          const val = parseFloat(gridData[`${startCol}${r}`] || "0");
          if (!isNaN(val)) {
            sum += val;
            count++;
          }
        }
        return count > 0 ? (sum / count).toFixed(1) : "0";
      }
    }
    return rawVal;
  };

  useEffect(() => {
    setFormulaValue(gridData[activeCell] || "");
  }, [activeCell]);

  const handleCellChange = (cellId: string, val: string) => {
    setGridData(prev => ({ ...prev, [cellId]: val }));
    if (activeCell === cellId) {
      setFormulaValue(val);
    }
  };

  const handleFormulaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGridData(prev => ({ ...prev, [activeCell]: formulaValue }));
  };

  // Convert current grid data into recharts compatible array
  const chartData = [2, 3, 4, 5, 6].map(rowNum => {
    return {
      name: getCellValue(`A${rowNum}`) || `Fila ${rowNum}`,
      Velocidad: parseFloat(getCellValue(`B${rowNum}`) || "0"),
      Latencia: parseFloat(getCellValue(`C${rowNum}`) || "0"),
      Carga: parseFloat(getCellValue(`D${rowNum}`) || "0"),
    };
  });

  const handleSaveToVfs = () => {
    try {
      setVfs((prevVfs: any) => {
        const newVfs = JSON.parse(JSON.stringify(prevVfs));
        
        if (!newVfs.children) newVfs.children = {};
        if (!newVfs.children["home"]) newVfs.children["home"] = { type: "dir", children: {} };
        if (!newVfs.children["home"].children["user"]) newVfs.children["home"].children["user"] = { type: "dir", children: {} };
        if (!newVfs.children["home"].children["user"].children["documentos"]) {
          newVfs.children["home"].children["user"].children["documentos"] = { type: "dir", children: {} };
        }
        
        const documentosDir = newVfs.children["home"].children["user"].children["documentos"];
        if (!documentosDir.children) documentosDir.children = {};
        
        documentosDir.children[sheetName] = {
          type: "file",
          content: JSON.stringify(gridData, null, 2)
        };
        
        return newVfs;
      });

      if (triggerNotification) {
        triggerNotification(`Hoja de cálculo '${sheetName}' guardada en /home/user/documentos/`, "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 font-sans h-full select-none overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <FileSpreadsheet className="text-emerald-500 animate-pulse" size={18} />
          <input
            type="text"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold w-48"
          />
        </div>
        <button
          onClick={handleSaveToVfs}
          className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded text-[10.5px] transition"
        >
          <Save size={12} />
          <span>Guardar VFS</span>
        </button>
      </div>

      {/* Formula Bar */}
      <form onSubmit={handleFormulaSubmit} className="bg-slate-950/50 border-b border-slate-800 px-4 py-1.5 flex items-center space-x-2 text-xs shrink-0">
        <div className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold font-mono">
          {activeCell}
        </div>
        <div className="text-slate-500 font-mono font-bold">fx</div>
        <input
          type="text"
          value={formulaValue}
          onChange={(e) => setFormulaValue(e.target.value)}
          onBlur={() => handleCellChange(activeCell, formulaValue)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-0.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
          placeholder="Escribe un valor o fórmula (ej. SUM(B2:B6) o AVG(C2:C6))"
        />
        <button type="submit" className="hidden" />
      </form>

      {/* Spreadsheet grid + Live Chart split area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
        
        {/* Spreadsheet Editor */}
        <div className="lg:col-span-7 border-r border-slate-800 flex flex-col overflow-auto min-h-0 bg-slate-950/20">
          <table className="w-full text-left border-collapse font-mono text-[11px]">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="w-10 p-1.5 text-center border-r border-slate-800 select-none bg-slate-950"></th>
                {cols.map(c => (
                  <th key={c} className="p-1.5 text-center border-r border-slate-800 select-none bg-slate-950 font-bold min-w-[100px]">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r} className="border-b border-slate-800/60 hover:bg-slate-900/10">
                  <td className="bg-slate-950 text-slate-400 p-1.5 text-center font-bold border-r border-slate-800 select-none">{r}</td>
                  {cols.map(c => {
                    const cellId = `${c}${r}`;
                    const isSelected = activeCell === cellId;
                    const renderedVal = getCellValue(cellId);
                    
                    return (
                      <td 
                        key={c} 
                        onClick={() => setActiveCell(cellId)}
                        className={`p-1 border-r border-slate-800/60 cursor-pointer relative ${
                          isSelected ? "bg-emerald-500/10 outline outline-1 outline-emerald-500" : ""
                        }`}
                      >
                        <input
                          type="text"
                          value={isSelected ? formulaValue : renderedVal}
                          onChange={(e) => handleCellChange(cellId, e.target.value)}
                          className="w-full bg-transparent focus:outline-none border-none p-0 text-slate-200 select-text"
                          style={{ minHeight: "18px" }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Charting */}
        <div className="lg:col-span-5 p-4 flex flex-col space-y-3 bg-slate-950/40 overflow-y-auto">
          <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-400">
            <BarChart2 size={14} />
            <span>Gráfico en Vivo (Velocidad Mbps por Módulo)</span>
          </div>
          
          <div className="w-full h-56 bg-slate-950/80 border border-slate-800 rounded-xl p-2 shadow-inner shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px", fontSize: "10px" }} 
                  labelStyle={{ fontWeight: "bold", color: "#10b981" }}
                />
                <Bar dataKey="Velocidad" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-[10px] space-y-1.5 leading-relaxed">
            <p className="font-bold text-slate-300">💡 Instrucciones de Automatización:</p>
            <p className="text-slate-500">
              Modifica los valores de velocidad en la columna <strong className="text-emerald-400">B (B2 a B6)</strong> y el gráfico de barras dinámico de Recharts se actualizará instantáneamente. Las fórmulas dinámicas como <code className="text-slate-300">SUM(...)</code> o <code className="text-slate-300">AVG(...)</code> en la fila 7 recalcularán los totales al vuelo.
            </p>
          </div>
        </div>

      </div>

      {/* Footer status bar */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-1.5 flex justify-between items-center text-[10px] font-mono text-slate-500 shrink-0">
        <span>Fila activa: <strong className="text-emerald-400">{activeCell}</strong></span>
        <span>Euro Office Calc v1.8 (Compatible Excel)</span>
      </div>
    </div>
  );
}


// ==========================================
// 3. EURO SLIDE - Presentation Maker
// ==========================================
export function EuroSlide({ vfs, setVfs, triggerNotification }: EuroOfficeProps) {
  const [presName, setPresName] = useState("Arquitectura_C_Rust_Assembly.pptx");
  const [slides, setSlides] = useState([
    { id: 1, title: "CMineWar OS: Núcleo C, Rust & Assembly", content: "• Desarrollado bajo una arquitectura híbrida de C estructurado, Assembly nativo y Rust seguro.\n• Demonios de red compilados de baja sobrecarga para rendimiento extremo de RAM y CPU.\n• Enlaces nativos de kernel y controladores asíncronos para hardware Legacy/UEFI." },
    { id: 2, title: "Compatibilidad UEFI / Legacy BIOS", content: "• Soporte completo para GPT con Secure Boot y Shim firmado de Microsoft.\n• Sector MBR protector y cilindros de arranque alineados de forma adaptativa.\n• Autodetector inteligente de host (Auto-Sense HW) compatible con placas antiguas." },
    { id: 3, title: "Gestor de Paquetes .deb Nativo", content: "• Instalador integrado compatible con binarios compendiados en clúster Debian.\n• Integración directa con el lanzador y barra de tareas instantánea.\n• Despliegue de suites preinstaladas como Euro Office." }
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slideTitle, setSlideTitle] = useState("");
  const [slideContent, setSlideContent] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (slides[activeSlideIndex]) {
      setSlideTitle(slides[activeSlideIndex].title);
      setSlideContent(slides[activeSlideIndex].content);
    }
  }, [activeSlideIndex, slides]);

  const handleUpdateSlide = (title: string, content: string) => {
    setSlideTitle(title);
    setSlideContent(content);
    setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? { ...s, title, content } : s));
  };

  const handleAddSlide = () => {
    const newSlideId = slides.length > 0 ? Math.max(...slides.map(s => s.id)) + 1 : 1;
    const newSlide = {
      id: newSlideId,
      title: "Nueva Diapositiva",
      content: "• Escribe el contenido de tu diapositiva aquí..."
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
    if (triggerNotification) {
      triggerNotification("Nueva diapositiva añadida.", "info");
    }
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) {
      if (triggerNotification) {
        triggerNotification("No puedes borrar la última diapositiva restante.", "info");
      }
      return;
    }
    const filtered = slides.filter((_, i) => i !== activeSlideIndex);
    setSlides(filtered);
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
    if (triggerNotification) {
      triggerNotification("Diapositiva eliminada con éxito.", "success");
    }
  };

  const handleSaveToVfs = () => {
    try {
      setVfs((prevVfs: any) => {
        const newVfs = JSON.parse(JSON.stringify(prevVfs));
        
        if (!newVfs.children) newVfs.children = {};
        if (!newVfs.children["home"]) newVfs.children["home"] = { type: "dir", children: {} };
        if (!newVfs.children["home"].children["user"]) newVfs.children["home"].children["user"] = { type: "dir", children: {} };
        if (!newVfs.children["home"].children["user"].children["documentos"]) {
          newVfs.children["home"].children["user"].children["documentos"] = { type: "dir", children: {} };
        }
        
        const documentosDir = newVfs.children["home"].children["user"].children["documentos"];
        if (!documentosDir.children) documentosDir.children = {};
        
        documentosDir.children[presName] = {
          type: "file",
          content: JSON.stringify(slides, null, 2)
        };
        
        return newVfs;
      });

      if (triggerNotification) {
        triggerNotification(`Presentación '${presName}' guardada en /home/user/documentos/`, "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 font-sans h-full select-none overflow-hidden">
      
      {/* Fullscreen slideshow view */}
      {isPlaying && (
        <div className="absolute inset-0 z-[99999] bg-slate-950 flex flex-col justify-between p-8 animate-fade-in select-none">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest">SALA DE PRESENTACIONES EURO SLIDE</span>
            <button 
              onClick={() => setIsPlaying(false)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition flex items-center space-x-1"
            >
              <ArrowLeft size={12} />
              <span>Salir de Presentación</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-6 px-12 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-8">
              {slides[activeSlideIndex]?.title}
            </h2>
            <div className="text-slate-300 text-lg leading-relaxed text-left whitespace-pre-wrap max-w-2xl bg-slate-900/60 p-8 border border-slate-800/80 rounded-2xl shadow-2xl">
              {slides[activeSlideIndex]?.content}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-800 pt-3 text-xs font-mono text-slate-500">
            <div className="flex space-x-2">
              <button 
                onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                disabled={activeSlideIndex === 0}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={() => setActiveSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                disabled={activeSlideIndex === slides.length - 1}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded disabled:opacity-40 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <span>Diapositiva {activeSlideIndex + 1} de {slides.length}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <Presentation className="text-amber-500 animate-pulse" size={18} />
          <input
            type="text"
            value={presName}
            onChange={(e) => setPresName(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold w-48"
          />
        </div>
        <div className="flex space-x-1.5">
          <button
            onClick={() => setIsPlaying(true)}
            className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-2.5 py-1 rounded text-[10.5px] transition"
          >
            <Play size={12} />
            <span>Presentar</span>
          </button>
          <button
            onClick={handleSaveToVfs}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded text-[10.5px] transition"
          >
            <Save size={12} />
            <span>Guardar VFS</span>
          </button>
        </div>
      </div>

      {/* Content split Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left slide picker sidebar */}
        <div className="w-48 bg-slate-950/60 border-r border-slate-800/80 p-3 flex flex-col space-y-2 overflow-y-auto shrink-0 select-none">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-800/50 pb-2">
            <span>DIAPOSITIVAS</span>
            <button 
              onClick={handleAddSlide}
              className="p-1 hover:bg-slate-800 text-amber-400 rounded transition"
              title="Añadir Diapositiva"
            >
              <Plus size={11} />
            </button>
          </div>

          {slides.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setActiveSlideIndex(i)}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex flex-col space-y-1 ${
                activeSlideIndex === i
                  ? "bg-amber-600/10 border-amber-500/50 text-amber-300 font-semibold"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="text-[9.5px] font-mono text-slate-500">#{i + 1} Slide</div>
              <div className="text-[10px] truncate max-w-full font-sans leading-snug">{s.title || "Sin título"}</div>
            </div>
          ))}
        </div>

        {/* Center active slide canvas + editor */}
        <div className="flex-1 flex flex-col bg-slate-950 p-4 overflow-y-auto min-h-0 space-y-4">
          
          {/* Virtual Slide Canvas layout */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-2xl relative w-full max-w-xl mx-auto flex flex-col justify-center min-h-[220px] shrink-0 border-b-slate-700/60">
            <span className="absolute top-2.5 right-3.5 text-[8.5px] font-mono text-slate-600 uppercase tracking-widest">DIAPOSITIVA ACTIVA</span>
            <div className="text-center space-y-4">
              <h3 className="text-lg font-bold text-white tracking-tight">{slideTitle || "Escribe un Título..."}</h3>
              <p className="text-xs text-slate-350 leading-relaxed max-w-md mx-auto whitespace-pre-wrap text-left bg-slate-950/40 p-4 border border-slate-800/40 rounded-lg shadow-inner">
                {slideContent || "Escribe el contenido viñeteado aquí..."}
              </p>
            </div>
          </div>

          {/* Quick Editing Box */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 w-full max-w-xl mx-auto space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-amber-400">
              <div className="flex items-center space-x-1">
                <Layout size={13} />
                <span>Panel de Edición</span>
              </div>
              <button 
                onClick={handleDeleteSlide}
                className="text-rose-400 hover:text-rose-300 flex items-center space-x-0.5 text-[10px] bg-rose-500/10 hover:bg-rose-500/20 px-1.5 py-0.5 rounded transition"
                title="Eliminar Diapositiva"
              >
                <Trash2 size={10} />
                <span>Borrar Diapositiva</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col space-y-1">
                <label className="text-[9.5px] font-mono text-slate-500 uppercase font-semibold">Título de Diapositiva</label>
                <input
                  type="text"
                  value={slideTitle}
                  onChange={(e) => handleUpdateSlide(e.target.value, slideContent)}
                  className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold w-full"
                  placeholder="Introduce el título principal..."
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[9.5px] font-mono text-slate-500 uppercase font-semibold">Contenido Viñeteado</label>
                <textarea
                  value={slideContent}
                  onChange={(e) => handleUpdateSlide(slideTitle, e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono w-full h-24 resize-none leading-relaxed"
                  placeholder="Introduce las viñetas (ej: • Característica 1)..."
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Footer status bar */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-1.5 flex justify-between items-center text-[10px] font-mono text-slate-500 shrink-0">
        <span>Número: <strong className="text-amber-400">{activeSlideIndex + 1} / {slides.length}</strong></span>
        <span>Euro Office Slide v2.1</span>
      </div>
    </div>
  );
}

// Proyecto propiedad de Yonah Llanes
