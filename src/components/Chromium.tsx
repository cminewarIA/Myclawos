import React, { useState } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Search, 
  Home, 
  Bookmark, 
  Lock, 
  Github, 
  Code, 
  Star, 
  Sparkles,
  ExternalLink
} from "lucide-react";

export default function Chromium() {
  const [url, setUrl] = useState("https://github.com/cminewarIA/Myclawos");
  const [currentSearch, setCurrentSearch] = useState("");
  const [isSecure, setIsSecure] = useState(true);
  
  const [wanBlocked, setWanBlocked] = useState(() => localStorage.getItem("claw_wan_blocked") === "true");

  React.useEffect(() => {
    const handleNetworkChange = () => {
      setWanBlocked(localStorage.getItem("claw_wan_blocked") === "true");
    };
    window.addEventListener("claw_network_changed", handleNetworkChange);
    return () => window.removeEventListener("claw_network_changed", handleNetworkChange);
  }, []);

  // Custom states for simulated sites
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultActive, setSearchResultActive] = useState(false);

  // Quick navigation bookmarks
  const bookmarks = [
    { name: "Myclawos GitHub", url: "https://github.com/cminewarIA/Myclawos", icon: <Github size={12} /> },
    { name: "Google Search", url: "https://google.com", icon: <Search size={12} /> },
    { name: "OpenClaw AI Solutions", url: "https://openclaw.ai", icon: <Sparkles size={12} className="text-amber-400" /> },
  ];

  const handleNavigate = (targetUrl: string) => {
    setUrl(targetUrl);
    // Determine security indicator based on URL
    setIsSecure(targetUrl.startsWith("https://"));
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let target = currentSearch.trim();
    if (!target) return;
    
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      if (target.includes(".") && !target.includes(" ")) {
        target = "https://" + target;
      } else {
        // search google
        setUrl("https://google.com");
        setSearchQuery(target);
        setSearchResultActive(true);
        setCurrentSearch("https://google.com");
        return;
      }
    }
    setUrl(target);
    setCurrentSearch(target);
    setIsSecure(target.startsWith("https://"));
    setSearchResultActive(false);
  };

  // Render webpage content based on the address
  const renderWebpageContent = () => {
    if (wanBlocked) {
      return (
        <div className="bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-8 text-center min-h-full font-sans select-none">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
            <Lock className="text-rose-455 w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-sm font-bold text-slate-100">Acceso a Internet Bloqueado</h2>
          <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
            El cortafuegos corporativo de ClawOS para instalaciones reales en disco duro tiene activado el <strong className="text-rose-400">Aislamiento LAN Seguro</strong>.
          </p>
          <div className="mt-4 p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-left font-mono text-[10px] w-full max-w-sm space-y-1.5 text-slate-400">
            <div><span className="text-slate-500">Destino intentado:</span> <span className="text-rose-400 font-bold truncate inline-block max-w-[150px] align-bottom">{url}</span></div>
            <div><span className="text-slate-500">Servicio de filtrado:</span> <span className="text-yellow-400 font-bold">claw-firewall.service</span></div>
            <div><span className="text-slate-500">Estado de ruta WAN:</span> <span className="text-red-400 font-bold">RECHAZADO (DROP 0.0.0.0/0)</span></div>
            <div><span className="text-slate-500">Direcciones permitidas:</span> <span className="text-emerald-400 font-bold">Sólo IPs locales (192.168.1.0/24)</span></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
            💡 Para navegar libremente por Internet de nuevo, desactiva la opción <strong className="text-pink-400">"Bloquear Internet (WAN)"</strong> desde la pestaña Cortafuegos de Ajustes de Hardware.
          </p>
        </div>
      );
    }

    // 1. GITHUB SIMULATION (Extremely tailored to cminewarIA/Myclawos)
    if (url.includes("github.com/cminewarIA/Myclawos") || url.includes("github.com/cminewaria/myclawos")) {
      return (
        <div className="bg-slate-950 text-slate-100 p-6 font-sans min-h-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <Github className="w-8 h-8 text-white" />
              <div>
                <div className="flex items-center space-x-2">
                  <a href="#" className="text-blue-400 hover:underline font-semibold">cminewarIA</a>
                  <span className="text-slate-500">/</span>
                  <a href="#" className="font-bold hover:underline">Myclawos</a>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">Public</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">El sistema operativo ClawOS síncrono y sintonizado para autoactualizaciones directas de GitHub.</p>
              </div>
            </div>
            
            <div className="flex space-x-2 text-xs">
              <button className="flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">
                <Star size={12} />
                <span>Star</span>
                <span className="bg-slate-900 px-1 rounded text-slate-400">12</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {/* Repository tree info bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="p-3 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-200">main branch</span>
                    <span className="text-slate-500">Last commit: Refactor updater and autologin logic</span>
                  </div>
                  <span className="text-slate-400">Hace 2 horas</span>
                </div>
                
                {/* Simulated file table */}
                <div className="divide-y divide-slate-800 text-xs text-slate-300 font-mono">
                  <div className="p-2.5 px-4 flex justify-between hover:bg-slate-800/40 select-none">
                    <span className="text-blue-400 font-bold">📂 src/</span>
                    <span className="text-slate-500">Refactor core structure for openclaw launch</span>
                  </div>
                  <div className="p-2.5 px-4 flex justify-between hover:bg-slate-800/40 select-none">
                    <span className="text-blue-400 font-bold">📂 public/</span>
                    <span className="text-slate-500">Add Chromium default configuration profiles</span>
                  </div>
                  <div className="p-2.5 px-4 flex justify-between hover:bg-slate-800/40 select-none">
                    <span className="text-slate-300">📄 package.json</span>
                    <span className="text-slate-500">Upgrade core framework and dependency stack</span>
                  </div>
                  <div className="p-2.5 px-4 flex justify-between hover:bg-slate-800/40 select-none">
                    <span className="text-slate-300">📄 README.md</span>
                    <span className="text-slate-500">Document auto-updates integration specs</span>
                  </div>
                </div>
              </div>

              {/* README visualization card */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                  <Code size={16} className="text-slate-400" />
                  <span className="font-bold text-slate-200">README.md</span>
                </div>
                
                <div className="space-y-3 leading-relaxed text-xs">
                  <h1 className="text-lg font-bold text-white border-b border-slate-800 pb-1">ClawOS Kernel & Shell Suite</h1>
                  <p className="text-slate-300 text-[11px]">
                    ClawOS es un innovador sistema operativo virtual y modular completamente integrado con las capacidades avanzadas de agentes de inteligencia artificial (OpenClaw).
                  </p>
                  
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[10px]">
                    <span className="text-amber-400 font-bold">✨ CARÁCTER REVOLUCIONARIO DE ESTA COMPILACIÓN:</span>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                      <li>Sincronización bidireccional continua con repositorios GitHub remotos.</li>
                      <li>Modo Autónomo de Superusuario (Direct Root Autologin).</li>
                      <li>Desactivación permanente ACPI para estabilidad de servicios continuos sin hibernación.</li>
                      <li>Integración nativa del navegador Chromium como buscador por defecto.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1.5">About OS Specs</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Repositorio oficial de almacenamiento central y ramificaciones de desarrollo de ClawOS.
                </p>
                <div className="space-y-1.5 pt-1 font-semibold">
                  <div className="text-emerald-400 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span>Auto-actualizable desde GitHub</span>
                  </div>
                  <div className="text-cyan-400 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    <span>Chromium por Defecto</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-[10px] space-y-2">
                <h4 className="font-bold text-slate-200">Releases</h4>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-emerald-400 font-bold">v1.1.2-stable (Latest)</span>
                  <p className="text-slate-500 mt-0.5">Añadida la anulación de hibernaciones y seguridad root.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. GOOGLE SIMULATION
    if (url.includes("google.com")) {
      return (
        <div className="bg-white text-slate-800 p-8 font-sans min-h-full flex flex-col justify-between">
          <div className="my-auto space-y-6 text-center max-w-lg mx-auto">
            {/* Google Logo */}
            <h1 className="text-4xl font-extrabold tracking-tight select-none">
              <span className="text-blue-500">G</span>
              <span className="text-red-500">o</span>
              <span className="text-amber-500">o</span>
              <span className="text-blue-500">g</span>
              <span className="text-green-500">l</span>
              <span className="text-red-500">e</span>
            </h1>

            {/* Search Input Box */}
            <form onSubmit={(e) => {
              e.preventDefault();
              setSearchQuery(currentSearch);
              setSearchResultActive(true);
            }} className="flex items-center space-x-2 bg-slate-100 border border-slate-200 hover:border-slate-300 focus-within:border-blue-400 rounded-full px-4 py-2 bg-white shadow-sm hover:shadow transition max-w-lg mx-auto">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Buscar en Google o escribir URL..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm p-0 text-slate-900" 
              />
            </form>

            <div className="flex justify-center space-x-2 text-xs">
              <button 
                type="button" 
                onClick={() => setSearchResultActive(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200/80 font-medium text-slate-600 transition"
              >
                Buscar con Google
              </button>
              <button 
                type="button"
                onClick={() => {
                  setSearchQuery("cminewarIA Myclawos github");
                  setSearchResultActive(true);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200/80 font-medium text-slate-600 transition"
              >
                Voy a tener suerte
              </button>
            </div>
          </div>

          {searchResultActive && searchQuery.trim() && (
            <div className="border-t border-slate-100 mt-6 pt-6 text-left max-w-xl mx-auto space-y-4">
              <h3 className="text-xs text-slate-500 font-mono">Buscar Resultados para: "{searchQuery}"</h3>
              
              {/* Simulated Search Item 1 */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-mono">https://github.com › cminewarIA › Myclawos</span>
                <h4 className="text-sm font-semibold text-blue-700 hover:underline">
                  <button type="button" onClick={() => handleNavigate("https://github.com/cminewarIA/Myclawos")}>
                    GitHub - cminewarIA/Myclawos: El sistema operativo ClawOS
                  </button>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sistema operativo con autoactualización de GitHub remota integral, Chromium como navegador por defecto y omitiendo contraseñas de seguridad.
                </p>
              </div>

              {/* Simulated Search Item 2 */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-mono">https://openclaw.ai › docs › custom-os</span>
                <h4 className="text-sm font-semibold text-blue-700 hover:underline">
                  <button type="button" onClick={() => handleNavigate("https://openclaw.ai")}>
                    OpenClaw AI Solutions: Estándar para Sistemas Privilegiados
                  </button>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Alineación ACPI del kernel, suspensión deshabilitada en ClawOS, inicio automático del administrador.
                </p>
              </div>
            </div>
          )}

          <div className="text-center text-[10px] text-slate-400 select-none pb-2">
            España © Google LLC - Privacidad - Términos
          </div>
        </div>
      );
    }

    // 3. OPENCLAW SIMULATION
    if (url.includes("openclaw.ai")) {
      return (
        <div className="bg-slate-900 text-slate-100 p-8 font-sans min-h-full flex flex-col justify-between">
          <div className="max-w-xl mx-auto py-4 space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                <Sparkles className="text-violet-400 w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-wide text-white">OpenClaw Artificial Intelligence Ecosystem</h1>
                <p className="text-xs text-slate-400">Plataformas virtuales de sistemas operativos integrados en nube con agentes inteligentes.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <h4 className="font-bold text-violet-300">Auto-Updates via GitHub</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Sincronización automatizada. Cuando haces push a tu repositorio remoto en GitHub, ClawOS se actualiza sola al instante mediante ganchos o el daemon de actualización.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <h4 className="font-bold text-cyan-300">Default Sandbox Browser</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Chromium se integra nativamente en el sandbox gráfico de ClawOS, proporcionando acceso completo y limpio a las APIs de red del host de forma segura.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 text-[11px] leading-relaxed text-slate-300">
              <span className="font-bold text-white uppercase tracking-wider block mb-1 text-[10px] text-slate-400">Nota del kernel para superusuario:</span>
              El inicio del sistema operativo en modo <code className="text-emerald-400 text-xs font-mono font-semibold">root</code> con contraseñas omitidas y suspensión ACPI anulada garantiza una latencia cero en la ejecución del daemon de actualización inteligente.
            </div>
          </div>
          
          <div className="text-center text-[10px] text-slate-500">
            Powered by OpenClaw Systems Inc. All Rights Reserved.
          </div>
        </div>
      );
    }

    // DEFAULT WEB VIEWER FALLBACK 
    return (
      <div className="bg-slate-950 text-slate-300 p-12 text-center flex flex-col items-center justify-center min-h-full font-sans">
        <Home size={32} className="text-slate-500 mb-3" />
        <h3 className="font-bold text-slate-100 text-sm mb-1">Página Web Simulada</h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
          Estás navegando la dirección: <span className="text-slate-300 font-mono break-all">{url}</span>. Para una mejor experiencia web interactiva, utilice los marcadores sugeridos en la barra superior.
        </p>
        <button 
          onClick={() => handleNavigate("https://github.com/cminewarIA/Myclawos")} 
          className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs rounded-lg font-semibold flex items-center space-x-1.5 text-slate-200 transition"
        >
          <Github size={12} />
          <span>Volver a Myclawos GitHub</span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-slate-950 text-slate-200 overflow-hidden" id="chromium-container">
      
      {/* 1. Address bar & navigation deck */}
      <div className="bg-slate-900 p-2.5 border-b border-slate-800 flex items-center justify-between shrink-0 space-x-3 select-none">
        
        {/* Navigation Action Buttons */}
        <div className="flex items-center space-x-1.5">
          <button 
            type="button"
            onClick={() => handleNavigate("https://google.com")}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
            title="Atrás"
          >
            <ArrowLeft size={14} />
          </button>
          <button 
            type="button"
            onClick={() => handleNavigate("https://github.com/cminewarIA/Myclawos")}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
            title="Adelante (Ref)"
          >
            <ArrowRight size={14} />
          </button>
          <button 
            type="button"
            onClick={() => handleNavigate(url)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
            title="Actualizar"
          >
            <RotateCw size={14} />
          </button>
          <button 
            type="button"
            onClick={() => handleNavigate("https://google.com")}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
            title="Inicio"
          >
            <Home size={14} />
          </button>
        </div>

        {/* Dynamic Address Bar URL Input Form */}
        <form onSubmit={handleAddressSubmit} className="flex-1 max-w-2xl flex items-center space-x-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 focus-within:border-cyan-500/50 rounded-lg px-2.5 py-1 bg-white select-all transition">
          {isSecure ? (
            <Lock size={11} className="text-emerald-500 shrink-0" title="Conexión Segura SSL" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          )}
          
          <span className="text-[10px] text-slate-500 font-mono shrink-0 select-none">https://</span>
          <input 
            type="text" 
            value={url.replace("https://", "").replace("http://", "")}
            onChange={(e) => setCurrentSearch(e.target.value)}
            className="w-full bg-transparent border-none outline-none focus:ring-0 text-xs p-0 text-slate-300 font-sans" 
            placeholder="Escribe una dirección URL o busca en la red..."
          />
          <button type="submit" className="hidden" />
        </form>

        {/* Desktop Browser Badge */}
        <span className="hidden md:inline-flex px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-full text-[9px] font-mono whitespace-nowrap">
          Simulación Chromium v122
        </span>
      </div>

      {/* 2. Bookmarks bar */}
      <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-900 flex items-center space-x-3 shrink-0 select-none overflow-x-auto text-[10px] font-medium text-slate-400">
        <Bookmark size={11} className="text-slate-500 shrink-0" />
        <span className="text-slate-600 shrink-0">|</span>
        
        {bookmarks.map((b) => (
          <button
            key={b.url}
            onClick={() => handleNavigate(b.url)}
            className={`flex items-center space-x-1 px-1.5 py-0.5 hover:bg-slate-800 rounded text-[10px] hover:text-slate-200 transition shrink-0 ${
              url === b.url ? "text-cyan-400 font-bold bg-slate-900/55" : ""
            }`}
          >
            {b.icon}
            <span>{b.name}</span>
          </button>
        ))}
      </div>

      {/* 3. Interactive Web Viewport */}
      <div className="flex-1 overflow-y-auto bg-slate-950 border-t border-slate-900">
        {renderWebpageContent()}
      </div>

    </div>
  );
}
