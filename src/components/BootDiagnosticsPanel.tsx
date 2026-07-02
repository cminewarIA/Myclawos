import React, { useState, useEffect } from "react";
import { Activity, RefreshCw, Terminal, Search, AlertTriangle, ShieldCheck, Download, CheckCircle } from "lucide-react";
import { cminewarFetch } from "../utils/api";
import { VERSION } from "../version";

interface BootDiagnosticsPanelProps {
  isRealHost?: boolean;
}

export default function BootDiagnosticsPanel({ isRealHost = false }: BootDiagnosticsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [logContent, setLogContent] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBootTrace = async () => {
    setIsRefreshing(true);
    try {
      const res = await cminewarFetch("/api/cminewar/boot-trace");
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setLogContent(data.content);
          setError(null);
        } else {
          setError(data.error || "Fallo al procesar el archivo de diagnóstico.");
        }
      } else {
        setError(`Error del servidor: código de estado ${res.status}`);
      }
    } catch (err: any) {
      setError(`No se pudo conectar con el endpoint de telemetría: ${err.message}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBootTrace();
  }, []);

  // Helper to colorize specific log lines matching errors, alerts, and successes
  const colorizeLine = (line: string) => {
    const lower = line.toLowerCase();
    if (line.startsWith("===") || line.startsWith("---")) {
      return <span className="text-slate-500 font-bold">{line}</span>;
    }
    if (line.startsWith("[+]")) {
      return <span className="text-cyan-400 font-bold tracking-wider mt-2.5 block">{line}</span>;
    }
    if (line.startsWith("[✔]")) {
      return <span className="text-emerald-400 font-bold">{line}</span>;
    }
    if (lower.includes("error") || lower.includes("fail") || lower.includes("fallo") || lower.includes("crit")) {
      return <span className="text-rose-400 bg-rose-500/10 px-1 rounded border border-rose-500/15">{line}</span>;
    }
    if (lower.includes("warning") || lower.includes("warn") || lower.includes("advertencia") || lower.includes("lento")) {
      return <span className="text-amber-400 bg-amber-500/5 px-1 rounded">{line}</span>;
    }
    if (lower.includes("cminewar.service") || lower.includes("omarchy")) {
      return <span className="text-indigo-400 font-semibold">{line}</span>;
    }
    if (lower.includes("ms") || lower.includes("s") && /\d+/.test(line)) {
      // Highlight timing values in yellow/orange
      return <span className="text-amber-200">{line}</span>;
    }
    return <span className="text-slate-300">{line}</span>;
  };

  // Safe file download of boot-trace report for off-site debugging
  const handleDownloadLog = () => {
    try {
      const blob = new Blob([logContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cminewar_boot_trace_v${VERSION}_${new Date().toISOString().slice(0, 10)}.log`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {}
  };

  const filteredLines = logContent
    .split("\n")
    .filter((line) => line.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-4 flex flex-col flex-1 min-h-0" id="boot-diagnostics-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-200 flex items-center space-x-2">
            <Activity size={16} className="text-amber-400" />
            <span>Rastreador de Arranque y Diagnósticos de Debian</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Analiza el perfil detallado del arranque, servicios lentos de Systemd y alertas del Kernel para optimizar el encendido físico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBootTrace}
            disabled={isRefreshing}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded text-[10px] font-mono font-bold text-slate-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Refrescar el informe de arranque en tiempo real"
          >
            <RefreshCw size={11} className={`${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            <span>Refrescar</span>
          </button>

          <button
            onClick={handleDownloadLog}
            disabled={!logContent}
            className="px-2.5 py-1.5 bg-amber-950/40 hover:bg-amber-900 border border-amber-900/40 rounded text-[10px] font-mono font-bold text-amber-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Descargar reporte a archivo plano"
          >
            <Download size={11} />
            <span>Exportar .log</span>
          </button>
        </div>
      </div>

      {/* Information Alert bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-[10px] leading-relaxed text-slate-400 shrink-0">
        <Terminal size={14} className="text-amber-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-200 uppercase tracking-wider font-mono">Información de Diagnóstico Automático</p>
          <p>
            Al arrancar Debian, el daemon autónomo <code className="text-amber-400 font-mono">cminewar-boot-tracer.service</code> ejecuta de forma asíncrona un perfilado del sistema. Captura los retardos utilizando la suite <code className="text-slate-300 font-mono">systemd-analyze blame</code> y audita las advertencias críticas en el registro físico del disco duro para facilitar su posterior inspección forense.
          </p>
        </div>
      </div>

      {/* Main Terminal View / Viewer */}
      <div className="flex-1 min-h-0 bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col overflow-hidden">
        {/* Search header */}
        <div className="px-3 py-2 border-b border-slate-900 flex items-center justify-between gap-4 bg-slate-950 shrink-0">
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 uppercase">
            <span>Registro de salida:</span>
            <span className="text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded text-[9px]">
              /var/log/cminewar-boot.log
            </span>
          </div>

          <div className="relative max-w-xs w-full">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600">
              <Search size={11} />
            </span>
            <input
              type="text"
              placeholder="Filtrar registro (ej. blame, dmesg, critical)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 rounded px-2 py-1 pl-7 font-mono text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Console logs body */}
        <div className="flex-1 overflow-auto p-4 font-mono text-[10.5px] leading-relaxed select-text bg-[#030712] relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 select-none">
              <RefreshCw size={18} className="text-amber-400 animate-spin" />
              <span className="text-[10px] text-slate-500 font-mono">Sincronizando telemetría física de arranque...</span>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 text-center p-4 max-w-sm mx-auto select-none">
              <AlertTriangle size={20} className="text-rose-400" />
              <p className="text-[11px] font-bold text-slate-200 uppercase font-mono">Fallo al obtener telemetría</p>
              <p className="text-[10px] text-slate-400">{error}</p>
              <button
                onClick={fetchBootTrace}
                className="mt-2 px-3 py-1 bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-900/40 rounded text-[9px] font-bold tracking-wider uppercase transition"
              >
                Reintentar Conexión
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredLines.length > 0 ? (
                filteredLines.map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap hover:bg-slate-900/30 px-1 rounded transition-colors duration-100">
                    {colorizeLine(line)}
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-600 py-8 italic select-none">
                  Ninguna línea coincide con el filtro de búsqueda "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Console footer */}
        <div className="px-3 py-1.5 border-t border-slate-900 bg-[#020617] text-[9px] font-mono text-slate-550 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistema: {isRealHost ? "Debian Real Host Activo" : "Control de Simulación Local"}</span>
          </div>
          <span>Registros totales: {logContent ? logContent.split("\n").length : 0} líneas</span>
        </div>
      </div>
    </div>
  );
}

// Proyecto propiedad de Yonah Llanes
