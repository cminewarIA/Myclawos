import React, { useState, useEffect } from "react";
import { Smartphone, Server, Eye, Cpu, ShieldCheck, LogOut, Disc, KeyRound } from "lucide-react";

interface AndroidGatewayProps {
  onSelectDemo: () => void;
  onSelectServer: (ip: string) => void;
}

export default function AndroidGateway({ onSelectDemo, onSelectServer }: AndroidGatewayProps) {
  const [ipAddress, setIpAddress] = useState("192.168.1.100");
  const [useDefaultIp, setUseDefaultIp] = useState(true);
  const [validationError, setValidationError] = useState("");

  // Retrieve stored Google profile or listen to live changes
  const [googleProfile, setGoogleProfile] = useState<{
    name: string;
    email: string;
    picture: string;
    sub: string;
  } | null>(() => {
    const saved = localStorage.getItem("cminewar_google_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  // Keep track of window heights to adjust dense layout automatically
  const [isSmallHeight, setIsSmallHeight] = useState(false);

  useEffect(() => {
    const checkHeight = () => {
      setIsSmallHeight(window.innerHeight < 700);
    };
    checkHeight();
    window.addEventListener("resize", checkHeight);
    return () => window.removeEventListener("resize", checkHeight);
  }, []);

  // Listen for successful authentication from OAuth Pop-ups
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Allow local or Cloud Run safe origins
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }
      if (event.data?.type === "GOOGLE_OAUTH_SUCCESS" && event.data?.profile) {
        const profile = event.data.profile;
        setGoogleProfile(profile);
        localStorage.setItem("cminewar_google_profile", JSON.stringify(profile));
        playTactileBeep(784, "sine", 0.3); // High frequency success chirp
      }
    };
    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, []);

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

  const handleGoogleSignIn = async () => {
    playTactileBeep(523, "sine", 0.1); // C5 note
    try {
      const origin = encodeURIComponent(window.location.origin);
      const res = await fetch(`/api/auth/google/url?origin=${origin}`);
      if (!res.ok) throw new Error("Fallo al obtener la URL de Google Auth.");
      const { url } = await res.json();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        url,
        "google_oauth_popup",
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
      );
      if (!authWindow) {
        setValidationError("Ventana emergente bloqueada. Por favor, habilítalas para iniciar sesión.");
      }
    } catch (err: any) {
      console.error(err);
      setValidationError(`Error Google OAuth: ${err.message || err}`);
    }
  };

  const handleGoogleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTactileBeep(330, "sine", 0.15);
    setGoogleProfile(null);
    localStorage.removeItem("cminewar_google_profile");
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-5 overflow-y-auto selection:bg-pink-600 select-none">
      {/* Immersive retro cyberpunk background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:24px_24px] opacity-25 pointer-events-none md:opacity-45"></div>
      
      {/* Neon glowing pink and cyan orb blur effects */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 rounded-full bg-pink-700/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-52 h-52 sm:w-80 sm:h-80 rounded-full bg-cyan-700/10 blur-[110px] pointer-events-none"></div>

      {/* Primary Cyberpunk Gateway Frame */}
      <div 
        className={`relative max-w-md w-full bg-slate-950/95 border border-pink-500/50 shadow-[0_0_40px_rgba(236,72,153,0.12)] rounded-2xl text-center my-auto transition-all duration-300 ${
          isSmallHeight ? "p-3.5 space-y-3" : "p-5 sm:p-6 space-y-4"
        }`}
        id="android-cyberpunk-gateway"
      >
        {/* Corner Brackets */}
        <div className="absolute top-[-1px] left-[-1px] w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute top-[-1px] right-[-1px] w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute bottom-[-1px] left-[-1px] w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
        <div className="absolute bottom-[-1px] right-[-1px] w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

        {/* Top Header Decals */}
        <div className={`flex justify-between items-center text-[8.5px] font-mono text-pink-500/70 border-b border-pink-500/10 pb-2 ${isSmallHeight ? "mb-1" : "mb-2"}`}>
          <span className="tracking-widest font-black uppercase">SECURITY GATEWAY: GNUPG V2</span>
          <span className="flex items-center space-x-1 uppercase">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-400">TACTILE_SHM_SECURE</span>
          </span>
        </div>

        {/* Brand Icon Header */}
        <div className="flex justify-center items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500/20 to-cyan-500/20 border border-pink-500/35 flex items-center justify-center shadow shadow-pink-500/10 shrink-0">
            <Smartphone className="w-5 h-5 text-pink-400 animate-pulse" />
          </div>
          <div className="text-left">
            <h1 className="text-base sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-cyan-400 uppercase font-sans">
              CMINEWAR OS GATEWAY
            </h1>
            <p className="text-[9px] text-slate-400 font-mono">Mobile Shell Live Loader</p>
          </div>
        </div>

        {/* Warning notification / validation error message banner */}
        {validationError && (
          <div className="p-2 bg-rose-950/40 border border-rose-500/30 rounded text-[9.5px] font-mono text-rose-300 text-left animate-shake">
            ⚠ {validationError}
          </div>
        )}

        {/* Option Tabs Grid */}
        <div className="space-y-3">
          
          {/* GOOGLE SECURE APK SIGNATURE CREDENTIAL CARD */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 text-left transition relative overflow-hidden">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-yellow-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <h4 className="text-[10.5px] font-bold text-slate-200 uppercase tracking-wide flex items-center justify-between">
                    <span>Firma Segura Google ID</span>
                    {googleProfile ? (
                      <span className="text-[7.5px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded font-black tracking-widest">
                        FIRMADO
                      </span>
                    ) : (
                      <span className="text-[7.5px] font-mono bg-amber-950/40 text-amber-500 border border-amber-500/20 px-1 py-0.2 rounded font-black tracking-widest">
                        PENDIENTE
                      </span>
                    )}
                  </h4>
                  <p className="text-[9.2px] text-slate-400 leading-normal mt-0.5 font-sans">
                    Vincule sus credenciales para firmar la APK con sus certificados seguros de Google de forma autorizada.
                  </p>
                </div>

                {googleProfile ? (
                  <div className="flex items-center space-x-2 bg-slate-950/80 p-2 rounded-lg border border-slate-800/70">
                    <img 
                      src={googleProfile.picture} 
                      alt="Google User Picture" 
                      className="w-6.5 h-6.5 rounded-full border border-emerald-500/30"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-100 truncate leading-none">{googleProfile.name}</p>
                      <p className="text-[8.5px] text-slate-400 font-mono truncate">{googleProfile.email}</p>
                    </div>
                    <button
                      onClick={handleGoogleLogout}
                      className="text-[8px] text-rose-450 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-1.5 py-1 rounded transition flex items-center space-x-1"
                      title="Desvincular firma de Google"
                    >
                      <LogOut size={9} />
                      <span>Cambiar</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-[9.5px] font-bold rounded-lg transition active:scale-[0.98] outline-none"
                  >
                    <span className="flex space-x-0.5 text-[10px] font-black mr-0.5">
                      <span className="text-blue-400">G</span>
                      <span className="text-red-400">o</span>
                      <span className="text-yellow-400">o</span>
                      <span className="text-blue-400">g</span>
                      <span className="text-green-400">l</span>
                      <span className="text-red-400">e</span>
                    </span>
                    <span>Firmar APK con Credenciales Google</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* OPTION 1: NATIVE REMOTE CLIENT */}
          <div className="bg-slate-900/60 border border-cyan-500/25 hover:border-cyan-400 p-3 rounded-xl text-left transition relative group">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-cyan-950/80 border border-cyan-500/30 rounded-lg text-cyan-400 mt-0.5 shrink-0">
                <Server className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div>
                  <h4 className="text-[10.5px] font-bold text-cyan-400 uppercase tracking-wide">
                    Servidor Remoto (Nodo Red)
                  </h4>
                  <p className="text-[9.2px] text-slate-400 leading-relaxed mt-0.5">
                    Vincula con un Hostname/IP remoto sobre el puerto 3000 para sincronización en caliente.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[8.5px] font-mono">
                    <span className="text-slate-500 font-bold uppercase">IP DEL SERVIDOR:</span>
                    <button
                      onClick={() => {
                        playTactileBeep(520, "sine", 0.05);
                        setUseDefaultIp(!useDefaultIp);
                        if (!useDefaultIp) setIpAddress("192.168.1.100");
                      }}
                      className="text-cyan-400 hover:text-cyan-300 underline uppercase"
                    >
                      {useDefaultIp ? "Manual" : "Por defecto"}
                    </button>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      disabled={useDefaultIp}
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      className={`flex-1 bg-slate-950/80 border text-[10px] font-mono rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400 text-cyan-300 ${
                        useDefaultIp ? "border-slate-850 text-slate-500 opacity-60" : "border-cyan-800"
                      }`}
                      placeholder="e.g. 192.168.1.135"
                    />
                    <button
                      onClick={handleConnectRemote}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-black rounded-lg transition uppercase tracking-wider flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <span>Conectar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* OPTION 2: STANDALONE OFFLINE DEMO */}
          <div 
            onClick={handleDemoClick}
            className="bg-slate-900/15 border border-slate-800/80 hover:border-pink-500/40 rounded-xl p-3 text-left transition group cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 group-hover:text-pink-400 group-hover:border-pink-500/20 mt-0.5 shrink-0 transition">
                <Eye className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10.5px] font-bold text-slate-300 group-hover:text-pink-400 transition uppercase tracking-wide flex items-center justify-between">
                  <span>Modo Demostración Local</span>
                  <span className="text-[7.5px] font-mono text-slate-500 border border-slate-800 px-1 rounded transition">DEMO_OFFLINE</span>
                </h4>
                <p className="text-[9.2px] text-slate-400 leading-relaxed mt-0.5">
                  Arranque virtual aislado para inspección rápida sin requerir dependencias de red o de host local.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info decoration */}
        <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-500 border-t border-slate-900/60 pt-2 shrink-0">
          <div className="flex items-center space-x-1">
            <Cpu size={10} className="text-pink-500/40" />
            <span>NÚCLEO: CARGADO 100%</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
            <span>FIRMA APK ALINEADA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
