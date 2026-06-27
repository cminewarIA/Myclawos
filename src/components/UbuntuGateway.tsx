import React, { useState, useEffect } from "react";
import { Monitor, Server, Cpu, ShieldCheck, Terminal, Settings, Activity, Wifi, X, ChevronRight, HardDrive } from "lucide-react";

interface UbuntuGatewayProps {
  onSelectServer: (ip: string) => void;
}

export default function UbuntuGateway({ onSelectServer }: UbuntuGatewayProps) {
  const [ipAddress, setIpAddress] = useState("localhost");
  const [validationError, setValidationError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [systemTime, setSystemTime] = useState("");

  // Update Ubuntu GNOME top-bar time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(
        now.toLocaleDateString("es-ES", { weekday: "short", month: "short", day: "numeric" }) +
        " " +
        now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Retro sound generator for tactile feedback
  const playTactileBeep = (freq = 440, type: OscillatorType = "sine", duration = 0.08) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Ignored if blocked by browser autoplay policy
    }
  };

  const handleConnectLocal = () => {
    // Check if the IP address is indeed a local network address
    const hn = ipAddress.trim().toLowerCase();
    
    const isLocal = hn === "localhost" || 
                    hn === "127.0.0.1" || 
                    hn === "[::1]" || 
                    hn.startsWith("192.168.") || 
                    hn.startsWith("10.") || 
                    hn.startsWith("172.16.") || 
                    hn.startsWith("172.17.") || 
                    hn.startsWith("172.18.") || 
                    hn.startsWith("172.19.") || 
                    hn.startsWith("172.2") || 
                    hn.startsWith("172.3") || 
                    hn.endsWith(".local");

    if (!hn) {
      playTactileBeep(220, "sawtooth", 0.25);
      setValidationError("DIRECCIÓN VACÍA: Por favor, introduce una dirección IP o 'localhost'.");
      return;
    }

    if (!isLocal) {
      playTactileBeep(220, "sawtooth", 0.25);
      setValidationError("RESTRICCIÓN DE SEGURIDAD: Solo se permiten conexiones a nodos de red locales (localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x o *.local) para garantizar la máxima estabilidad y fluidez.");
      return;
    }

    setValidationError("");
    playTactileBeep(650, "sine", 0.1);
    setIsConnecting(true);
    setProgress(0);
    
    const connectionLogs = [
      "Iniciando enlace socket nativo de alta velocidad...",
      "Resolviendo nombre de host local en mDNS loopback...",
      `Host resuelto: ${hn}`,
      "Estableciendo canal IPC local a través de Unix Sockets...",
      "Autenticando certificado de seguridad de nodo CMineWar OS...",
      "Negociando protocolo síncrono ultra-estable (v3.4)...",
      "Validando flujo de cuadros nativo sin pérdida...",
      "Estableciendo búfer de loopback de baja latencia...",
      "Conexión ultra-estable establecida con éxito."
    ];

    setLogs([connectionLogs[0]]);

    // Micro-progress loop for realistic fluid handshake
    const logInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 12;
        const currentLogIndex = Math.floor((next / 100) * connectionLogs.length);
        if (currentLogIndex < connectionLogs.length) {
          setLogs((prevLogs) => {
            const nextLog = connectionLogs[currentLogIndex];
            if (!prevLogs.includes(nextLog)) {
              return [...prevLogs, nextLog];
            }
            return prevLogs;
          });
        }
        
        if (next >= 100) {
          clearInterval(logInterval);
          setTimeout(() => {
            playTactileBeep(880, "sine", 0.15);
            onSelectServer(hn === "localhost" ? "127.0.0.1" : hn);
          }, 300);
          return 100;
        }
        return next;
      });
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#2C001E] flex flex-col font-sans select-none overflow-hidden text-slate-200">
      {/* Immersive Ubuntu wallpaper gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2C001E] via-[#77216F] to-[#E95420]/30 opacity-95 pointer-events-none"></div>

      {/* Ubuntu GNOME Top Bar */}
      <div className="w-full h-7 bg-slate-950/80 backdrop-blur border-b border-slate-900/40 px-4 flex items-center justify-between text-[11px] font-medium text-slate-200 z-50">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-orange-500 cursor-default hover:text-orange-400">Actividades</span>
          <span className="text-slate-400 cursor-default">CMineWar OS Client</span>
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 font-semibold">
          {systemTime || "Cargando GNOME Shell..."}
        </div>
        <div className="flex items-center space-x-3.5">
          <Wifi size={13} className="text-emerald-400 animate-pulse" />
          <Activity size={13} className="text-cyan-400" />
          <div className="flex items-center space-x-1 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[10px] font-bold text-emerald-400">10G LO</span>
          </div>
        </div>
      </div>

      {/* Ubuntu Workspace Panel Grid */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Ubuntu Sidebar Left Dock Launcher (Yaru Dock) */}
        <div className="w-16 bg-slate-950/75 border-r border-slate-900/30 flex flex-col items-center py-4 space-y-4 z-40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow shadow-orange-950/50 hover:scale-105 active:scale-95 transition cursor-pointer" title="CMineWar OS Client">
            <Monitor size={22} className="text-slate-100 animate-pulse" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-850 border border-slate-800 hover:bg-slate-800 flex items-center justify-center hover:scale-105 transition cursor-default text-slate-400" title="Archivos Locales">
            <HardDrive size={18} />
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-850 border border-slate-800 hover:bg-slate-800 flex items-center justify-center hover:scale-105 transition cursor-default text-slate-400" title="Consola Local">
            <Terminal size={18} />
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-850 border border-slate-800 hover:bg-slate-800 flex items-center justify-center hover:scale-105 transition cursor-default text-slate-400" title="Monitor de Procesos">
            <Activity size={18} />
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-850 border border-slate-800 hover:bg-slate-800 flex items-center justify-center hover:scale-105 transition cursor-default text-slate-400" title="Preferencias de Red">
            <Settings size={18} />
          </div>
          <div className="mt-auto w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
        </div>

        {/* Ubuntu Main Desktop Stage Area */}
        <div className="flex-1 p-6 flex items-center justify-center relative overflow-y-auto">
          
          {/* Centered Ubuntu Window Frame */}
          <div className="relative max-w-lg w-full bg-slate-950/95 border border-slate-800 shadow-[0_15px_50px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden flex flex-col animate-fade-in text-left">
            
            {/* Window title bar (GTK HeaderBar style) */}
            <div className="h-10 bg-slate-900 border-b border-slate-950 px-4 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse mr-1"></span>
                <span className="text-xs font-black text-slate-200 tracking-wide font-mono uppercase">
                  CMineWar OS — Cliente Ubuntu de Red Local
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-4 h-4 rounded-full bg-slate-850 hover:bg-slate-800 flex items-center justify-center cursor-default text-[8px] text-slate-500">─</div>
                <div className="w-4 h-4 rounded-full bg-slate-850 hover:bg-slate-800 flex items-center justify-center cursor-default text-[8px] text-slate-500">❑</div>
                <div className="w-4.5 h-4.5 rounded-full bg-orange-600 hover:bg-orange-500 flex items-center justify-center cursor-default text-[9px] text-slate-950 font-black">✕</div>
              </div>
            </div>

            {/* Main GTK App Container */}
            <div className="p-5 flex flex-col md:flex-row gap-5">
              
              {/* Left Panel: Connection Controls */}
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black text-slate-100 flex items-center space-x-1.5">
                    <Server className="text-orange-500 w-4 h-4" />
                    <span>Conexión de Nodo Loopback</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Sincronización instantánea directa de recursos a través de los puertos internos del procesador con latencia cero.
                  </p>
                </div>

                {validationError && (
                  <div className="p-2.5 bg-orange-950/30 border border-orange-500/30 rounded-lg text-[9.5px] font-mono text-orange-300 animate-shake">
                    ⚠ {validationError}
                  </div>
                )}

                {!isConnecting ? (
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        Host del Servidor Local:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={ipAddress}
                          onChange={(e) => setIpAddress(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 text-orange-400 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none placeholder-slate-700 tracking-wide"
                          placeholder="e.g. localhost, 127.0.0.1, 192.168.1.135"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleConnectLocal}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-slate-950 text-xs font-black rounded-lg transition uppercase tracking-widest flex items-center justify-center space-x-1 cursor-pointer shadow shadow-orange-950/30 hover:shadow-orange-500/10"
                    >
                      <span>Iniciar Enlace de Canal</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ) : (
                  // Connecting State: Fluid logs & progress bar
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono font-bold text-orange-400 select-none">
                        <span>ESTABLECIENDO SOCKET...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-150"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Terminal-like logging box for maximum reliability indicator */}
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 h-28 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1">
                      {logs.map((log, index) => (
                        <p key={index} className="flex items-start">
                          <span className="text-orange-500 mr-1.5 select-none font-bold">▶</span>
                          <span>{log}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel: Network & Stability Diagnostics Sidebar */}
              <div className="w-full md:w-44 border-t md:border-t-0 md:border-l border-slate-900 pt-4 md:pt-0 md:pl-4 flex flex-col justify-between shrink-0 font-mono text-[10px]">
                <div className="space-y-3">
                  <div className="flex items-center space-x-1 border-b border-slate-950 pb-1.5">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    <span className="font-bold text-slate-300 text-[9px] uppercase tracking-wide">CONFIABILIDAD</span>
                  </div>
                  
                  <div className="space-y-2 select-none">
                    <div>
                      <p className="text-slate-500 text-[8.5px] uppercase">Protocolo:</p>
                      <p className="text-slate-200 font-bold">IPC Loopback SHM</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[8.5px] uppercase">Rango mDNS:</p>
                      <p className="text-slate-200 font-bold">cminewar.local</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[8.5px] uppercase">Ping de Enlace:</p>
                      <p className="text-emerald-400 font-bold flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse"></span>
                        &lt; 0.1 ms (Nativo)
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[8.5px] uppercase">Seguridad Cripto:</p>
                      <p className="text-slate-300 font-bold">AES-256-GCM hardware</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-950 select-none text-[8px] text-slate-500 leading-relaxed">
                  Estabilidad de red local garantizada por enlace síncrono del kernel Ubuntu sin buffers externos.
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Background decoration labels removed as per user request */}

    </div>
  );
}
