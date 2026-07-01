import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Send, RefreshCw, Terminal, Activity, Info } from "lucide-react";
import { cminewarFetch } from "../utils/api";

interface OpenClawCoreProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function OpenClawCore({ chatHistory, setChatHistory }: OpenClawCoreProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isFirstMountRef = useRef(true);
  const prevHistoryLengthRef = useRef(chatHistory.length);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const prevLength = prevHistoryLengthRef.current;
    prevHistoryLengthRef.current = chatHistory.length;

    // Check if user is scrolled near bottom
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 180;

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      container.scrollTop = container.scrollHeight;
      return;
    }

    if (chatHistory.length > prevLength) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      const isUserSent = lastMessage && lastMessage.role === "user";

      if (isUserSent || isNearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [chatHistory]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: input,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const historyPayload = chatHistory.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await cminewarFetch("/api/cminewar/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          history: historyPayload,
        }),
      });

      if (!res.ok) throw new Error("Fallo de comunicación con el núcleo Antigravity.");

      const data = await res.json();
      
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "model",
        text: data.text,
        timestamp: new Date(),
      };

      setChatHistory((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "system",
        text: `Error de enlace Antigravity CLI: ${err.message || "La conexión ha fallado."}`,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    if (confirm("¿Reiniciar búfer de memoria del núcleo cognitivo Antigravity CLI (agy)?")) {
      setChatHistory([
        {
          id: "claw-welcome",
          role: "model",
          text: "¡Sistemas listos! Hola, soy **Antigravity CLI** (mando `agy`), el módulo cognitivo central de CMineWar OS. Puedo interactuar con tus comandos de terminal o guiarte de forma directa a través de esta terminal interactiva. Escribe tus dudas sobre el entorno de desarrollo o los comandos de Linux en Debian y las ejecutaré sin ninguna traba de permisos.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 border-t border-slate-850 h-full font-mono">
      {/* Upper Status Hub */}
      <div className="flex items-center justify-between p-3 bg-slate-950 border-b border-slate-900 select-none shrink-0 text-xs">
        <div className="flex items-center space-x-2">
          <Terminal size={16} className="text-purple-400" />
          <span className="font-bold text-slate-300">Antigravity CLI Hub (agy)</span>
          <span className="px-1.5 py-0.2 bg-purple-500/10 border border-purple-500/20 rounded text-[9px] text-purple-400 font-bold uppercase">
            agy-cli-active
          </span>
        </div>
        <button
          onClick={clearConversation}
          className="p-1 hover:bg-slate-900 rounded text-slate-500 hover:text-slate-300 transition"
          title="Reiniciar hilo de memoria"
          id="btn-clear-chat"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Suggestion Quick Chips styled as terminal tags */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 border-b border-slate-900 shrink-0 select-none">
        <button
          onClick={() => setInput("¿Cuáles son tus características como núcleo de CMineWar OS?")}
          className="text-[9.5px] text-slate-400 bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1 hover:border-purple-500/50 hover:text-purple-300 transition cursor-pointer"
        >
          $ agy --info
        </button>
        <button
          onClick={() => setInput("Explícame cómo funciona el comando cd y ls de linux")}
          className="text-[9.5px] text-slate-400 bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1 hover:border-purple-500/50 hover:text-purple-300 transition cursor-pointer"
        >
          $ agy --guide-sh
        </button>
        <button
          onClick={() => setInput("Diagnóstico térmico y de CPU del hardware")}
          className="text-[9.5px] text-slate-400 bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1 hover:border-purple-500/50 hover:text-purple-300 transition cursor-pointer"
        >
          $ agy --hardware
        </button>
      </div>

      {/* Messages Console Box */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/80" 
        id="claw-chat-messages"
      >
        {chatHistory.map((m) => {
          const isUser = m.role === "user";
          const isSys = m.role === "system";

          if (isSys) {
            return (
              <div key={m.id} className="p-2.5 bg-rose-950/10 border border-rose-900/30 rounded text-rose-400 text-[10px] leading-relaxed">
                <span className="font-bold uppercase">[ERROR SÍLEX]:</span> {m.text}
              </div>
            );
          }

          if (isUser) {
            return (
              <div key={m.id} className="text-xs select-text leading-relaxed">
                <p className="text-slate-400">
                  <span className="text-emerald-500 font-bold">root@cminewar:~$</span> agy "{m.text}"
                </p>
              </div>
            );
          }

          // Model / Assistant block
          return (
            <div key={m.id} className="text-xs select-text pb-4 border-b border-slate-900/40 last:border-b-0 space-y-1">
              <div className="text-[9.5px] text-purple-400 font-bold uppercase tracking-wider flex items-center space-x-1.5 select-none">
                <Activity size={11} className="text-purple-400 animate-pulse" />
                <span>[Antigravity CLI Response]</span>
              </div>
              
              <div className="text-slate-300 pl-4 border-l-2 border-purple-500/20 whitespace-pre-wrap leading-relaxed">
                {m.text.split("\n").map((line, lIdx) => {
                  if (line.startsWith("```")) {
                    return null;
                  }
                  
                  // Simple regex for bold
                  const parts = line.split("**");
                  return (
                    <React.Fragment key={lIdx}>
                      {parts.map((p, pIdx) =>
                        pIdx % 2 === 1 ? (
                          <strong key={pIdx} className="text-emerald-400 font-black">
                            {p}
                          </strong>
                        ) : (
                          p
                        )
                      )}
                      {lIdx < m.text.split("\n").length - 1 && <br />}
                    </React.Fragment>
                  );
                })}
              </div>
              
              <div className="text-[9px] text-slate-600 pl-4 select-none">
                {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="text-xs select-none py-1 flex items-center space-x-2 text-purple-400 animate-pulse">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
            <span>[agy] Procesando petición cognitiva en caliente...</span>
          </div>
        )}
      </div>

      {/* Monospace Interactive Shell Input */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-900 flex items-center space-x-2.5 shrink-0 select-none">
        <span className="text-emerald-400 font-bold text-xs shrink-0 select-none">root@cminewar:~$ agy</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="escribe tu consulta..."
          className="flex-1 bg-slate-900/70 border border-slate-850 rounded px-3 py-1.5 text-xs text-slate-100 placeholder-slate-700 focus:outline-none focus:border-purple-500/50"
          id="chat-input-claw"
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          className="p-1.5 bg-purple-900 hover:bg-purple-800 rounded text-purple-200 border border-purple-700/20 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0 cursor-pointer"
          title="Ejecutar"
          id="btn-send-claw"
          disabled={isLoading || !input.trim()}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
