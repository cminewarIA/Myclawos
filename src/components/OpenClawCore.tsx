import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Send, Bot, User, RefreshCw, Cpu, Database, HelpCircle } from "lucide-react";
import DragonLogo from "./DragonLogo";

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

    // Check if user is scrolled near the bottom (within 180px threshold)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 180;

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      container.scrollTop = container.scrollHeight;
      return;
    }

    // Only auto-scroll on new message insertions
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
      // Map history to simple format
      const historyPayload = chatHistory.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/cminewar/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          history: historyPayload,
        }),
      });

      if (!res.ok) throw new Error("Kernel link failed with error code");

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
        text: `Error de puente de comunicación CMineWar AI: ${err.message || "La conexión cognitiva ha fallado."}`,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    if (confirm("¿Reiniciar búfer de memoria del núcleo cognitivo de CMineWar AI?")) {
      setChatHistory([
        {
          id: "claw-welcome",
          role: "model",
          text: "¡Sistemas listos! Hola, soy **CMineWar AI**, el núcleo cognitivo virtual de este simulador Linux. Puedo interactuar con tus comandos de terminal o guiarte a través de la interfaz gráfica local. Escribe tus dudas sobre el sistema CMineWar OS u operabilidad de comandos Linux en Debian.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 border-t border-slate-800">
      {/* Upper Status Hub */}
      <div className="flex items-center justify-between p-3 bg-slate-950 border-b border-slate-800 select-none shrink-0 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <DragonLogo size={20} />
          <span className="font-semibold text-slate-300">CMineWar AI Cognitive Hub</span>
          <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/20 rounded font-mono text-[9px] text-emerald-400">
            Debian-Core Connected
          </span>
        </div>
        <button
          onClick={clearConversation}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
          title="Reiniciar hilo de memoria"
          id="btn-clear-chat"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Suggestion Quick Chips */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900/40 border-b border-slate-800/60 shrink-0 select-none">
        <button
          onClick={() => setInput("¿Cuáles son tus características como núcleo de CMineWar OS?")}
          className="text-[10px] text-slate-300 bg-slate-950 border border-slate-800 rounded px-2 py-1 hover:border-emerald-500/40 transition"
        >
          ¿Qué es CMineWar OS?
        </button>
        <button
          onClick={() => setInput("Explícame cómo funciona el comando cd y ls de linux")}
          className="text-[10px] text-slate-300 bg-slate-950 border border-slate-800 rounded px-2 py-1 hover:border-emerald-500/40 transition"
        >
          Comandos cd y ls 🐚
        </button>
        <button
          onClick={() => setInput("Cuéntame un chiste de programadores")}
          className="text-[10px] text-slate-300 bg-slate-950 border border-slate-800 rounded px-2 py-1 hover:border-emerald-500/40 transition"
        >
          Chiste informático 💻
        </button>
        <button
          onClick={() => setInput("Diagnóstico térmico y de CPU del hardware")}
          className="text-[10px] text-slate-300 bg-slate-950 border border-slate-800 rounded px-2 py-1 hover:border-emerald-500/40 transition"
        >
          Diagnóstico de Hardware 🛠️
        </button>
      </div>

      {/* Messages Stagger Box */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/60" 
        id="claw-chat-messages"
      >
        {chatHistory.map((m) => {
          const isUser = m.role === "user";
          const isSys = m.role === "system";

          if (isSys) {
            return (
              <div key={m.id} className="text-center p-2 bg-rose-950/20 border border-rose-900/40 rounded-md text-rose-300 text-[10px] font-mono leading-relaxed">
                {m.text}
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className={`flex items-start space-x-2.5 max-w-[85%] ${
                isUser ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                  isUser
                    ? "bg-slate-700 border-slate-600 text-slate-200"
                    : "bg-slate-950 border-slate-800 text-emerald-400"
                }`}
              >
                {isUser ? <User size={12} /> : <DragonLogo size={16} />}
              </div>

              <div
                className={`p-3 rounded-lg text-xs leading-relaxed ${
                  isUser
                    ? "bg-emerald-700/20 text-emerald-100 border border-emerald-600/20 rounded-tr-none"
                    : "bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none"
                }`}
              >
                {/* Parse Markdown-like styles manually for safe render (bolding and linebreaks) */}
                <span className="whitespace-pre-wrap break-words inline-block">
                  {m.text.split("\n").map((line, lIdx) => {
                    // Match code blocks
                    if (line.startsWith("```")) {
                      return null; // hide codeblock ticks
                    }
                    
                    // Simple regex for bold
                    const parts = line.split("**");
                    return (
                      <React.Fragment key={lIdx}>
                        {parts.map((p, pIdx) =>
                          pIdx % 2 === 1 ? <strong key={pIdx} className="text-emerald-400 font-semibold">{p}</strong> : p
                        )}
                        {lIdx < m.text.split("\n").length - 1 && <br />}
                      </React.Fragment>
                    );
                  })}
                </span>

                <div className="text-[9px] text-slate-500 mt-1.5 text-right select-none">
                  {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-2.5 max-w-[80%]">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border bg-slate-950 border-slate-800 text-emerald-400 animate-pulse">
              <DragonLogo size={16} />
            </div>
            <div className="p-3 bg-slate-950 text-slate-400 border border-slate-800 rounded-lg text-xs rounded-tl-none">
              <div className="flex items-center space-x-1.5 font-mono select-none">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span>Procesando hilos de kernel...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input box */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2 shrink-0 select-none">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta a CMineWar AI..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-md text-xs px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/55 font-sans"
          id="chat-input-claw"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="p-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-md text-white border border-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
          title="Enviar"
          id="btn-send-claw"
          disabled={isLoading || !input.trim()}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
