import React from "react";

interface DragonLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export default function DragonLogo({ size = 48, className = "", glow = true }: DragonLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`select-none overflow-visible ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Glow Filters */}
        <filter id="dragon-splatter-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="dragon-glow-heavy" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradients */}
        <radialGradient id="splatter-grad-orange" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#ea580c" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="splatter-grad-red" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#dc2626" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="dragon-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>

        <linearGradient id="gothic-c-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#020617" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* 1. ARTISTIC INK SPLATTERS / OVERLAYS (Emulating the orange splattered background) */}
      <g opacity="0.85">
        {/* Central warm backglow */}
        <circle cx="100" cy="100" r="75" fill="url(#splatter-grad-orange)" opacity="0.45" />
        <circle cx="100" cy="110" r="55" fill="url(#splatter-grad-red)" opacity="0.30" />
        
        {/* Spray & splat circles imitating paint droplets */}
        <circle cx="65" cy="55" r="14" fill="#f97316" opacity="0.5" filter="url(#dragon-splatter-blur)" />
        <circle cx="140" cy="80" r="18" fill="#f97316" opacity="0.45" filter="url(#dragon-splatter-blur)" />
        <circle cx="148" cy="130" r="12" fill="#ef4444" opacity="0.4" filter="url(#dragon-splatter-blur)" />
        <circle cx="60" cy="140" r="22" fill="#ea580c" opacity="0.45" filter="url(#dragon-splatter-blur)" />
        <circle cx="105" cy="50" r="11" fill="#ea580c" opacity="0.55" filter="url(#dragon-splatter-blur)" />
        <circle cx="120" cy="155" r="15" fill="#f43f5e" opacity="0.4" filter="url(#dragon-splatter-blur)" />

        {/* Tiny ink debris dots (reproducing the fine noise dots in the design) */}
        {[
          { cx: 45, cy: 75, r: 3 }, { cx: 52, cy: 45, r: 2 }, { cx: 155, cy: 60, r: 4 },
          { cx: 165, cy: 110, r: 3 }, { cx: 135, cy: 175, r: 3.5 }, { cx: 75, cy: 165, r: 2 },
          { cx: 82, cy: 40, r: 2.5 }, { cx: 128, cy: 42, r: 1.5 }, { cx: 40, cy: 115, r: 3 },
          { cx: 112, cy: 180, r: 2 }, { cx: 35, cy: 90, r: 2.5 }, { cx: 170, cy: 140, r: 2 },
          { cx: 150, cy: 160, r: 2.5 }, { cx: 58, cy: 105, r: 1.5 }, { cx: 142, cy: 48, r: 3 },
          { cx: 115, cy: 30, r: 1.5 }, { cx: 88, cy: 35, r: 2 }, { cx: 72, cy: 182, r: 1.2 }
        ].map((dot, idx) => (
          <circle key={idx} cx={dot.cx} cy={dot.cy} r={dot.r} fill={idx % 2 === 0 ? "#ef4444" : "#f97316"} opacity="0.75" />
        ))}
      </g>

      {/* 2. THE STYLIZED BOLD BLACK GOTHIC CALLIGRAPHY LETTER (Claw / 'C' symbol) */}
      <g transform="translate(10, 5)">
        {/* Shadow layer of the Gothic letter C */}
        <path
          d="M 125 45 C 110 30, 80 25, 60 40 C 40 55, 35 110, 55 135 C 75 160, 115 155, 125 140 C 130 115, 120 120, 110 125 C 100 130, 80 135, 70 120 C 60 105, 58 75, 72 60 C 85 45, 108 50, 125 45 Z"
          fill="none"
          stroke="#020617"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="miter"
          opacity="0.15"
          filter="url(#dragon-glow-heavy)"
        />
        {/* Main sharp calligraphy paths of the C letter */}
        <path
          d="M 125 45 C 110 30, 80 25, 60 40 C 40 55, 35 110, 55 135 C 75 160, 115 155, 125 140 L 120 130 C 105 142, 85 142, 72 130 C 58 115, 55 85, 70 65 C 85 45, 110 50, 125 45 Z"
          fill="url(#gothic-c-grad)"
          stroke="#020617"
          strokeWidth="3.5"
          strokeLinejoin="bevel"
        />
        {/* Gothic vertical central pillar/crossbar decoration */}
        <path
          d="M 85 55 L 85 130 L 93 130 L 93 55 Z"
          fill="#020617"
        />
        <path
          d="M 75 92 L 105 92 L 105 99 L 75 99 Z"
          fill="#020617"
        />
        {/* Flourish sharp spikes on Letter C */}
        <path d="M 52 48 L 46 62 L 60 55 Z" fill="#020617" />
        <path d="M 45 125 L 42 108 L 54 116 Z" fill="#020617" />
        <path d="M 124 43 L 138 35 L 128 50 Z" fill="#020617" />
        <path d="M 125 143 L 135 152 L 118 148 Z" fill="#020617" />
      </g>

      {/* 3. THE MAJESTIC RED DRAGON S-COIL WITH SPINE SPIKES & HEAD */}
      <g>
        {/* Behind-glow radiating from the dragon core */}
        <path
          d="M 155 55 C 130 35, 75 40, 70 75 C 65 110, 145 105, 135 135 C 125 165, 80 165, 55 140"
          fill="none"
          stroke="#ef4444"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.25"
          filter="url(#dragon-glow-heavy)"
        />

        {/* Dragon Spine sharp ruby spikes */}
        {[
          { x: 142, y: 46, rot: -20 }, { x: 118, y: 38, rot: -5 }, { x: 92, y: 42, rot: 15 },
          { x: 74, y: 56, rot: 40 }, { x: 68, y: 78, rot: 80 }, { x: 75, y: 96, rot: 130 },
          { x: 92, y: 104, rot: 170 }, { x: 115, y: 105, rot: 210 }, { x: 132, y: 114, rot: 230 },
          { x: 138, y: 132, rot: 270 }, { x: 125, y: 152, rot: 310 }, { x: 102, y: 161, rot: 340 },
          { x: 78, y: 156, rot: 380 }, { x: 62, y: 145, rot: 410 }
        ].map((spike, sidx) => (
          <path
            key={`spike-${sidx}`}
            d="M 0 -8 L 4 4 L -4 4 Z"
            fill="#ef4444"
            stroke="#991b1b"
            strokeWidth="1"
            transform={`translate(${spike.x}, ${spike.y}) rotate(${spike.rot}) scale(${(15 - sidx) / 10 + 0.3})`}
          />
        ))}

        {/* Coiled Dragon main body tube */}
        <path
          d="M 159 51 C 130 35, 75 40, 70 75 C 65 110, 145 105, 135 135 C 125 165, 80 165, 55 140"
          fill="none"
          stroke="url(#dragon-body-grad)"
          strokeWidth="10.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner Highlight Scales line */}
        <path
          d="M 159 51 C 130 35, 75 40, 70 75 C 65 110, 145 105, 135 135 C 125 165, 80 165, 55 140"
          fill="none"
          stroke="#fecdd3"
          strokeWidth="1"
          strokeDasharray="3,5"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Detailed Dragon Head (Top Right position) */}
        <g transform="translate(159, 51) rotate(-16)">
          {/* Head base shell */}
          <path
            d="M -6 -12 C 2 -16, 12 -8, 14 -2 C 15 2, 8 7, 2 7 C -4 7, -10 -2, -6 -12 Z"
            fill="#dc2626"
            stroke="#7f1d1d"
            strokeWidth="1.5"
          />
          {/* Snout & Open Jaws */}
          <path
            d="M 10 -4 L 20 -7 L 16 0 L 22 5 L 6 4 Z"
            fill="#991b1b"
            stroke="#7f1d1d"
            strokeWidth="1"
          />
          {/* Horns flowing backward */}
          <path d="M -8 -8 C -18 -15, -24 -6, -24 -6" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M -6 -11 C -15 -20, -20 -12, -20 -12" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          {/* Back whiskers whiskers */}
          <path d="M -2 3 C -10 10, -18 12, -18 12" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
          {/* Flaring eye or fiery core */}
          <circle cx="2" cy="-5" r="2.2" fill="#fde047" filter={glow ? "url(#dragon-splatter-blur)" : undefined} />
          <circle cx="2" cy="-5" r="1" fill="#f97316" />
          {/* Teeth details */}
          <path d="M 12 -5 L 14 -3 L 15 -5" stroke="#fff" strokeWidth="0.8" />
          <path d="M 11 1 L 13 3 L 14 1" stroke="#fff" strokeWidth="0.8" />
        </g>

        {/* Stylized wisps of Fire emitted from jaw */}
        <g transform="translate(178, 42)" opacity="0.9">
          <path d="M 0 0 C 10 -10, 18 -2, 28 -8 C 22 2, 12 0, 0 0 Z" fill="#fb923c" opacity="0.85" filter="url(#dragon-splatter-blur)" />
          <path d="M 4 2 C 12 -3, 16 -1, 22 -4 C 18 3, 10 1, 4 2 Z" fill="#fde047" opacity="0.9" />
        </g>

        {/* Dragon Tail (Bottom Left / Center position) */}
        <g transform="translate(55, 140) rotate(145)">
          {/* Tail fan / flames */}
          <path
            d="M 0 0 C -12 8, -22 4, -30 16 C -20 2, -10 4, 0 0 Z"
            fill="#dc2626"
            stroke="#991b1b"
            strokeWidth="1"
          />
          <path
            d="M -2 -2 C -11 -4, -18 -8, -25 -5 C -16 -1, -8 -1, -2 -2 Z"
            fill="#ea580c"
          />
          <path d="M -4 2 L -18 18 L -14 6 Z" fill="#f43f5e" />
        </g>

        {/* Dragon Claws / Talons grasping and coiled */}
        {/* Claw 1 grasping the letter C top */}
        <g transform="translate(100, 68) rotate(45)">
          <path d="M -4 -4 L 4 4 L 8 1" stroke="#7f1d1d" strokeWidth="2" fill="none" />
          <circle cx="8" cy="1" r="1.5" fill="#fde047" />
          <path d="M -4 -4 L 2 6 L 6 5" stroke="#7f1d1d" strokeWidth="2" fill="none" />
          <circle cx="6" cy="5" r="1.5" fill="#fde047" />
        </g>
        {/* Claw 2 grasping the letter C bottom */}
        <g transform="translate(112, 128) rotate(-35)">
          <path d="M -4 -4 L 4 4 L 8 1" stroke="#7f1d1d" strokeWidth="2" fill="none" />
          <circle cx="8" cy="1" r="1.5" fill="#fde047" />
          <path d="M -4 -4 L 2 6 L 6 5" stroke="#7f1d1d" strokeWidth="2" fill="none" />
          <circle cx="6" cy="5" r="1.5" fill="#fde047" />
        </g>
      </g>
    </svg>
  );
}
