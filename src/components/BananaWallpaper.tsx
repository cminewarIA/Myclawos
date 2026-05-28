import React, { useState, useEffect } from "react";
import { Sliders, Sun, Moon, Sparkles, RefreshCw, Zap, Bot, Laptop } from "lucide-react";
import DragonLogo from "./DragonLogo";

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface BananaWallpaperProps {
  services: ServiceItem[];
}

export default function BananaWallpaper({ services }: BananaWallpaperProps) {
  // Current local time hour state
  const [actualHour, setActualHour] = useState(() => new Date().getHours());
  
  // Custom simulation hour so users can easily play and test other hours
  const [simulatedHour, setSimulatedHour] = useState<number | null>(null);

  // Keep actualHour synced to systemic local clock
  useEffect(() => {
    const timer = setInterval(() => {
      setActualHour(new Date().getHours());
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  const activeHour = simulatedHour !== null ? simulatedHour : actualHour;

  // Determine theme style, naming, and colors based on active hour
  let themeName = "Late Night Cosmic Purple";
  let bgGradient = "from-slate-950 via-[#0e091b] to-slate-950";
  let primaryGlow = "#a855f7"; // purple
  let secondaryGlow = "#6366f1"; // indigo
  let nodeStroke = "rgba(168, 85, 247, 0.45)";
  let gridColor = "rgba(99, 102, 241, 0.05)";
  let matrixText = "text-purple-400";
  let statusBadge = "bg-purple-900/40 border-purple-500/30 text-purple-300";

  if (activeHour >= 6 && activeHour < 12) {
    themeName = "Solar Dawn Amber & Gold";
    bgGradient = "from-slate-950 via-[#1f1b0a] to-slate-950";
    primaryGlow = "#eab308"; // amber
    secondaryGlow = "#f97316"; // orange
    nodeStroke = "rgba(234, 179, 8, 0.45)";
    gridColor = "rgba(249, 115, 22, 0.05)";
    matrixText = "text-amber-400";
    statusBadge = "bg-amber-900/40 border-amber-500/30 text-amber-300";
  } else if (activeHour >= 12 && activeHour < 18) {
    themeName = "Cyber Cybernetic Cyan & Mint";
    bgGradient = "from-slate-950 via-[#0a181c] to-[#01080d]";
    primaryGlow = "#06b6d4"; // cyan
    secondaryGlow = "#10b981"; // emerald
    nodeStroke = "rgba(6, 182, 212, 0.45)";
    gridColor = "rgba(16, 185, 129, 0.06)";
    matrixText = "text-cyan-400";
    statusBadge = "bg-cyan-900/40 border-cyan-500/30 text-cyan-300";
  } else if (activeHour >= 18 && activeHour < 24) {
    themeName = "Sunset Twilight Coral & Crimson";
    bgGradient = "from-slate-950 via-[#220712] to-slate-950";
    primaryGlow = "#f43f5e"; // rose
    secondaryGlow = "#d946ef"; // fuchsia
    nodeStroke = "rgba(244, 63, 94, 0.45)";
    gridColor = "rgba(217, 70, 239, 0.05)";
    matrixText = "text-pink-400";
    statusBadge = "bg-rose-900/40 border-rose-500/30 text-rose-300";
  }

  // Generate 2D coordinates for services mapping in SVG space
  // Central core is at (450, 320)
  const centerX = 550;
  const centerY = 330;
  const radius = 240;

  // Let's list the core services to display
  // Include standard service list & make sure they have layout positions
  const displayServices = [
    { id: "openclaw-brain", name: "OpenClaw AI Brain System", status: "active", isCore: true },
    ...services.map(s => ({ ...s, isCore: false }))
  ];

  const nodes = displayServices.map((svc, idx) => {
    // Distribute services evenly around the circle
    const angle = (2 * Math.PI * idx) / displayServices.length;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return {
      ...svc,
      x,
      y,
      angle
    };
  });

  return (
    <div 
      className={`absolute inset-0 z-0 bg-gradient-to-b ${bgGradient} transition-all duration-1000 overflow-hidden w-full h-full select-none pointer-events-none`}
      id="banana-wallpaper-container"
    >
      {/* 1. Fine Desktop Grid Mesh */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="desktop-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={gridColor} strokeWidth="1" />
            <circle cx="0" cy="0" r="1.5" fill={primaryGlow} opacity="0.15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#desktop-grid)" />
      </svg>

      {/* 2. Abstract Ambient Back-glow circles */}
      <div 
        className="absolute rounded-full blur-[140px] opacity-[0.14] transition-all duration-1000 animate-pulse pointer-events-none"
        style={{
          width: "550px",
          height: "550px",
          backgroundColor: primaryGlow,
          left: `${centerX - 275}px`,
          top: `${centerY - 275}px`,
        }}
      />
      <div 
        className="absolute rounded-full blur-[200px] opacity-[0.08] transition-all duration-1000 pointer-events-none"
        style={{
          width: "800px",
          height: "800px",
          backgroundColor: secondaryGlow,
          left: `${centerX - 400}px`,
          top: `${centerY - 450}px`,
        }}
      />

      {/* 3. The Generative Wireframe & Sockets Map SVG layer */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        style={{ opacity: 0.82 }}
        viewBox="0 0 1100 680" 
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Glowing Filters */}
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="core-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Glowing dot gradient along curves */}
          <linearGradient id="wire-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryGlow} stopOpacity="0.8" />
            <stop offset="100%" stopColor={secondaryGlow} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Dynamic Connected Bus Wires */}
        {nodes.map((node, i) => {
          const isServiceActive = node.status === "active";
          // Perfect curved Bezier cables going from center banana to the service endpoint
          // Curve pulls slightly towards the angle bisector for cosmic look
          const midX = (centerX + node.x) / 2 + Math.cos(node.angle + 0.4) * 35;
          const midY = (centerY + node.y) / 2 + Math.sin(node.angle + 0.4) * 35;
          const pathD = `M ${centerX} ${centerY} Q ${midX} ${midY} ${node.x} ${node.y}`;

          return (
            <g key={node.id || `node-${i}`}>
              {/* Under-shadow of cable */}
              <path
                d={pathD}
                fill="none"
                stroke="rgba(15, 23, 42, 0.8)"
                strokeWidth="4"
              />
              {/* The active color cable */}
              <path
                d={pathD}
                fill="none"
                stroke={isServiceActive ? nodeStroke : "rgba(71, 85, 105, 0.25)"}
                strokeWidth="1.5"
                strokeDasharray={isServiceActive ? "none" : "3,3"}
                className="transition-all duration-700"
              />
              
              {/* Dynamic traveling data packets for ACTIVE services */}
              {isServiceActive && (
                <circle r="4" fill={secondaryGlow} filter="url(#neon-glow)">
                  <animateMotion
                    path={pathD}
                    dur={`${2.4 + (i % 3) * 0.8}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Drawing Outer Star Field Particles tailored to active simulate hour value */}
        {Array.from({ length: 28 }).map((_, stIdx) => {
          // Semi-random seeded coordinate patterns depending on the star index
          const sRad = (stIdx * 45) % 360;
          const sDist = 180 + ((stIdx * 95) % 400);
          const sX = centerX + sDist * Math.cos(sRad * Math.PI / 180);
          const sY = centerY + sDist * Math.sin(sRad * Math.PI / 180);
          const starsSize = 1.2 + (stIdx % 3) * 0.7;

          return (
            <circle
              key={`star-${stIdx}`}
              cx={sX}
              cy={sY}
              r={starsSize}
              fill={stIdx % 2 === 0 ? primaryGlow : secondaryGlow}
              opacity={0.12 + Math.sin((activeHour + stIdx) * 1.5) * 0.1}
            />
          );
        })}

        {/* Central Core Circle Node (Banana Core Platform) */}
        <g transform={`translate(${centerX}, ${centerY})`}>
          {/* Pulsing Backplane Halo */}
          <circle r="65" fill={primaryGlow} opacity="0.08" filter="url(#core-glow)">
            <animate attributeName="r" values="55;75;55" dur="4s" repeatCount="indefinite" />
          </circle>
          
          <circle r="48" fill="rgba(15, 23, 42, 0.9)" stroke={primaryGlow} strokeWidth="1.5" filter="url(#neon-glow)" />
          <circle r="42" fill="rgba(2, 6, 23, 0.95)" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />

          {/* Custom Dragon Logo in the center of the kernel wallpaper */}
          <foreignObject x="-42" y="-42" width="84" height="84">
            <div className="w-full h-full flex items-center justify-center">
              <DragonLogo size={80} glow={true} />
            </div>
          </foreignObject>

          {/* Subtext around core */}
          <path id="core-text-path" d="M -42,0 A 42,42 0 1,1 42,0" fill="none" />
          <text fontSize="6.5" fontWeight="bold" fill="rgba(255, 255, 255, 0.45)" letterSpacing="1.2" className="font-mono">
            <textPath href="#core-text-path" startOffset="50%" textAnchor="middle">
              OPENCLAW KERNEL COGNITIVE FORCE
            </textPath>
          </text>
        </g>

        {/* Render Outer Service Nodes */}
        {nodes.map((node, i) => {
          const isActive = node.status === "active";
          
          return (
            <g key={`svc-node-${node.id || i}`} transform={`translate(${node.x}, ${node.y})`}>
              {/* Outer orbit boundary */}
              <circle r="18" fill="rgba(15, 23, 42, 0.95)" stroke={isActive ? primaryGlow : "rgba(71, 85, 105, 0.3)"} strokeWidth="1.2" filter={isActive ? "url(#neon-glow)" : undefined} className="transition-all duration-700" />
              <circle r="14" fill="rgba(2, 6, 23, 0.98)" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />

              {/* Service custom mini layout symbol */}
              {node.isCore ? (
                <text y="3" textAnchor="middle" fill="#10b981" fontSize="9" className="font-sans font-extrabold animate-pulse">🤖</text>
              ) : (
                <circle r="3.5" fill={isActive ? secondaryGlow : "rgba(71, 85, 105, 0.4)"} className="transition-all duration-700" />
              )}
              
              {/* Meta Label Display Overlay (Responsive Placement aligned relative to position angle) */}
              <g transform={`translate(${Math.cos(node.angle) * 32}, ${Math.sin(node.angle) * 12 + 4})`}>
                <rect
                  x={Math.cos(node.angle) >= 0 ? 0 : -140}
                  y="-14"
                  width="140"
                  height="26"
                  rx="4"
                  fill="rgba(10, 15, 30, 0.92)"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="0.8"
                  className="shadow-2xl"
                />
                
                {/* Text Content */}
                <text
                  x={Math.cos(node.angle) >= 0 ? 8 : -132}
                  y="1"
                  fontSize="8.5"
                  fontWeight="bold"
                  fill="rgba(255, 255, 255, 0.88)"
                  className="font-sans font-semibold"
                >
                  {node.name.length > 20 ? `${node.name.slice(0, 19)}...` : node.name}
                </text>
                
                {/* Secondary status tag display */}
                <text
                  x={Math.cos(node.angle) >= 0 ? 8 : -132}
                  y="9"
                  fontSize="6.5"
                  fontFamily="monospace"
                  fill={isActive ? primaryGlow : "rgba(148, 163, 184, 0.5)"}
                  letterSpacing="0.5"
                  className="font-bold uppercase"
                >
                  {node.isCore ? "ACTIVE" : node.status.toUpperCase()} • {isActive ? "LOAD: 8.4MW" : "STDBY"}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* 4. Elegant Cybernetic Floating Widget Controls & Hour Simulation Overlays */}
      <div 
        className="absolute bottom-16 right-6 z-[1] pointer-events-auto max-w-xs w-full bg-slate-950/90 hover:bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 shadow-2xl space-y-3 font-mono text-[10.5px] text-slate-400 select-text animate-fade-in"
        id="nano-banana-wallpaper-widget"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-1.5">
            <Sparkles size={12} className={matrixText} />
            <span className="font-bold text-slate-200 uppercase tracking-widest text-[9.5px]">Nano Banana Dynamic Background</span>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Wallpaper Daemon Activo" />
        </div>

        {/* Telemetry rows */}
        <div className="space-y-1.5 text-left text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-900 leading-relaxed">
          <div className="flex justify-between">
            <span className="text-slate-600">Simulación / Hora:</span>
            <span className={matrixText}>{activeHour.toString().padStart(2, '0')}:00 UTC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Esquema Visual:</span>
            <span className="text-slate-300 font-semibold truncate max-w-[120px]">{themeName.split(" ").slice(2).join(" ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Nudos de Red Asimilados:</span>
            <span className="text-emerald-400 font-bold">{displayServices.length} Sockets</span>
          </div>
          <p className="text-[9px] text-slate-500 italic leading-normal border-t border-slate-900/40 mt-1.5 pt-1.5">
            💡 Nano Banana está asimilando a OpenClaw y a los {services.filter(s => s.status === 'active').length} servicios instalados para moldear su firma espectral.
          </p>
        </div>

        {/* Interactive Play Controls */}
        <div className="space-y-2 pt-1 border-t border-slate-900">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Simular ciclo de hora:</span>
            {simulatedHour !== null && (
              <button 
                onClick={() => setSimulatedHour(null)}
                className="text-[9px] text-rose-400 hover:text-rose-300 transition flex items-center space-x-0.5 border border-rose-950 px-1 py-0.5 rounded bg-rose-950/20"
                title="Sincronizar fondo con hora real del sistema"
              >
                <RefreshCw size={8} />
                <span>Restaurar Real</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-1">
            {[0, 6, 12, 18].map((hr) => {
              const ranges = [
                { title: "Noche", emoji: "🌌", isMatch: activeHour >= 0 && activeHour < 6 },
                { title: "Mañana", emoji: "🌅", isMatch: activeHour >= 6 && activeHour < 12 },
                { title: "Tarde", emoji: "☀️", isMatch: activeHour >= 12 && activeHour < 18 },
                { title: "Ocaso", emoji: "🌇", isMatch: activeHour >= 18 && activeHour < 24 },
              ];
              const range = hr === 0 ? ranges[0] : hr === 6 ? ranges[1] : hr === 12 ? ranges[2] : ranges[3];
              const isSelected = range.isMatch;

              return (
                <button
                  key={hr}
                  onClick={() => setSimulatedHour(hr)}
                  className={`py-1 text-center rounded transition text-[9px] flex flex-col items-center justify-center border font-semibold ${
                    isSelected 
                      ? "bg-emerald-950 border-emerald-800 text-emerald-300 font-bold" 
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                  title={`Simular tema de ${range.title}`}
                >
                  <span className="text-xs mb-0.5">{range.emoji}</span>
                  <span>{hr.toString().padStart(2, '0')}h</span>
                </button>
              );
            })}
          </div>

          {/* Sockets notification hint */}
          <div className="text-[8px] text-slate-600 flex items-center justify-center space-x-1 text-center bg-slate-950 py-1 rounded">
            <span>Para cambiar servicios, use el <strong>Panel de Control</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
