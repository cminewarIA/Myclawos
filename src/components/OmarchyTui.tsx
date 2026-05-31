import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Activity, Play, RefreshCw, Layers, Shield, Wifi, ChevronRight, CornerDownLeft, AlertCircle } from "lucide-react";

interface OmarchyTuiProps {
  onReboot: () => void;
  connectedServerIp: string | null;
}

export default function OmarchyTui({ onReboot, connectedServerIp }: OmarchyTuiProps) {
  // Sound Player Helper
  const playTone = (freq = 440, type: OscillatorType = "sine", duration = 0.05) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  };

  // Global Clock and Uptime State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [uptimeSeconds, setUptimeSeconds] = useState(0);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Format uptime (Hh Mm Ss)
  const formatUptime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h > 0 ? h + "h " : ""}${m > 0 ? m + "m " : ""}${s}s`;
  };

  // Tabs for Mobile Mode
  const [activeMobileTab, setActiveMobileTab] = useState<"ai" | "network" | "monitor">("ai");

  // ===== LEFT PANEL STATE: CMINEWAR AI INTERACTIVE CLI =====
  const [aiInput, setAiInput] = useState("");
  const [aiLogs, setAiLogs] = useState<string[]>([
    "┌────────────────────────────────────────────────────────┐",
    "│        🛸 ANTIGRAVITY AGENT CONTAINER CLI v2.4 🛸      │",
    "└────────────────────────────────────────────────────────┘",
    "",
    "[\u001b[33m⚙\u001b[0m] Inicializando subsistemas lógicos de Antigravity...",
    "  ▷ Conectando con Google AI Control Plane...",
    "  ▷ Solicitando modelo de agente \u001b[36mantigravity-preview-05-2026\u001b[0m...",
    "  ▷ Levantando entorno de sandbox remoto (\u001b[1;32mremote-sandbox-8291a\u001b[0m)...",
    "  ▷ Sincronizando árbol de archivos CMineWar Workspace...",
    "[\u001b[32m✔\u001b[0m] ¡Sandbox listo y montado correctamente!",
    "",
    "Conectado al runtime remoto. Escribe \u001b[31mclear\u001b[0m para limpiar la terminal, o \u001b[31mexit\u001b[0m para conmutar a Kiosco GUI.",
    "Escribe tu consulta inteligente o comando simulado:",
    ""
  ]);
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [aiHistory, setAiHistory] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const aiConsoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiConsoleEndRef.current) {
      aiConsoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiLogs]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || aiIsThinking) return;

    const userInput = aiInput.trim();
    setAiInput("");
    playTone(520, "sine", 0.04);

    // Append user input log with nice color
    const userPromptText = `antigravity-agent㉿sandbox-cli:~# ${userInput}`;
    setAiLogs((prev) => [...prev, userPromptText]);

    const lowerInput = userInput.toLowerCase();

    // Direct command interceptions
    if (lowerInput === "clear" || lowerInput === "cls") {
      setAiLogs([
        "┌────────────────────────────────────────────────────────┐",
        "│        🛸 ANTIGRAVITY AGENT CONTAINER CLI v2.4 🛸      │",
        "└────────────────────────────────────────────────────────┘",
        "Terminal reiniciada.",
        ""
      ]);
      return;
    }

    if (lowerInput === "exit" || lowerInput === "quit") {
      setAiLogs((prev) => [...prev, "[\u001b[33m!\u001b[0m] Solicitando desincorporación de Omarchy...", "Conmutando entorno gráfico a Modo Kiosco...", "Iniciando re-arranque en caliente de CMineWar OS..."]);
      playTone(330, "triangle", 0.25);
      setTimeout(() => {
        localStorage.setItem("cminewar_boot_mode", "kiosk");
        localStorage.removeItem("cminewar_safe_mode");
        window.location.reload();
      }, 1500);
      return;
    }

    setAiIsThinking(true);

    // Dynamic progression steps emulating Bash CLI
    setAiLogs((prev) => [...prev, "", `\u001b[34m[THOUGHT]\u001b[0m (Step 1/3) Analizando requerimiento: "${userInput}"`]);
    await new Promise((r) => setTimeout(r, 60000 / 95));

    if (lowerInput.includes("ejecuta") || lowerInput.includes("corre") || lowerInput.includes("comando") || lowerInput.includes("crea") || lowerInput.includes("archivo")) {
      setAiLogs((prev) => [...prev, `\u001b[36m[BASH_CALL]\u001b[0m invoking sandbox shell compiler... ($SHELL -c ...)`]);
      playTone(400, "square", 0.05);
      await new Promise((r) => setTimeout(r, 60000 / 110));
      setAiLogs((prev) => [...prev, `\u001b[32m[BASH_RESULT]\u001b[0m stdout: Code checked. Preparing environment execution context.`]);
    } else if (lowerInput.includes("busca") || lowerInput.includes("investiga") || lowerInput.includes("google") || lowerInput.includes("web") || lowerInput.includes("grub")) {
      setAiLogs((prev) => [...prev, `\u001b[36m[SEARCH_CALL]\u001b[2m grounding via Google Search Core...`]);
      playTone(600, "sine", 0.03);
      await new Promise((r) => setTimeout(r, 60000 / 100));
      setAiLogs((prev) => [...prev, `\u001b[32m[SEARCH_RESULT]\u001b[0m retrieved 4 high-authority citations for context extraction.`]);
    }

    setAiLogs((prev) => [...prev, `\u001b[34m[THOUGHT]\u001b[0m (Step 2/3) Ejecutando modelo de razonamiento reflexivo (Thinking)...`]);
    playTone(480, "sine", 0.02);
    await new Promise((r) => setTimeout(r, 60000 / 80));

    setAiLogs((prev) => [...prev, `\u001b[34m[THOUGHT]\u001b[0m (Step 3/3) Sintetizando respuesta de Antigravity Core...`]);
    await new Promise((r) => setTimeout(r, 400));

    try {
      // Build actual chat conversation histories payload
      const simpleHist = aiHistory.slice(-10).map((h) => ({ id: Math.random().toString(), role: h.role === "user" ? "user" as const : "model" as const, text: h.text }));
      
      const res = await fetch("/api/cminewar/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput, history: simpleHist })
      });

      if (!res.ok) {
        throw new Error("Local daemon endpoint unavailable");
      }

      const data = await res.json();
      const aiResponseText = data.text || "La llamada remota devolvió una respuesta vacía.";

      setAiLogs((prev) => [
        ...prev,
        "",
        `\u001b[35m🛸 AGENTE ANTIGRAVITY:\u001b[0m`,
        aiResponseText,
        ""
      ]);
      setAiHistory((prev) => [...prev, { role: "user", text: userInput }, { role: "model", text: aiResponseText }]);
      playTone(700, "sine", 0.08);
    } catch (e) {
      setAiLogs((prev) => [
        ...prev,
        "",
        "\u001b[31m[ALERTA DE SISTEMA - ERROR REMOTO]\u001b[0m",
        "No se pudo completar el socket con localhost:3000. Por favor, asegúrese de que el servidor o la suite central de CMineWar estén activos.",
        ""
      ]);
      playTone(150, "sawtooth", 0.2);
    } finally {
      setAiIsThinking(false);
    }
  };


  // ===== RIGHT-TOP PANEL: CMINEWAR OS COMMUNICATIONS & FIREWALL TUI =====
  const [networkLogs, setNetworkLogs] = useState<string[]>([
    "[⚙] Monitor de red en escucha (puerto local socket 3000)",
    "[⚙] Daemon wpa_supplicant iniciado en canal background.",
    "[⚙] Intercambio de sockets de red sintonizados con exito."
  ]);
  const [isFirewallBlocked, setIsFirewallBlocked] = useState(true);

  const handleNetworkAction = (actionId: number) => {
    playTone(440 + actionId * 100, "sine", 0.04);
    switch (actionId) {
      case 1:
        setIsFirewallBlocked(true);
        setNetworkLogs((prev) => [
          ...prev,
          `[!] [${new Date().toLocaleTimeString()}] Solicitando privilegios de root para bloquear WAN...`,
          `[+] cminewar-firewall block: WAN BLOQUEADA CORRECTAMENTE (Modo Aislamiento Activo) [ELIMINADOS_INODOS_IP]`
        ]);
        break;
      case 2:
        setIsFirewallBlocked(false);
        setNetworkLogs((prev) => [
          ...prev,
          `[+] [${new Date().toLocaleTimeString()}] Solicitando privilegios de root para liberar WAN...`,
          `[+] cminewar-firewall allow: WAN ABIERTA Y ACCESIBLE (Acceso de Red Redundante) [OK]`
        ]);
        break;
      case 3:
        setNetworkLogs((prev) => [
          ...prev,
          `[*] [${new Date().toLocaleTimeString()}] Analizando puertos RF en busca de puntos de acceso WiFi locales...`,
          `    - SSID: CMineWarNet_5G   │ Ch: 36  │ Sig: 98%  │ Enc: WPA2-Enterprise`,
          `    - SSID: Fibra_Optica_X   │ Ch: 6   │ Sig: 74%  │ Enc: WPA2-PSK`,
          `    - SSID: Invitados_Lab    │ Ch: 1   │ Sig: 45%  │ Enc: WPA3 (SAE/FILS)`
        ]);
        break;
      case 4:
        setNetworkLogs((prev) => [
          ...prev,
          `[*] [${new Date().toLocaleTimeString()}] Escaneando hilos de frecuencia Bluetooth...`,
          `    - MAC: 00:1A:7D:DA:71:11 │ Dispositivo: Auriculares de Usuario [Pila: Realtek]`,
          `    - MAC: CC:2D:A9:05:4B:92 │ Dispositivo: SmartTV_Oficina        [Pila: Broadcom]`
        ]);
        break;
      case 5:
        setNetworkLogs((prev) => [
          ...prev,
          `[*] [${new Date().toLocaleTimeString()}] Consultando telemetria de modem LTE a traves de ModemManager...`,
          `    - Fabricante: Qualcomm Gobi chip base-band / x86 native`,
          `    - ISP: CMineWar Network Services Ltd`,
          `    - Intensidad de señal: [|||||] 92% (Excelente cobertura)`,
          `    - Estado: Conectado (LTE Avanzado / Carrier Aggregation Activo)`
        ]);
        break;
      case 6:
        setNetworkLogs([`[r] [${new Date().toLocaleTimeString()}] Monitor de interfaz de red refrescado.`]);
        break;
    }
  };


  // ===== RIGHT-BOTTOM PANEL: CORE CPU/RAM HTOP-BTOP SIMULATOR =====
  const [cpuLoads, setCpuLoads] = useState<number[]>([15, 22, 10, 8, 45, 12, 19, 31]);
  const [ramLoad, setRamLoad] = useState(38.2);
  const [cpuTemp, setCpuTemp] = useState(42.5);

  useEffect(() => {
    const perfInterval = setInterval(() => {
      setCpuLoads((prev) => prev.map((load) => {
        const delta = Math.floor(Math.random() * 21) - 10;
        return Math.max(2, Math.min(99, load + delta));
      }));
      setRamLoad((prev) => {
        const delta = (Math.random() * 2) - 1;
        return Math.max(30, Math.min(65, prev + delta));
      });
      setCpuTemp((prev) => {
        const delta = (Math.random() * 1.6) - 0.8;
        return Math.max(38, Math.min(52, prev + delta));
      });
    }, 1500);

    return () => clearInterval(perfInterval);
  }, []);

  const getBtopBar = (pct: number) => {
    const charsTotal = 15;
    const activeChars = Math.round((pct / 100) * charsTotal);
    const bars = "█".repeat(activeChars) + "░".repeat(Math.max(0, charsTotal - activeChars));
    return `[${bars}] ${pct.toString().padStart(2, " ")}%`;
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black text-slate-300 font-mono text-xs flex flex-col overflow-hidden select-none">
      
      {/* SCANLINES OVERLAY RETRO STYLE */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%)] bg-[length:100%_4px] pointer-events-none z-50" />

      {/* TOP TMUX-STYLE CYAN STATUS BAR */}
      <div className="bg-zinc-950 text-cyan-400 font-bold px-4 py-1.5 flex items-center justify-between border-b border-zinc-900 shrink-0 shadow-lg select-none z-20 text-[11px]">
        <div className="flex items-center space-x-3">
          <span className="text-emerald-400 font-black animate-pulse">🐉 CMineWar OS 1.2</span>
          <span className="text-zinc-500">│</span>
          <span className="text-yellow-400">⚡ Omarchy TUI Console</span>
          <span className="text-zinc-500">│</span>
          <span className="text-cyan-400 bg-zinc-900/40 px-1.5 py-0.5 rounded border border-cyan-950/20 text-[10px]">session: omarchy_cminewar</span>
          <span className="text-zinc-500">│</span>
          <span className="text-zinc-400 font-normal">tty1</span>
        </div>

        {/* Center Clock / Uptime */}
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-zinc-500">UPTIME: <strong className="text-white font-mono">{formatUptime(uptimeSeconds)}</strong></span>
          <span className="text-zinc-500">│</span>
          <span className="text-pink-400 font-mono tracking-wider">
            {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}
          </span>
        </div>

        {/* Global actions: switch to Kiosk GUI or reboot */}
        <div className="flex items-center space-x-2">
          {/* F9 / Exit binder shortcut */}
          <button
            onClick={() => {
              playTone(390, "triangle", 0.15);
              localStorage.setItem("cminewar_boot_mode", "kiosk");
              localStorage.removeItem("cminewar_safe_mode");
              window.location.reload();
            }}
            className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 hover:border-cyan-500 hover:text-white rounded text-[10px] text-cyan-400 font-bold tracking-tight cursor-pointer transition active:scale-95"
          >
            F9 [ KIOSKO GUI ]
          </button>
          
          <button
            onClick={onReboot}
            className="px-2.5 py-0.5 bg-red-950/40 border border-red-900/30 text-rose-300 hover:bg-rose-950/60 hover:text-white rounded text-[10px] text-rose-400 font-bold tracking-tight cursor-pointer transition active:scale-95"
          >
            F12 [ REBOOT GRUB ]
          </button>
        </div>
      </div>

      {/* MOBILE CONSOLE TAB BAR */}
      <div className="md:hidden bg-zinc-900/60 border-b border-zinc-900 p-1 flex shrink-0 space-x-1">
        <button
          onClick={() => { playTone(400, "sine", 0.03); setActiveMobileTab("ai"); }}
          className={`flex-1 text-center py-2 rounded text-[10px] font-bold ${
            activeMobileTab === "ai" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "text-zinc-450 hover:bg-zinc-900"
          }`}
        >
          🛸 AI CLI
        </button>
        <button
          onClick={() => { playTone(400, "sine", 0.03); setActiveMobileTab("network"); }}
          className={`flex-1 text-center py-2 rounded text-[10px] font-bold ${
            activeMobileTab === "network" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "text-zinc-450 hover:bg-zinc-900"
          }`}
        >
          🌐 RED
        </button>
        <button
          onClick={() => { playTone(400, "sine", 0.03); setActiveMobileTab("monitor"); }}
          className={`flex-1 text-center py-2 rounded text-[10px] font-bold ${
            activeMobileTab === "monitor" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "text-zinc-450 hover:bg-zinc-900"
          }`}
        >
          📈 METRICAS
        </button>
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        
        {/* PANEL LEFT: CMINEWAR AI INTERACTIVE CLI (48% width) */}
        <div className={`flex flex-col border-r border-zinc-900 min-h-0 ${
          activeMobileTab === "ai" ? "flex" : "hidden md:flex md:w-[48%]"
        }`}>
          {/* Header */}
          <div className="bg-zinc-950 text-yellow-400 border-b border-zinc-900 px-4 py-2 flex items-center justify-between select-none">
            <span className="font-bold tracking-wide flex items-center space-x-1.5">
              <Sparkles size={11} className="animate-spin text-cyan-400" style={{ animationDuration: "12s" }} />
              <span>cminewar-ai-cli (antigravity-preview)</span>
            </span>
            <span className="text-[10px] text-zinc-650 font-mono font-bold">Pane 0.0</span>
          </div>

          {/* CLI Content console */}
          <div className="flex-1 bg-black p-4 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 select-text selection:bg-cyan-500/20">
            {aiLogs.map((log, index) => {
              if (log.startsWith("antigravity-agent㉿sandbox-cli:~#")) {
                return (
                  <div key={index} className="text-zinc-400 pt-1.5 flex items-center space-x-1.5 select-text font-bold">
                    <ChevronRight size={10} className="text-emerald-500" />
                    <span>{log}</span>
                  </div>
                );
              }

              // Color highlight parsers for logs
              let formatted = log;
              let customStyle = "text-zinc-300";

              if (log.includes("[✔]") || log.includes("[+")) {
                customStyle = "text-emerald-400";
              } else if (log.includes("[ALERTA") || log.includes("[!")) {
                customStyle = "text-rose-400 font-bold";
              } else if (log.includes("[THOUGHT]")) {
                customStyle = "text-purple-400 font-bold";
              } else if (log.includes("[BASH") || log.includes("[SEARCH")) {
                customStyle = "text-cyan-400 font-semibold";
              } else if (log.includes("🛸 AGENTE ANTIGRAVITY:")) {
                customStyle = "text-pink-400 font-black tracking-wider pt-2";
              } else if (log.startsWith("┌──") || log.startsWith("│") || log.startsWith("└──")) {
                customStyle = "text-purple-500 text-center select-none font-bold";
              }

              // Strip color markers if present
              const cleanOutput = formatted
                .replace(/\u001b\[33m⚙\u001b\[0m/g, "⚙")
                .replace(/\u001b\[32m✔\u001b\[0m/g, "✔")
                .replace(/\u001b\[36mantigravity-preview-05-2026\u001b\[0m/g, "antigravity-preview-05-2026")
                .replace(/\u001b\[1;32mremote-sandbox-8291a\u001b\[0m/g, "remote-sandbox-8291a")
                .replace(/\u001b\[31mclear\u001b\[0m/g, "clear")
                .replace(/\u001b\[31mexit\u001b\[0m/g, "exit");

              return (
                <pre key={index} className={`whitespace-pre-wrap ${customStyle} font-mono select-text`}>
                  {cleanOutput}
                </pre>
              );
            })}

            {/* Simulating active processing */}
            {aiIsThinking && (
              <div className="flex items-center space-x-1.5 text-cyan-400 animate-pulse pt-2 font-bold font-mono">
                <RefreshCw size={12} className="animate-spin" />
                <span>[AGENTE COGNITIVO CALCULANDO...]</span>
              </div>
            )}

            <div ref={aiConsoleEndRef} />
          </div>

          {/* Form CLI Command input */}
          <form
            onSubmit={handleAiSubmit}
            className="p-3 bg-zinc-950 border-t border-zinc-900 flex items-center space-x-2 select-none"
          >
            <span className="text-emerald-500 font-bold font-mono select-none text-[11px] shrink-0">
              antigravity㉿cli:#
            </span>
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              disabled={aiIsThinking}
              placeholder={aiIsThinking ? "Espere que el modelo de razonamiento termine..." : "Escriba un comando o pregunta al Agente..."}
              className="flex-1 bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800 focus:border-cyan-500 focus:outline-none text-[11px] text-white font-mono placeholder:text-zinc-600 disabled:opacity-50"
              autoFocus
            />
            <button
              type="submit"
              disabled={aiIsThinking}
              className="px-3.5 py-1.5 bg-[#d946ef]/10 hover:bg-[#d946ef]/20 text-[#f472b6] font-bold uppercase rounded border border-[#d946ef]/20 transition active:scale-95 text-[10px] flex items-center space-x-1 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <span>CMD</span>
              <CornerDownLeft size={10} className="stroke-[3]" />
            </button>
          </form>
        </div>

        {/* RIGHT AREA: COMBINES NET MONITOR (TOP) AND MONITOR METRICS (BOTTOM) */}
        <div className={`flex flex-col flex-1 min-h-0 ${
          activeMobileTab === "ai" ? "hidden md:flex" : "flex"
        }`}>
          
          {/* PANEL R-1: CMINEWAR NETWORK & FIREWALL TUI (45% height) */}
          <div className={`flex-col border-b border-zinc-900 min-h-0 ${
            activeMobileTab === "network" ? "flex h-full" : "hidden md:flex md:h-[42%]"
          }`}>
            <div className="bg-zinc-950 text-cyan-400 border-b border-zinc-900 px-4 py-2 flex items-center justify-between select-none shrink-0">
              <span className="font-bold tracking-wide flex items-center space-x-1.5">
                <Wifi size={11} className="text-cyan-455" />
                <span>cminewar-network-panel (Interfaces & Firewall TUI)</span>
              </span>
              <span className="text-[10px] text-zinc-650 font-mono font-bold">Pane 0.1</span>
            </div>

            {/* Network console and status monitor */}
            <div className="flex-1 bg-black p-4 overflow-y-auto space-y-3 font-mono text-[10.5px]">
              
              {/* Retro Graphic Heading Box */}
              <div className="border border-zinc-800 bg-zinc-950/60 rounded-md p-3 text-center text-cyan-400 max-w-sm mx-auto select-none border-dashed">
                <p className="font-bold tracking-widest text-[#2cbe7f]">╔═════════════════════════════════════════════════╗</p>
                <p className="font-extrabold text-[#2cbe7f] text-[10px]">║    🌐 GESTOR DE COMUNICACIONES CMINEWAR OS ║</p>
                <p className="font-bold tracking-widest text-[#2cbe7f]">╚═════════════════════════════════════════════════╝</p>
              </div>

              {/* Status block grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto select-none bg-stone-950/40 p-3 rounded border border-zinc-900 pt-1">
                <div>
                  <span className="text-zinc-500 font-bold block mb-1">CORTAFUEGOS:</span>
                  {isFirewallBlocked ? (
                    <span className="bg-rose-950/30 border border-rose-900/40 text-rose-400 px-2 py-0.5 rounded font-black text-[9.5px]">
                      🔒 WAN BLOQUEADA (Aislamiento Completo)
                    </span>
                  ) : (
                    <span className="bg-emerald-950/30 border border-emerald-900/40 text-emerald-450 px-2 py-0.5 rounded font-black text-[9.5px]">
                      🟢 WAN + LAN DIRECTO (Abierto)
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-zinc-400">
                  <span className="text-zinc-500 font-bold block mb-0.5">INTERFACES RF:</span>
                  <div className="flex justify-between">
                    <span>* [WiFi Dev]</span>
                    <span className="text-emerald-400 font-semibold">Activo (wpa_supplicant)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>* [Bluetooth]</span>
                    <span className="text-cyan-450 font-semibold">Simulado (bluez)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>* [LTE / 5G]</span>
                    <span className="text-cyan-450 font-semibold">Listo (ModemManager)</span>
                  </div>
                </div>
              </div>

              {/* Logger console actions feedback */}
              <div className="border border-zinc-900 bg-zinc-950 p-2.5 rounded text-[10px] text-zinc-500 overflow-y-auto max-h-[110px] max-w-lg mx-auto">
                <p className="text-zinc-600 font-bold border-b border-zinc-900/70 pb-1 mb-1.5 uppercase tracking-wide">Registro de eventos RF:</p>
                {networkLogs.map((nl, idx) => (
                  <p key={idx} className="leading-tight select-text select-all font-mono">
                    {nl}
                  </p>
                ))}
              </div>

              {/* Interactive simulated TUI action keys */}
              <div className="max-w-lg mx-auto">
                <p className="text-zinc-600 text-center uppercase tracking-widest font-bold text-[9px] mb-2 select-none">
                  Controles de Administrador [1-5, r]:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 select-none">
                  {[
                    { id: 1, label: "[1] Bloquear WAN" },
                    { id: 2, label: "[2] Habilitar WAN" },
                    { id: 3, label: "[3] Escaneo WiFi" },
                    { id: 4, label: "[4] Escaneo BT" },
                    { id: 5, label: "[5] Info LTE Modem" },
                    { id: 6, label: "[r] Refrescar Pane" }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => handleNetworkAction(btn.id)}
                      className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-[9.5px] font-bold text-slate-300 hover:text-white transition cursor-pointer active:scale-95 hover:bg-zinc-850"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* PANEL R-2: PERFORMANCE HTOP-BTOP SIMULATOR (55% height) */}
          <div className={`flex flex-col min-h-0 ${
            activeMobileTab === "monitor" ? "flex h-full" : "hidden md:flex md:flex-1"
          }`}>
            <div className="bg-zinc-950 text-cyan-400 border-b border-zinc-900 px-4 py-2 flex items-center justify-between select-none shrink-0">
              <span className="font-bold tracking-wide flex items-center space-x-1.5">
                <Activity size={11} className="text-emerald-400 animate-pulse" />
                <span>btop v1.1.2 - Host Core Activity Monitor</span>
              </span>
              <span className="text-[10px] text-zinc-650 font-mono font-bold">Pane 0.2</span>
            </div>

            {/* Performance metrics display */}
            <div className="flex-1 bg-black p-4 overflow-y-auto space-y-4 font-mono text-[10px]">
              
              {/* Top info and stats columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 select-none text-left">
                
                {/* HOST STATS BOX */}
                <div className="border border-zinc-800 rounded bg-zinc-950 p-2.5">
                  <p className="text-yellow-400 font-bold uppercase tracking-wider mb-2 text-[9px] border-b border-zinc-90 w-max pb-0.5">SISTEMA HOST</p>
                  <p className="text-zinc-550 leading-relaxed">OS: <strong className="text-slate-200">cminewar-debian</strong></p>
                  <p className="text-zinc-550 leading-relaxed">Núcleo: <strong className="text-slate-200">5.16.x-x86_64</strong></p>
                  <p className="text-zinc-550 leading-relaxed">CPU: <strong className="text-slate-200">Cortex-8 virtual x86</strong></p>
                  <p className="text-zinc-550 leading-relaxed">Hilos de CPU: <strong className="text-slate-200">8 Cores Activos</strong></p>
                </div>

                {/* TEMPERATURE & GRAPH BOX */}
                <div className="border border-zinc-800 rounded bg-zinc-950 p-2.5 text-left">
                  <p className="text-pink-400 font-bold uppercase tracking-wider mb-2 text-[9px] border-b border-zinc-90 w-max pb-0.5">TEMPERATURA NUCLEO</p>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl font-black text-[#f43f5e] font-mono">{cpuTemp.toFixed(1)}°C</span>
                    <span className="text-[8.5px] bg-red-950/20 text-rose-400 border border-red-950 px-1 py-0.5 rounded uppercase font-black animate-pulse">
                      Supervisor Activo
                    </span>
                  </div>
                  <p className="text-zinc-550 leading-relaxed mt-2 select-none tracking-widest text-[#f43f5e]/80">
                    {`📈 ` + "▂▄▆▒█░".repeat(3) + " ..."}
                  </p>
                </div>

                {/* MEMORY USAGE BOX */}
                <div className="border border-zinc-800 rounded bg-zinc-950 p-2.5 text-left">
                  <p className="text-cyan-400 font-bold uppercase tracking-wider mb-2 text-[9px] border-b border-zinc-90 w-max pb-0.5">MEMORIA RAM (SHM)</p>
                  <p className="text-zinc-550 mb-1">Carga de RAM: <strong className="text-slate-200">{ramLoad.toFixed(2)}%</strong></p>
                  <pre className="text-cyan-400 leading-normal mb-1">{getBtopBar(Math.round(ramLoad))}</pre>
                  <p className="text-zinc-550 leading-none">VFS swap: <span className="text-emerald-400">14.6 GB / 32 GB (45%)</span></p>
                </div>

              </div>

              {/* CORES BAR GRAPH LIST */}
              <div className="border border-zinc-800 rounded bg-zinc-950 p-3 select-none text-left">
                <p className="text-emerald-400 font-mono font-bold uppercase tracking-wide mb-2.5 text-[9px]">CARGA INTERNA DE PROCESOS POR HILO (CPU CORES):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-mono text-[9.5px]">
                  {cpuLoads.map((load, index) => (
                    <div key={index} className="flex justify-between items-center text-zinc-400">
                      <span className="font-extrabold text-[9px] uppercase">Core {index}:</span>
                      <pre className="text-emerald-405 font-semibold text-[9.5px] font-mono leading-none">{getBtopBar(load)}</pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* SIMULATED PROCESS LOGGER WINDOW */}
              <div className="border border-zinc-850 rounded bg-zinc-950 overflow-hidden text-left shadow-md">
                <div className="bg-zinc-900 px-3.5 py-1.5 flex items-center justify-between border-b border-zinc-850 select-none">
                  <span className="font-bold text-zinc-400 text-[9px] uppercase tracking-wider">Hilos de ejecución en daemon tmux (Omarchy Workspace):</span>
                  <span className="text-[8px] bg-emerald-950/20 text-emerald-400 px-1 py-0.5 rounded font-bold">12 subprocesos</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[9px.5] border-collapse min-w-[340px]">
                    <thead>
                      <tr className="border-b border-zinc-900 bg-stone-950 text-zinc-500 uppercase select-none font-bold">
                        <th className="p-1 px-3.5">PID</th>
                        <th className="p-1">USUARIO</th>
                        <th className="p-1">CPU%</th>
                        <th className="p-1">MEM%</th>
                        <th className="p-1">PROCESO CMD (BUCLE)</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-400 select-text">
                      {[
                        { pid: "1200", user: "root", cpu: "3.2%", mem: "1.8%", cmd: "cminewar-omarchy-dashboard --session-bind" },
                        { pid: "1205", user: "root", cpu: aiIsThinking ? "39.4%" : "1.2%", mem: "12.5%", cmd: "cminewar-ai-cli (antigravity-preview)" },
                        { pid: "1209", user: "root", cpu: "0.4%", mem: "0.6%", cmd: "cminewar-network-panel --interface-listen" },
                        { pid: "1214", user: "root", cpu: "2.1%", mem: "3.1%", cmd: "systemd-udevd --daemon-active" },
                        { pid: "1222", user: "root", cpu: "0.5%", mem: "0.2%", cmd: "wpa_supplicant -iwlan0 -c/etc/wpa.conf" },
                        { pid: "1231", user: "root", cpu: "1.2%", mem: "1.0%", cmd: "htop --delay=15" },
                        { pid: "1245", user: "root", cpu: "0.0%", mem: "0.1%", cmd: "sleep 5" }
                      ].map((proc) => (
                        <tr key={proc.pid} className="border-b border-zinc-900/50 hover:bg-zinc-900/40">
                          <td className="p-1 px-3.5 font-bold text-zinc-500">{proc.pid}</td>
                          <td className="p-1 text-zinc-400">{proc.user}</td>
                          <td className="p-1 text-emerald-405 font-bold">{proc.cpu}</td>
                          <td className="p-1 text-cyan-405 font-bold">{proc.mem}</td>
                          <td className="p-1 text-slate-300 font-mono truncate max-w-[190px]">{proc.cmd}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
