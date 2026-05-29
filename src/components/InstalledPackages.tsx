import React, { useState, useEffect, useRef } from "react";
import { Sliders, Cpu, Laptop, Terminal, RefreshCw, Layers, CheckCircle, ShieldAlert, Play, Square, Save, ArrowRight, Network } from "lucide-react";

// ===================================
// 1. HTOP PROCESS MONITOR COMPONENT
// ===================================
export function PkgHtop() {
  const [cpu1, setCpu1] = useState(25);
  const [cpu2, setCpu2] = useState(18);
  const [cpu3, setCpu3] = useState(42);
  const [cpu4, setCpu4] = useState(30);
  const [memPercent, setMemPercent] = useState(24);
  const [tasks, setTasks] = useState([
    { pid: 1, user: "root", pri: 20, ni: 0, virt: "14M", res: "2304", cpu: 0.0, mem: 0.1, time: "0:02.15", command: "/sbin/init splash" },
    { pid: 42, user: "root", pri: 20, ni: 0, virt: "582M", res: "420M", cpu: 4.5, mem: 2.5, time: "4:12.35", command: "/usr/bin/cminewar-kernel-core" },
    { pid: 50, user: "user", pri: 20, ni: 0, virt: "45M", res: "22M", cpu: 0.2, mem: 0.1, time: "0:01.44", command: "cminewarbash-shell" },
    { pid: 120, user: "root", pri: 20, ni: 0, virt: "220M", res: "180M", cpu: 1.2, mem: 1.1, time: "1:22.05", command: "/usr/bin/Xorg :0" },
    { pid: 210, user: "root", pri: 20, ni: 0, virt: "105M", res: "85M", cpu: 2.1, mem: 0.5, time: "2:05.11", command: "network-analyzer-daemon" },
    { pid: 301, user: "user", pri: 20, ni: 0, virt: "380M", res: "250M", cpu: 1.8, mem: 1.5, time: "3:44.20", command: "cminewar-desktop-env" },
    { pid: 405, user: "user", pri: 20, ni: 0, virt: "410M", res: "310M", cpu: 5.6, mem: 1.8, time: "0:55.30", command: "google-gemini-channel" },
    { pid: 812, user: "user", ni: 0, pri: 20, virt: "15M", res: "6M", cpu: 15.0, mem: 0.1, time: "0:01.02", command: "htop" }
  ]);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCpu1(Math.floor(Math.random() * 60) + 5);
      setCpu2(Math.floor(Math.random() * 50) + 8);
      setCpu3(Math.floor(Math.random() * 80) + 12);
      setCpu4(Math.floor(Math.random() * 40) + 6);
      setMemPercent(Math.floor(Math.random() * 6) + 22);

      setTasks((prev) =>
        prev.map((t) => {
          if (t.command === "/sbin/init splash") return t;
          const usageDelta = (Math.random() * 4 - 2);
          const nextCpu = Math.min(Math.max(parseFloat((t.cpu + usageDelta).toFixed(1)), 0.0), 45);
          return { ...t, cpu: nextCpu };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleKill = (pid: number) => {
    setTasks((old) => old.filter((t) => t.pid !== pid));
    setSelectedPid(null);
  };

  const getBar = (pct: number) => {
    const totalBars = 30;
    const activeBars = Math.floor((pct / 100) * totalBars);
    let barStr = "";
    for (let i = 0; i < totalBars; i++) {
      if (i < activeBars) {
        if (pct > 75) barStr += "|";
        else barStr += "|";
      } else {
        barStr += " ";
      }
    }
    return barStr;
  };

  return (
    <div className="flex-1 flex flex-col bg-black text-[#00ff00] font-mono text-xs select-none p-3 h-full overflow-hidden">
      {/* Bars header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-[#222] pb-2">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-1.5">
            <span className="text-[#5555ff] font-bold">1</span>
            <span>[{getBar(cpu1)}]</span>
            <span className="text-white shrink-0">{cpu1.toFixed(1)}%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[#5555ff] font-bold">2</span>
            <span>[{getBar(cpu2)}]</span>
            <span className="text-white shrink-0">{cpu2.toFixed(1)}%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[#5555ff] font-bold">3</span>
            <span>[{getBar(cpu3)}]</span>
            <span className="text-white shrink-0">{cpu3.toFixed(1)}%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[#5555ff] font-bold">4</span>
            <span>[{getBar(cpu4)}]</span>
            <span className="text-white shrink-0">{cpu4.toFixed(1)}%</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center space-x-1.5">
            <span className="text-cyan-400 font-bold">Mem</span>
            <span>[{getBar(memPercent)}]</span>
            <span className="text-white shrink-0">{(16384 * (memPercent/100)).toFixed(0)}M/16384M</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-cyan-400 font-bold">Swp</span>
            <span>[{getBar(0)}]</span>
            <span className="text-white shrink-0">0K/2048M</span>
          </div>
          <p className="text-[#888] text-[10px] mt-2">Tasas hilos: 8 • Carga: 0.15, 0.24, 0.44</p>
        </div>
      </div>

      {/* Process list */}
      <div className="flex-1 overflow-y-auto mt-2 select-text min-h-0">
        <div className="grid grid-cols-12 gap-1 text-black bg-[#00ff00] px-1 font-bold text-[10px] select-none">
          <span className="col-span-1">PID</span>
          <span className="col-span-1">USER</span>
          <span className="col-span-1">PRI</span>
          <span className="col-span-1">NI</span>
          <span className="col-span-1">VIRT</span>
          <span className="col-span-1">RES</span>
          <span className="col-span-1 text-center">CPU%</span>
          <span className="col-span-1 text-center font-mono">MEM%</span>
          <span className="col-span-1 font-mono">TIME+</span>
          <span className="col-span-3">COMMAND</span>
        </div>

        <div className="divide-y divide-[#111] mt-1">
          {tasks.map((t) => (
            <div
              key={t.pid}
              onClick={() => setSelectedPid(t.pid)}
              className={`grid grid-cols-12 gap-1 py-1 px-1 cursor-pointer items-center ${
                selectedPid === t.pid ? "bg-[#002200] border border-[#00ff00]/40 text-yellow-300" : "hover:bg-[#111]"
              }`}
            >
              <span className="col-span-1 text-[#888]">{t.pid}</span>
              <span className="col-span-1 text-cyan-400">{t.user}</span>
              <span className="col-span-1">{t.pri}</span>
              <span className="col-span-1 text-[#888]">{t.ni}</span>
              <span className="col-span-1 text-slate-400">{t.virt}</span>
              <span className="col-span-1 text-slate-400">{t.res}</span>
              <span className="col-span-1 text-center text-white font-bold">{t.cpu.toFixed(1)}</span>
              <span className="col-span-1 text-center">{t.mem.toFixed(1)}</span>
              <span className="col-span-1 text-slate-400">{t.time}</span>
              <span className="col-span-3 truncate text-white" title={t.command}>{t.command}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer operations inside htop */}
      <div className="border-t border-[#333] pt-2 mt-auto flex justify-between select-none">
        <span className="text-[#888]">Kill Process options:</span>
        {selectedPid ? (
          <button
            onClick={() => handleKill(selectedPid)}
            className="bg-red-900 border border-red-500 hover:bg-red-700 hover:text-white text-rose-100 font-bold px-3 py-1 text-xs transition rounded"
          >
            F9 Kill PID {selectedPid}
          </button>
        ) : (
          <span className="text-slate-500 italic">Selecciona un proceso PID para matar</span>
        )}
      </div>
    </div>
  );
}

// ===================================
// 2. NEOFETCH HARDWARE REPORT
// ===================================
export function PkgNeofetch() {
  const [fetching, setFetching] = useState(false);
  const [renderedLogs, setRenderedLogs] = useState<string[]>([]);

  useEffect(() => {
    printStats();
  }, []);

  const printStats = () => {
    setFetching(true);
    setRenderedLogs(["Sondeando hardware del host virtualizado...", "Cargando ficheros en /proc/cpuinfo e interfaces udev..."]);
    setTimeout(() => {
      setRenderedLogs([]);
      setFetching(false);
    }, 700);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#111625] text-slate-200 p-4 font-mono text-xs select-none h-full overflow-y-auto">
      {fetching ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <RefreshCw className="animate-spin text-emerald-400" size={24} />
          <span className="text-slate-400">Generando reporte neofetch...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-2 select-text">
          {/* ASCII art */}
          <div className="md:col-span-4 text-emerald-400 font-bold text-xs leading-tight whitespace-pre bg-slate-950/40 p-3 rounded-lg border border-slate-900 shadow-inner">
{`   /\\\\\\     /\\\\\\
  /  \\\\\\   /  \\\\\\
 /    \\\\\\_/    \\\\\\
/      \\\\\\/      \\\\\\
\\\\      /\\\\      /
 \\\\    /  \\\\    /
  \\\\  /    \\\\  /
   \\\\/      \\\\/

    CMINEWAR OS`}
          </div>

          {/* Metadata info */}
          <div className="md:col-span-8 space-y-1.5 leading-relaxed">
            <h3 className="text-emerald-300 font-bold text-sm">user@cminewar-workspace</h3>
            <p className="border-b border-slate-800 pb-1.5 text-slate-550"></p>
            <div><span className="text-emerald-400 font-bold">OS:</span> CMineWar OS Debian-Live v1.2.0 x86_64</div>
            <div><span className="text-emerald-400 font-bold">Host:</span> AI Studio Debian-Native Sandbox Engine</div>
            <div><span className="text-emerald-400 font-bold">Kernel:</span> 5.16.0-cminewar-debian-generic</div>
            <div><span className="text-emerald-400 font-bold">Uptime:</span> 3 hours, 21 mins</div>
            <div><span className="text-emerald-400 font-bold">Shell:</span> CMineWarBash v1.2.0-secure</div>
            <div><span className="text-emerald-400 font-bold">Resolution:</span> {window.innerWidth}x{window.innerHeight} (Autoscaled)</div>
            <div><span className="text-emerald-400 font-bold">DE:</span> CMineWar Desktop Environment (CMineWarDE)</div>
            <div><span className="text-emerald-400 font-bold">WM:</span> WindowFrame Container Handler</div>
            <div><span className="text-emerald-400 font-bold">Terminal:</span> HTML5 xterm Canvas-multiplex</div>
            <div><span className="text-emerald-400 font-bold">CPU:</span> Intel Xeon CPU (4 cores, @2.30 GHz)</div>
            <div><span className="text-emerald-400 font-bold">GPU:</span> CMineWar Virtual FrameBuffer Virtual Mesa DRI</div>
            <div><span className="text-emerald-400 font-bold">Memory:</span> 4120MB / 16384MB (25% en uso)</div>

            {/* Color accent block representation */}
            <div className="flex space-x-1.5 pt-4">
              <span className="w-5 h-4 bg-black" />
              <span className="w-5 h-4 bg-red-650 bg-red-650 bg-rose-500" />
              <span className="w-5 h-4 bg-green-500" />
              <span className="w-5 h-4 bg-yellow-500" />
              <span className="w-5 h-4 bg-blue-500" />
              <span className="w-5 h-4 bg-purple-500" />
              <span className="w-5 h-4 bg-cyan-500" />
              <span className="w-5 h-4 bg-white" />
            </div>

            <button
              onClick={printStats}
              className="mt-4 px-2.5 py-1 text-[10.5px] font-sans font-semibold bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded transition"
            >
              Recargar Métricas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================================
// 3. CMATRIX CANVAS CODES RAIN
// ===================================
export function PkgCmatrix() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [matrixColor, setMatrixColor] = useState("#00ff00");
  const [rainSpeed, setRainSpeed] = useState(33); // interval in ms
  const [matrixScale, setMatrixScale] = useState(13);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 550);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 350);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 550;
      height = canvas.height = canvas.parentElement?.clientHeight || 350;
    };
    window.addEventListener("resize", handleResize);

    const charArr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ".split("");
    const columns = Math.floor(width / matrixScale) + 1;
    const ypos = Array(columns).fill(0).map(() => Math.floor(Math.random() * -100));

    let intervalId: any;

    const matrixRain = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = matrixColor;
      ctx.font = `${matrixScale}px monospace`;

      for (let i = 0; i < ypos.length; i++) {
        const text = charArr[Math.floor(Math.random() * charArr.length)];
        const x = i * matrixScale;
        const y = ypos[i];

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          ypos[i] = 0;
        } else {
          ypos[i] = y + matrixScale;
        }
      }
    };

    intervalId = setInterval(matrixRain, rainSpeed);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("resize", handleResize);
    };
  }, [matrixColor, rainSpeed, matrixScale]);

  return (
    <div className="flex-1 flex flex-col bg-black text-[#00ff00] font-sans text-xs select-none h-full relative overflow-hidden">
      {/* Top Floating Tools Bar overlay */}
      <div className="absolute top-2 right-2 bg-black/80 border border-slate-800 p-1.5 rounded-lg flex items-center space-x-2.5 z-10 text-[9px] font-mono opacity-60 hover:opacity-100 transition">
        <span>Color:</span>
        <div className="flex space-x-1">
          {["#00ff00", "#38bdf8", "#f43f5e", "#eab308"].map((col) => (
            <button
              key={col}
              onClick={() => setMatrixColor(col)}
              className="w-3 h-3 rounded-full border border-black"
              style={{ backgroundColor: col }}
            />
          ))}
        </div>
        <span>Vel:</span>
        <button
          onClick={() => setRainSpeed((v) => (v === 15 ? 45 : v === 45 ? 65 : 15))}
          className="px-1.5 bg-slate-900 border border-slate-800 rounded font-bold uppercase"
        >
          {rainSpeed === 15 ? "Rápido" : rainSpeed === 45 ? "Lento" : "Medio"}
        </button>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

// ===================================
// 4. NGINX VIRTUAL HOST WEB SERVER
// ===================================
export function PkgNginx() {
  const [nginxActive, setNginxActive] = useState(true);
  const [indexHtml, setIndexHtml] = useState(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background-color: #0d1117;
      color: #34d399;
      font-family: sans-serif;
      text-align: center;
      padding-top: 50px;
    }
    .card {
      background-color: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 30px;
      margin: auto;
      max-width: 420px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    h1 { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>nginx Virtual Host Live!</h1>
    <p>Servidor web alojado de forma exitosa en el pipeline local.</p>
    <a href="https://github.com" style="color:#38bdf8; text-decoration:none;">Documentación</a>
  </div>
</body>
</html>`;
  });
  const [showWebpage, setShowWebpage] = useState(true);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0b0f19] text-slate-300 font-sans text-xs select-none h-full overflow-hidden min-h-0">
      
      {/* Editor columns left */}
      <div className="w-full md:w-1/2 flex flex-col p-4 border-r border-slate-900 min-h-0 overflow-y-auto space-y-3.5">
        <div className="flex justify-between items-center border-b border-slate-900 pb-2 shrink-0">
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center space-x-1.5 font-mono">
              <Network size={13} className="text-emerald-400" />
              <span>nginx.conf Editor (/var/www/html)</span>
            </h4>
          </div>
          <button
            onClick={() => setNginxActive(!nginxActive)}
            className={`px-3 py-1 font-mono font-bold text-[10px] rounded border transition flex items-center space-x-1 ${
              nginxActive
                ? "bg-emerald-950/80 border-emerald-900 text-emerald-400"
                : "bg-rose-950/80 border-rose-900 text-rose-400"
            }`}
          >
            {nginxActive ? (
              <>
                <Square size={10} fill="currentColor" />
                <span>STOP SERVICE</span>
              </>
            ) : (
              <>
                <Play size={10} fill="currentColor" />
                <span>START SERVICE</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col space-y-1.5 select-text">
          <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Contenido del root/index.html:</label>
          <textarea
            value={indexHtml}
            onChange={(e) => setIndexHtml(e.target.value)}
            disabled={!nginxActive}
            className="flex-1 w-full bg-slate-950 border border-slate-900 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 leading-relaxed font-sans min-h-[160px] md:min-h-0"
          />
        </div>

        <div className="p-3.5 bg-slate-950 border border-slate-900/80 rounded-xl space-y-1 text-[10px] font-mono leading-relaxed select-none">
          🌍 <span className="text-slate-450 font-bold uppercase block mb-0.5">Nginx Service Status:</span>
          Master Process PID: 1205 (Active Listener) <br />
          Port: 8080 (Virtual Server Blocks) <br />
          Server name: cminewar_local_vhost.cl <br />
          Log path: /var/log/nginx/access_virtual.log
        </div>
      </div>

      {/* Render output preview right */}
      <div className="flex-1 flex flex-col bg-slate-950">
        <div className="p-3 bg-slate-900/60 border-b border-slate-900/80 flex justify-between items-center text-xs scroll-p-2 font-mono">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <Laptop size={11} className="text-cyan-400" />
            <span>Navegador Virtual: http://cminewar_local_vhost.cl/</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">200 OK</span>
        </div>

        <div className="flex-1 relative overflow-auto select-text p-4">
          {nginxActive ? (
            <div 
              className="w-full h-full bg-[#0d1117] rounded-lg border border-slate-900 p-2 overflow-auto"
              dangerouslySetInnerHTML={{ __html: indexHtml }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 select-none">
              <ShieldAlert className="text-rose-500" size={24} />
              <span className="text-slate-450 font-bold text-xs uppercase text-slate-450 font-mono">502 Bad Gateway</span>
              <span className="text-[10px] text-slate-500">Nginx service is stopped on this host.</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ===================================
// 5. RETROARCH CLASSIC SNAKE GAME
// ===================================
export function PkgRetroarch() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem("cminewar_snake_highscore") || 0);
  });
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Snake Board calculations
  const COLS = 20;
  const ROWS = 20;
  const [snake, setSnake] = useState<[number, number][]>([[10, 10]]);
  const [food, setFood] = useState<[number, number]>([5, 5]);
  const [direction, setDirection] = useState<"UP" | "DOWN" | "LEFT" | "RIGHT">("RIGHT");

  const gameLoopRef = useRef<any>(null);

  // Keyboard capture bindings
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if ((key === "ARROWUP" || key === "W") && direction !== "DOWN") setDirection("UP");
      if ((key === "ARROWDOWN" || key === "S") && direction !== "UP") setDirection("DOWN");
      if ((key === "ARROWLEFT" || key === "A") && direction !== "RIGHT") setDirection("LEFT");
      if ((key === "ARROWRIGHT" || key === "D") && direction !== "LEFT") setDirection("RIGHT");
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [direction]);

  const startGame = () => {
    setSnake([[10, 10]]);
    setFood([Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)]);
    setDirection("RIGHT");
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        let newHead: [number, number];

        switch (direction) {
          case "UP": newHead = [head[0], head[1] - 1]; break;
          case "DOWN": newHead = [head[0], head[1] + 1]; break;
          case "LEFT": newHead = [head[0] - 1, head[1]]; break;
          case "RIGHT": newHead = [head[0] + 1, head[1]]; break;
        }

        // Hit walls check
        if (
          newHead[0] < 0 ||
          newHead[0] >= COLS ||
          newHead[1] < 0 ||
          newHead[1] >= ROWS
        ) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        // Hit self check
        for (const segment of prevSnake) {
          if (segment[0] === newHead[0] && segment[1] === newHead[1]) {
            setGameOver(true);
            setIsPlaying(false);
            return prevSnake;
          }
        }

        const newSnake = [newHead, ...prevSnake];

        // Eat food check
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          setScore((s) => {
            const next = s + 10;
            if (next > highScore) {
              setHighScore(next);
              localStorage.setItem("cminewar_snake_highscore", String(next));
            }
            return next;
          });
          setFood([Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)]);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 110);

    return () => clearInterval(gameLoopRef.current);
  }, [isPlaying, gameOver, direction, food, highScore]);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#150a21] text-violet-300 font-sans text-xs select-none h-full overflow-hidden min-h-0">
      
      {/* Left Instructions & Controls */}
      <div className="w-full md:w-48 p-4 bg-[#11051b] flex flex-col justify-between shrink-0 border-r border-[#2c0d45]">
        <div className="space-y-4">
          <div>
            <span className="text-[9px] uppercase tracking-widest font-mono text-violet-400 font-bold block">Retro Emulator</span>
            <h4 className="text-xs font-bold text-white font-mono mt-0.5">Arcade Snake v1.0</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
            <div className="p-2 border border-violet-900/60 rounded bg-[#250b3a]/30">
              <span className="text-[9px] uppercase tracking-wider block text-violet-400">Score:</span>
              <span className="font-bold text-xl text-yellow-400 font-mono">{score}</span>
            </div>
            <div className="p-2 border border-violet-900/60 rounded bg-[#250b3a]/30">
              <span className="text-[9px] uppercase tracking-wider block text-violet-350">Max Score:</span>
              <span className="font-bold text-xl text-pink-400 font-mono">{highScore}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-relaxed font-mono space-y-1">
            <p>⌨️ Controles de teclado:</p>
            <p>Usar <code className="text-white px-1 bg-slate-900 border border-slate-800 rounded font-bold">W</code><code className="text-white px-1 bg-slate-900 border border-slate-800 rounded font-bold">A</code><code className="text-white px-1 bg-slate-900 border border-slate-800 rounded font-bold">S</code><code className="text-white px-1 bg-slate-900 border border-slate-800 rounded font-bold">D</code> o Flechas.</p>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={startGame}
          className="w-full py-2 bg-violet-600 hover:bg-violet-500 font-bold text-white rounded shadow-lg shadow-violet-500/10 text-xs transition uppercase"
        >
          {gameOver ? "Reiniciar Juego" : isPlaying ? "En Curso" : "Iniciar Partida"}
        </button>
      </div>

      {/* Snake board display */}
      <div className="flex-1 bg-[#1c0c2a]/50 flex items-center justify-center p-4 relative min-h-0">
        <div className="relative border border-[#481c6d] aspect-square rounded overflow-hidden shadow-inner max-w-full max-h-full" style={{ width: "320px", height: "320px" }}>
          
          {/* Game Over Modal */}
          {gameOver && (
            <div className="absolute inset-0 bg-[#000]/85 z-10 flex flex-col items-center justify-center space-y-3 p-4">
              <span className="text-rose-500 font-black text-xl uppercase tracking-widest animate-bounce">Fin De Partida</span>
              <p className="text-[11px] text-slate-350">Has chocado. Puntuación: {score} pts.</p>
              <button
                onClick={startGame}
                className="px-4 py-1.5 bg-violet-600 font-bold text-white text-xs hover:bg-violet-500 rounded transition"
              >
                Volver a Jugar
              </button>
            </div>
          )}

          {/* Grid render */}
          <div className="w-full h-full bg-slate-950 grid grid-cols-20 grid-rows-20 select-none">
            {Array.from({ length: ROWS }).map((_, r) =>
              Array.from({ length: COLS }).map((_, c) => {
                const isSnake = snake.some((segment) => segment[0] === c && segment[1] === r);
                const isFood = food[0] === c && food[1] === r;
                let colorClass = "bg-[#0b0412]";

                if (isSnake) {
                  colorClass = snake[0][0] === c && snake[0][1] === r ? "bg-violet-400" : "bg-violet-600";
                } else if (isFood) {
                  colorClass = "bg-yellow-400 animate-pulse";
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`border-[0.2px] border-[#1d0e2e]/20 ${colorClass}`}
                    style={{ aspectRatio: "1/1" }}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Mobile touch indicators */}
        <div className="absolute bottom-2 right-4 flex flex-col items-center space-y-1 select-none opacity-40 hover:opacity-100 transition md:hidden">
          <button onClick={() => direction !== "DOWN" && setDirection("UP")} className="w-8 h-8 rounded bg-violet-900 border border-violet-600 text-white font-bold flex items-center justify-center text-xs">▲</button>
          <div className="flex space-x-1">
            <button onClick={() => direction !== "RIGHT" && setDirection("LEFT")} className="w-8 h-8 rounded bg-violet-900 border border-violet-600 text-white font-bold flex items-center justify-center text-xs">◀</button>
            <div className="w-8 h-8" />
            <button onClick={() => direction !== "LEFT" && setDirection("RIGHT")} className="w-8 h-8 rounded bg-violet-900 border border-violet-600 text-white font-bold flex items-center justify-center text-xs">▶</button>
          </div>
          <button onClick={() => direction !== "UP" && setDirection("DOWN")} className="w-8 h-8 rounded bg-violet-900 border border-violet-600 text-white font-bold flex items-center justify-center text-xs">▼</button>
        </div>
      </div>

    </div>
  );
}
