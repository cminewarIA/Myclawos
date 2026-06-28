import React, { useState, useEffect } from "react";
import { Cpu, Database, Thermometer, ShieldAlert, Wifi, Activity } from "lucide-react";

export default function SystemMonitor() {
  const [cpuUsage, setCpuUsage] = useState(12);
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(20).fill(10));
  const [memUsage, setMemUsage] = useState(34);
  const [temp, setTemp] = useState(41);
  const [networkSpeed, setNetworkSpeed] = useState({ up: 0.8, down: 4.2 });

  // Simulate updating specs
  useEffect(() => {
    const interval = setInterval(() => {
      // Natural fluctuation logic
      setCpuUsage((prev) => {
        const delta = Math.floor(Math.random() * 15) - 7;
        const next = Math.min(Math.max(prev + delta, 5), 95);
        
        // Accumulate CPU usage history
        setCpuHistory((history) => {
          const updated = [...history.slice(1), next];
          return updated;
        });
        return next;
      });

      setMemUsage((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.min(Math.max(prev + delta, 28), 75);
      });

      setTemp((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.min(Math.max(prev + delta, 38), 58);
      });

      setNetworkSpeed({
        up: parseFloat((Math.random() * 1.5 + 0.2).toFixed(1)),
        down: parseFloat((Math.random() * 8.0 + 1.5).toFixed(1)),
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-900 overflow-y-auto p-4 space-y-4 text-slate-300 border-t border-slate-800">
      {/* Upper overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* CPU Card */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Cpu size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Carga de CPU</div>
            <div className="text-lg font-bold font-mono text-emerald-400">{cpuUsage}%</div>
            <div className="w-full bg-slate-900 h-1 rounded overflow-hidden mt-1">
              <div
                className="bg-emerald-400 h-full transition-all duration-1000"
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Memory card */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
            <Database size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">RAM Virtual</div>
            <div className="text-lg font-bold font-mono text-cyan-400">{memUsage}%</div>
            <div className="w-full bg-slate-900 h-1 rounded overflow-hidden mt-1">
              <div
                className="bg-cyan-400 h-full transition-all duration-1000"
                style={{ width: `${memUsage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Temp Card */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg">
            <Thermometer size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Térmico Kernel</div>
            <div className="text-lg font-bold font-mono text-amber-500">{temp}°C</div>
            <div className="w-full bg-slate-900 h-1 rounded overflow-hidden mt-1">
              <div
                className="bg-amber-500 h-full transition-all duration-1000"
                style={{ width: `${(temp / 100) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dynamic Activity Trend Sparkline */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 font-sans">
              <Activity size={14} className="text-emerald-400" />
              <span>Historial del Núcleo (CPU)</span>
            </h4>
            <span className="text-[9px] font-mono text-emerald-500">Muestreo síncrono</span>
          </div>

          <div className="h-24 flex items-end justify-between space-x-1.5 border-b border-l border-slate-900 pt-2 px-1">
            {cpuHistory.map((val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-emerald-500/20 hover:bg-emerald-400 border-t border-emerald-500/60 rounded-t transition-all duration-300"
                style={{ height: `${Math.max(val, 5)}%` }}
                title={`Carga: ${val}%`}
              />
            ))}
          </div>
          <div className="flex justify-between items-center text-[9px] text-slate-600 font-mono mt-1 select-none">
            <span>-30 segundos</span>
            <span>En vivo</span>
          </div>
        </div>

        {/* Network & Safety Specs */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans flex items-center space-x-1.5">
            <Wifi size={14} className="text-cyan-400" />
            <span>Interfaces del Sistema</span>
          </h4>

          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-500">Núcleo / Engine:</span>
              <span className="text-emerald-400">Python 3.11.2 (100% Funcional)</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-500">Firmware Host:</span>
              <span className="text-blue-400">UEFI Secure Boot / BIOS Legacy Híbrido</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-500">Puente IP Local:</span>
              <span className="text-slate-300">127.0.0.1 (claw0)</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-500">Descarga simulada:</span>
              <span className="text-cyan-400">{networkSpeed.down} Mb/s</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-500">Subida simulada:</span>
              <span className="text-violet-400">{networkSpeed.up} Mb/s</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-500">Estado de Seguridad:</span>
              <span className="text-emerald-400 flex items-center space-x-1 font-sans font-semibold">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping mr-1" />
                Seguro
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sandbox specs footer */}
      <div className="bg-slate-950/50 p-3 rounded border border-slate-800/80 flex items-start space-x-2.5 text-xs text-slate-400 leading-relaxed font-sans mt-auto">
        <ShieldAlert size={16} className="text-slate-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-300">Entorno Simulado de Contenedor CMineWar OS</p>
          <p className="text-[11px] text-slate-500">
            Todo proceso de software, disco de archivos y consola que utilices funciona localmente en memoria virtual de forma reactiva y protegida de la máquina host.
          </p>
        </div>
      </div>
    </div>
  );
}
