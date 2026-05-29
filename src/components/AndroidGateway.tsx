import React, { useState } from "react";
import { Smartphone, Server, Eye, Shuffle, Terminal, Network, ShieldCheck, Cpu } from "lucide-react";

interface AndroidGatewayProps {
  onSelectDemo: () => void;
  onSelectServer: (ip: string) => void;
}

export default function AndroidGateway({ onSelectDemo, onSelectServer }: AndroidGatewayProps) {
  const [ipAddress, setIpAddress] = useState("192.168.1.100");
  const [useDefaultIp, setUseDefaultIp] = useState(true);
  const [validationError, setValidationError] = useState("");

  // Play a retro synthesizer beep on select/hover
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
      // AudioContext could be blocked by browser policy initially, ignore safely
    }
  };

  const handleConnectRemote = () => {
    // Validate IP formatting
    const ipPattern = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipAddress || !ipPattern.test(ipAddress)) {
      playTactileBeep(220, "sawtooth", 0.25);
      setValidationError("DIRECCIÓN IP NO VÁLIDA: El formato debe ser x.x.x.x");
      return;
    }
    setValidationError("");
    playTactileBeep(880, "triangle", 0.15);
    onSelectServer(ipAddress);
  };

  const handleDemoClick = () => {
    playTactileBeep(660, "sine", 0.12);
    onSelectDemo();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 overflow-y-auto selection:bg-pink-600 select-none">
      {/* Immersive retro cyberpunk background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none md:opacity-50"></div>
      
      {/* Neon glowing pink and cyan orb blur effects */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-pink-700/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-700/10 blur-[130px] pointer-events-none"></div>

      {/* Primary Cyberpunk Gateway Frame */}
      <div 
        className="relative max-w-lg w-full bg-slate-950/90 border-2 border-pink-500/70 shadow-[0_0_50px_rgba(236,72,153,0.15)] rounded-2xl p-4.5 sm:p-6 md:p-8 text-center my-auto"
        id="android-cyberpunk-gateway"
      >
        {/* Abstract Corner Brackets */}
        <div className="absolute top-[-3px] left-[-3px] w-6 h-6 border-t-4 border-l-4 border-cyan-400"></div>
        <div className="absolute top-[-3px] right-[-3px] w-6 h-6 border-t-4 border-r-4 border-cyan-400"></div>
        <div className="absolute bottom-[-3px] left-[-3px] w-6 h-6 border-b-4 border-l-4 border-cyan-400"></div>
        <div className="absolute bottom-[-3px] right-[-3px] w-6 h-6 border-b-4 border-r-4 border-cyan-400"></div>

        {/* Header Decals */}
        <div className="flex justify-between items-center text-[9px] font-mono text-pink-500/80 mb-4 sm:mb-6 border-b border-pink-500/20 pb-3">
          <span className="tracking-widest font-bold">DEVICE GATEWAY: v1.2</span>
          <span className="flex items-center space-x-1 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
            <span className="font-semibold text-slate-400">ANDROID_MODE_DETECTED</span>
          </span>
        </div>

        {/* Central Logo / Visual */}
        <div className="flex justify-center mb-3 sm:mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-cyan-500/20 border border-pink-500/40 flex items-center justify-center shadow-lg shadow-pink-500/10 shrink-0">
            <Smartphone className="w-7 h-7 sm:w-9 sm:h-9 text-pink-400 animate-pulse" />
          </div>
        </div>

        {/* Warning Badge & Message */}
        <div className="space-y-1.5 mb-5 sm:mb-6">
          <h1 className="text-lg md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-cyan-400 uppercase font-sans">
            CMINEWAR SYSTEM GATEWAY
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 font-mono max-w-sm mx-auto leading-relaxed">
            Se ha detectado un entorno táctil móvil Android. Seleccione el método de inicialización del núcleo.
          </p>
        </div>

        {/* UI Option Tabs Grid */}
        <div className="space-y-3.5 sm:space-y-4 mb-5 sm:mb-6">
          
          {/* OPTION 1: NATIVE SERVER CLIENT */}
          <div className="bg-slate-900/60 border border-cyan-500/30 hover:border-cyan-400 rounded-xl p-3.5 sm:p-5 text-left transition relative overflow-hidden group">
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-cyan-500/10 border-l border-b border-cyan-500/30 rounded-bl text-[8px] font-mono text-cyan-400 tracking-wider uppercase font-black">
              Recomendado
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-1.5 sm:p-2 bg-cyan-950/80 border border-cyan-500/30 rounded-lg text-cyan-400 mt-1 shrink-0">
                <Server className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-2 sm:space-y-2.5">
                <div>
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                    Servidor Remoto (Instalación Nativa)
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                    Ejecuta y sincroniza en tiempo real contra un nodo bare-metal corriendo en tu red local o IP pública a través del puerto 3000.
                  </p>
                </div>

                {/* Sintonizar IP field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-mono text-slate-500 uppercase font-bold">
                      Servidor IP / Hostname:
                    </label>
                    <button
                      onClick={() => {
                        playTactileBeep(520, "sine", 0.05);
                        setUseDefaultIp(!useDefaultIp);
                        if (!useDefaultIp) setIpAddress("192.168.1.100");
                      }}
                      className="text-[9px] font-mono text-cyan-400/80 hover:text-cyan-300 underline uppercase"
                    >
                      {useDefaultIp ? "Editar IP manual" : "Usar IP por defecto"}
                    </button>
                  </div>
                  
                  <div className="flex flex-col xs:flex-row gap-2">
                    <input
                      type="text"
                      disabled={useDefaultIp}
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      className={`flex-1 bg-slate-950/80 border text-xs font-mono rounded px-3 py-1.5 sm:py-2 focus:outline-none focus:border-cyan-400 text-cyan-300 ${
                        useDefaultIp ? "border-slate-800 text-slate-500 opacity-60" : "border-cyan-800"
                      }`}
                      placeholder="e.g. 192.168.1.135"
                    />
                    <button
                      onClick={handleConnectRemote}
                      onMouseEnter={() => playTactileBeep(980, "sine", 0.02)}
                      className="px-4 py-1.5 sm:py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-black rounded-lg transition uppercase tracking-wider shadow-md shadow-cyan-950/55 flex items-center justify-center space-x-1 cursor-pointer shrink-0"
                    >
                      <span>Conectar</span>
                    </button>
                  </div>
                  
                  {validationError && (
                    <p className="text-[9.5px] font-mono text-rose-500 block animate-pulse font-bold mt-1">
                      ⚠ {validationError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* OPTION 2: STANDALONE DEMO */}
          <div 
            onClick={handleDemoClick}
            onMouseEnter={() => playTactileBeep(580, "sine", 0.02)}
            className="bg-slate-900/20 border border-slate-800 hover:border-pink-500/50 rounded-xl p-3.5 sm:p-4 text-left transition relative group cursor-pointer"
          >
            <div className="flex items-start space-x-3">
              <div className="p-1.5 sm:p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 group-hover:text-pink-400 group-hover:border-pink-500/30 mt-0.5 shrink-0 transition">
                <Eye className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-300 group-hover:text-pink-400 transition uppercase tracking-wide flex items-center justify-between">
                  <span>Modo Demostración Local</span>
                  <span className="text-[9px] font-mono text-slate-550 border border-slate-800 px-1 py-0.2 rounded group-hover:border-pink-500/20 group-hover:text-pink-400 transition ml-2">DEMO_OFFLINE</span>
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  Arranque virtual aislado e independiente. Ideal para inspección rápida de interfaces sin requerir ningún servidor físico de enlace.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info decoration */}
        <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-500 border-t border-slate-900 pt-3 mt-4 sm:mt-5">
          <div className="flex items-center space-x-1.5">
            <Cpu size={10} className="text-pink-500/50" />
            <span>NÚCLEO GRUB: READY</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>MÓDULO UDEV PROTEGIDO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
