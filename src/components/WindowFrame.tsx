import React, { useRef, useState, useEffect } from "react";
import { WindowState } from "../types";
import { Minus, Square, Copy, X } from "lucide-react";

interface WindowFrameProps {
  key?: any;
  win: WindowState;
  touchMode?: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onMove: (pos: { x: number; y: number }) => void;
  onResize: (size: { width: number; height: number }) => void;
  children: React.ReactNode;
}

export default function WindowFrame({
  win,
  touchMode = false,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
  children,
}: WindowFrameProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle Drag Start
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag on titlebar click, ignore buttons
    if ((e.target as HTMLElement).closest("button")) return;
    
    onFocus();
    
    if (win.isMaximized) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - win.position.x,
      y: e.clientY - win.position.y,
    });
    
    // Set pointer capture to track drag outside window bounds
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Handle Dragging
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    // Boundary check within screen sizes
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;
    
    // Restrict top bar to not go hidden below taskbar or browser limits
    if (newY < 0) newY = 0;
    
    onMove({ x: newX, y: newY });
  };

  // Handle Drag End
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (!win.isOpen || win.isMinimized) {
    return null;
  }

  // Handle resizing (simple bottom-right handle)
  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onFocus();
    
    const startWidth = win.size.width;
    const startHeight = win.size.height;
    const startX = e.clientX;
    const startY = e.clientY;
    
    const onResizeMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      onResize({
        width: Math.max(300, startWidth + deltaX),
        height: Math.max(200, startHeight + deltaY),
      });
    };
    
    const onResizeUp = () => {
      window.removeEventListener("pointermove", onResizeMove);
      window.removeEventListener("pointerup", onResizeUp);
    };
    
    window.addEventListener("pointermove", onResizeMove);
    window.addEventListener("pointerup", onResizeUp);
  };

  const style: React.CSSProperties = win.isMaximized
    ? {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: win.zIndex,
      }
    : {
        position: "absolute",
        left: `${win.position.x}px`,
        top: `${win.position.y}px`,
        width: `${win.size.width}px`,
        height: `${win.size.height}px`,
        zIndex: win.zIndex,
      };

  return (
    <div
      ref={windowRef}
      style={style}
      onClick={onFocus}
      id={`win-${win.id}`}
      className="flex flex-col bg-slate-900 border border-slate-700/60 rounded-lg shadow-2xl overflow-hidden select-none"
    >
      {/* Titlebar with touch-none to prevent browser scroll during touch dragging */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`flex items-center justify-between px-3 bg-slate-950 border-b border-slate-800 cursor-move text-slate-300 font-medium select-none touch-none ${
          touchMode ? "py-3.5 text-base" : "py-2 text-sm"
        }`}
      >
        <div className="flex items-center space-x-2 truncate">
          {/* Logo representation of OpenClaw OS */}
          <span className={`text-emerald-400 font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-emerald-500/30 ${
            touchMode ? "text-sm scale-105" : "text-xs"
          }`}>
            🦞 Core
          </span>
          <span className={`truncate tracking-wide font-sans ${touchMode ? "font-semibold" : ""}`}>{win.title}</span>
        </div>
        
        {/* Window controls with padded touch targets */}
        <div className={`flex items-center shrink-0 ${touchMode ? "space-x-2 ml-6" : "space-x-1 ml-4"}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            id={`btn-minimize-${win.id}`}
            className={`rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center ${
              touchMode ? "p-2 min-w-[32px] min-h-[32px]" : "p-1"
            }`}
            title="Minimizar"
          >
            <Minus size={touchMode ? 18 : 14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            id={`btn-maximize-${win.id}`}
            className={`rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center ${
              touchMode ? "p-2 min-w-[32px] min-h-[32px]" : "p-1"
            }`}
            title={win.isMaximized ? "Restaurar" : "Maximizar"}
          >
            {win.isMaximized ? <Copy size={touchMode ? 17 : 13} /> : <Square size={touchMode ? 17 : 13} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            id={`btn-close-${win.id}`}
            className={`rounded hover:bg-red-900/60 text-slate-400 hover:text-red-200 transition-colors flex items-center justify-center ${
              touchMode ? "p-2 min-w-[32px] min-h-[32px]" : "p-1"
            }`}
            title="Cerrar"
          >
            <X size={touchMode ? 18 : 14} />
          </button>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="flex-1 min-h-0 text-slate-100 flex flex-col bg-slate-900 relative">
        {children}
      </div>

      {/* Resize handle (only regular windows) with touch-friendly zone */}
      {!win.isMaximized && (
        <div
          onPointerDown={handleResizeStart}
          className={`absolute bottom-0 right-0 cursor-se-resize flex items-end justify-end pointer-events-auto touch-none ${
            touchMode ? "w-8 h-8 p-1 bg-emerald-500/10 border-t border-l border-emerald-500/20 rounded-tl-lg" : "w-4 h-4"
          }`}
          style={{ zIndex: 100 }}
        >
          <svg width={touchMode ? "14" : "10"} height={touchMode ? "14" : "10"} viewBox="0 0 10 10" className={`text-slate-500 mr-0.5 mb-0.5 pointer-events-none ${touchMode ? "text-emerald-400 scale-125" : ""}`}>
            <path d="M10,0 L10,10 L0,10 Z M6,10 L10,6 Z M2,10 L10,2 Z" fill="currentColor" fillOpacity={touchMode ? "0.5" : "0.25"} />
          </svg>
        </div>
      )}
    </div>
  );
}

// Proyecto propiedad de Yonah Llanes
