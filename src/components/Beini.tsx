import React, { useState, useEffect, useRef } from "react";
import { 
  Wifi, 
  Terminal as TermIcon, 
  Flame, 
  Play, 
  Square, 
  Search, 
  Cpu, 
  FileText, 
  ShieldCheck, 
  RefreshCw, 
  Database, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Compass, 
  Layers, 
  Check, 
  HelpCircle,
  Copy,
  FolderOpen
} from "lucide-react";

interface WifiTarget {
  bssid: string;
  essid: string;
  channel: number;
  encryption: "WEP" | "WPA2" | "WPA3" | "WPA2/WPA3";
  signal: number; // -100 to -30
  wps: boolean;
  clients: string[];
}

export default function Beini() {
  const [activeTab, setActiveTab] = useState<"feedingbottle" | "minidwep" | "cli" | "wordlists">("feedingbottle");
  
  const triggerNotification = (text: string, type: "success" | "info" = "info") => {
    window.dispatchEvent(new CustomEvent("trigger_notification", { detail: { text, type } }));
  };
  
  // Simulated hardware configuration
  const [selectedCard, setSelectedCard] = useState("wlan0 (Ralink RT3070 USB)");
  const [monitorMode, setMonitorMode] = useState(false);
  
  // Wi-Fi Scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [targets, setTargets] = useState<WifiTarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<WifiTarget | null>(null);
  
  // Simulated targets list
  const sampleTargets: WifiTarget[] = [
    { bssid: "FC:EC:DA:11:22:33", essid: "Movistar_Fiber_2.4G", channel: 6, encryption: "WPA2", signal: -45, wps: true, clients: ["24:F5:A2:3B:11:02", "D4:61:9D:E4:F5:1A"] },
    { bssid: "00:1E:A6:B8:1C:E3", essid: "WLAN_WEP_SECURE", channel: 1, encryption: "WEP", signal: -68, wps: false, clients: ["FC:DB:B3:99:AA:CC"] },
    { bssid: "34:2C:C4:E1:92:DF", essid: "Fibertel_WiFi_920", channel: 11, encryption: "WPA2", signal: -52, wps: true, clients: ["30:05:5C:88:94:11"] },
    { bssid: "A8:5E:45:90:3A:42", essid: "Casa_Segura_WPA3", channel: 36, encryption: "WPA3", signal: -35, wps: false, clients: ["E4:E4:AB:12:34:56", "7C:5C:F8:32:B1:C0"] },
    { bssid: "84:16:F9:C3:A2:B0", essid: "Airport_Guest_WiFi", channel: 1, encryption: "WPA2/WPA3", signal: -75, wps: true, clients: [] },
    { bssid: "04:C0:6F:E8:A4:51", essid: "Direct_SmartTV_11", channel: 11, encryption: "WPA2", signal: -82, wps: false, clients: [] },
  ];

  // Global scanner cycle
  useEffect(() => {
    let timer: any;
    if (isScanning) {
      setTargets([]);
      timer = setInterval(() => {
        setTargets(prev => {
          if (prev.length >= sampleTargets.length) {
            setIsScanning(false);
            return prev;
          }
          // Add next sample target with randomized signal fluctuations
          const next = { ...sampleTargets[prev.length] };
          next.signal = Math.min(-30, Math.max(-100, next.signal + Math.floor(Math.random() * 11) - 5));
          return [...prev, next];
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isScanning]);

  const handleStartScan = () => {
    if (!monitorMode) {
      alert("Por favor, active primero el modo Monitor (Monitor Mode) en su tarjeta inalámbrica.");
      return;
    }
    setIsScanning(true);
    setSelectedTarget(null);
  };

  // ===================================
  // Tab 1: FEEDINGBOTTLE STATES & ENGINE
  // ===================================
  const [fbStep, setFbStep] = useState<1 | 2 | 3 | 4>(1); // 1: Card, 2: Scan, 3: Attack Setup, 4: Attack Execution
  const [fbAttackType, setFbAttackType] = useState<"wep_arp" | "wpa_deauth" | "wpa3_pmkid" | "wps_pixie">("wpa_deauth");
  const [fbProgressLog, setFbProgressLog] = useState<string[]>([]);
  const [fbIsAttacking, setFbIsAttacking] = useState(false);
  const [fbCapturedHandshake, setFbCapturedHandshake] = useState(false);
  const [fbHandshakeFile, setFbHandshakeFile] = useState("");
  const [fbCracking, setFbCracking] = useState(false);
  const [fbCrackingProgress, setFbCrackingProgress] = useState(0);
  const [fbCrackedKey, setFbCrackedKey] = useState("");
  const [deauthClient, setDeauthClient] = useState("ALL CLIENTS (Broadcast)");

  const handleFbAttackLaunch = () => {
    if (!selectedTarget) return;
    setFbIsAttacking(true);
    setFbCapturedHandshake(false);
    setFbHandshakeFile("");
    setFbProgressLog([
      `[+] Iniciando suite de ataque FeedingBottle v3.0 en tarjeta ${selectedCard}`,
      `[+] Sintonizando canal inalámbrico ${selectedTarget.channel} en ${selectedTarget.bssid}`,
    ]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (fbAttackType === "wpa_deauth") {
        if (step === 1) {
          setFbProgressLog(prev => [...prev, `[+] Lanzando ráfaga aireplay-ng deautenticación contra ${deauthClient}...`]);
        } else if (step === 2) {
          setFbProgressLog(prev => [...prev, `[!] Paquete de desasociación enviado con éxito. Esperando reconexión...`]);
        } else if (step === 3) {
          setFbProgressLog(prev => [...prev, `[*] Detectando intento de handshake WPA de 4 vías (4-Way Handshake)...`]);
        } else if (step === 4) {
          setFbProgressLog(prev => [...prev, `[✔] ¡ÉXITO! Handshake de WPA capturado para el BSSID: ${selectedTarget.bssid}`]);
          setFbCapturedHandshake(true);
          setFbHandshakeFile(`/vfs/captures/handshake-${selectedTarget.essid.replace(/\s+/g, "_")}.cap`);
          setFbIsAttacking(false);
          clearInterval(interval);
        }
      } else if (fbAttackType === "wep_arp") {
        if (step === 1) {
          setFbProgressLog(prev => [...prev, `[+] Escuchando tráfico ARP interactivo para inyección rápida...`]);
        } else if (step === 2) {
          setFbProgressLog(prev => [...prev, `[+] Inyectando 500 ARP Replay paquetes/segundo para forzar IVs...`]);
        } else if (step === 3) {
          setFbProgressLog(prev => [...prev, `[*] IVs Recolectados: 12,045 (Tasa: 450 IVs/s). Se necesitan ~15,000`]);
        } else if (step === 4) {
          setFbProgressLog(prev => [...prev, `[✔] IVs Recolectados: 18,349. Volcando datos de vectores para cracking.`]);
          setFbCapturedHandshake(true);
          setFbHandshakeFile(`/vfs/captures/wep-ivs-${selectedTarget.essid.replace(/\s+/g, "_")}.cap`);
          setFbIsAttacking(false);
          clearInterval(interval);
        }
      } else if (fbAttackType === "wpa3_pmkid") {
        if (step === 1) {
          setFbProgressLog(prev => [...prev, `[+] Solicitando asociación simulada de fotones RSN para PMKID...`]);
        } else if (step === 2) {
          setFbProgressLog(prev => [...prev, `[+] Capturando frame de autenticación EAPOL de un solo paquete...`]);
        } else if (step === 3) {
          setFbProgressLog(prev => [...prev, `[✔] ¡PMKID extraído del frame EAPOL! Sin necesidad de clientes activos.`]);
          setFbCapturedHandshake(true);
          setFbHandshakeFile(`/vfs/captures/pmkid-${selectedTarget.essid.replace(/\s+/g, "_")}.cap`);
          setFbIsAttacking(false);
          clearInterval(interval);
        }
      } else if (fbAttackType === "wps_pixie") {
        if (step === 1) {
          setFbProgressLog(prev => [...prev, `[+] Iniciando sesión WPS con reaver...`]);
        } else if (step === 2) {
          setFbProgressLog(prev => [...prev, `[+] Extrayendo parámetros criptográficos aleatorios (E-Nonce, R-Nonce, AuthKey)...`]);
        } else if (step === 3) {
          setFbProgressLog(prev => [...prev, `[+] Ejecutando ataque Pixie Dust fuera de línea en caliente...`]);
        } else if (step === 4) {
          setFbProgressLog(prev => [...prev, `[✔] ¡PIN WPS Encontrado!: 40291085`]);
          setFbProgressLog(prev => [...prev, `[✔] ¡Clave WPA Descifrada!: Celular2026Secure`]);
          setFbCapturedHandshake(true);
          setFbHandshakeFile("PIN Encontrado!");
          setFbCrackedKey("Celular2026Secure");
          setFbIsAttacking(false);
          clearInterval(interval);
        }
      }
    }, 1500);
  };

  const handleFbCrackLaunch = () => {
    if (!selectedTarget) return;
    setFbCracking(true);
    setFbCrackingProgress(0);
    setFbCrackedKey("");
    
    const interval = setInterval(() => {
      setFbCrackingProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setFbCracking(false);
          
          // Determine key based on target
          if (selectedTarget.essid.includes("Movistar")) {
            setFbCrackedKey("Movi2026wifi");
          } else if (selectedTarget.essid.includes("WEP")) {
            setFbCrackedKey("1234567890ABCDE");
          } else if (selectedTarget.essid.includes("Fibertel")) {
            setFbCrackedKey("fibertel920key");
          } else if (selectedTarget.essid.includes("Casa")) {
            setFbCrackedKey("WPA3PassSecureValue");
          } else {
            setFbCrackedKey("beini_secret_wpa_key");
          }
          return 100;
        }
        return p + 5;
      });
    }, 150);
  };

  // ===================================
  // Tab 2: MINIDWEP-GTK STATES & ENGINE
  // ===================================
  const [mdActiveSubTab, setMdActiveSubTab] = useState<"scan" | "wps" | "wep">("scan");
  const [mdLogs, setMdLogs] = useState<string[]>([
    "minidwep-gtk v4.0.5 - Inicializado.",
    "Listo para rastrear interfaces de auditoría.",
  ]);
  const [mdWpsStatus, setMdWpsStatus] = useState<"idle" | "running" | "success" | "failed">("idle");
  const [mdWpsProgress, setMdWpsProgress] = useState(0);
  const [mdWpsPin, setMdWpsPin] = useState("");
  const [mdWpsKey, setMdWpsKey] = useState("");

  const runMdWpsAttack = () => {
    if (!selectedTarget) {
      alert("Por favor seleccione un objetivo Wi-Fi antes.");
      return;
    }
    if (!selectedTarget.wps) {
      alert("Este objetivo no tiene WPS habilitado.");
      return;
    }

    setMdWpsStatus("running");
    setMdWpsProgress(0);
    setMdWpsPin("");
    setMdWpsKey("");
    setMdLogs(prev => [...prev, `[WPS] Iniciando reaver para BSSID: ${selectedTarget.bssid}`]);

    const timer = setInterval(() => {
      setMdWpsProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setMdWpsStatus("success");
          setMdWpsPin("12345670");
          setMdWpsKey("ClaveSecretaWPS2026");
          setMdLogs(old => [...old, `[WPS] ¡Ataque Exitoso! PIN: 12345670, WPA KEY: ClaveSecretaWPS2026`]);
          return 100;
        }
        if (p % 20 === 0 && p > 0) {
          setMdLogs(old => [...old, `[WPS] Intentando PIN index ${(p/10).toFixed(0)}00...`]);
        }
        return p + 10;
      });
    }, 400);
  };

  // ===================================
  // Tab 3: BASH CLI AIRCRACK-NG SUITE
  // ===================================
  const [cliInput, setCliInput] = useState("");
  const [cliLines, setCliLines] = useState<string[]>([
    "Beini-Linux Embedded Auditing Terminal v3.0",
    "Escriba 'help' para ver los comandos disponibles.",
    "root@beini:~# "
  ]);
  const cliEndRef = useRef<HTMLDivElement>(null);

  const executeCliCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const mainCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output: string[] = [];

    switch (mainCmd) {
      case "help":
        output = [
          "Comandos disponibles en Beini Aircrack Suite CLI:",
          "  airmon-ng [start|stop] [dev]   - Habilitar/deshabilitar modo monitor",
          "  airodump-ng [dev]              - Rastrear puntos de acceso y clientes",
          "  aireplay-ng --deauth [num]     - Desasociar clientes para handshake",
          "  aircrack-ng [file.cap]         - Descifrar claves con fuerza bruta",
          "  iwconfig                       - Mostrar interfaces inalámbricas",
          "  ifconfig                       - Mostrar interfaces de red",
          "  clear                          - Limpiar la pantalla de terminal",
          "  help                           - Mostrar esta ayuda"
        ];
        break;
      case "iwconfig":
        output = [
          "lo        no wireless extensions.",
          "",
          "eth0      no wireless extensions.",
          "",
          "wlan0     IEEE 802.11bgn  ESSID:off/any",
          `          Mode:${monitorMode ? "Monitor" : "Managed"}  Frequency:2.437 GHz  Access Point: Not-Associated`,
          "          Tx-Power=20 dBm   Sensitivity=8/20",
          "          Retry limit:7   RTS thr:off   Fragment thr:off",
          "          Encryption key:off",
          "          Power Management:off",
          "wlan0mon  (Monitor mode VIF enabled on wlan0)"
        ];
        break;
      case "ifconfig":
        output = [
          "eth0      Link encap:Ethernet  HWaddr 00:0C:29:45:11:A2",
          "          inet addr:192.168.1.100  Bcast:192.168.1.255  Mask:255.255.255.0",
          "          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1",
          "          RX packets:10452 errors:0 dropped:0 overruns:0 frame:0",
          "          TX packets:8912 errors:0 dropped:0 overruns:0 carrier:0",
          "",
          "wlan0     Link encap:Ethernet  HWaddr A0:F3:C1:2B:1D:44",
          "          UP BROADCAST MULTICAST  MTU:1500  Metric:1",
          "          RX packets:0 errors:0 dropped:0 overruns:0 frame:0",
          "          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0"
        ];
        break;
      case "airmon-ng":
        if (args[0] === "start") {
          setMonitorMode(true);
          output = [
            "PHY\tInterface\tDriver\t\tChipset",
            "phy0\twlan0\t\tath9k_htc\tAtheros AR9271 (USB)",
            "",
            "[*] Modo Monitor habilitado en wlan0mon de forma exitosa."
          ];
        } else if (args[0] === "stop") {
          setMonitorMode(false);
          output = [
            "PHY\tInterface\tDriver\t\tChipset",
            "phy0\twlan0\t\tath9k_htc\tAtheros AR9271 (USB)",
            "",
            "[*] Modo Monitor deshabilitado en wlan0."
          ];
        } else {
          output = [
            "Uso: airmon-ng start [interfaz]",
            "Ejemplo: airmon-ng start wlan0"
          ];
        }
        break;
      case "airodump-ng":
        if (!monitorMode) {
          output = ["Error: La tarjeta de red no está en modo monitor. Ejecute 'airmon-ng start wlan0'."];
        } else {
          output = [
            " CH  6 ][ Elapsed: 4 s ][ 2026-06-27 16:40 ][ WPA handshake: FC:EC:DA:11:22:33",
            "",
            " BSSID              PWR  Beacons    #Data, #/s  CH   MB   ENC  CIPHER AUTH ESSID",
            " FC:EC:DA:11:22:33  -45       48       24    6   6  130   WPA2 CCMP   PSK  Movistar_Fiber_2.4G",
            " 00:1E:A6:B8:1C:E3  -68       12        2    0   1   54   WEP  WEP        WLAN_WEP_SECURE",
            " 34:2C:C4:E1:92:DF  -52       35       11    2  11   54   WPA2 CCMP   PSK  Fibertel_WiFi_920",
            "",
            " BSSID              STATION            PWR   Rate    Lost    Frames  Notes",
            " FC:EC:DA:11:22:33  24:F5:A2:3B:11:02  -51   0 - 1      0        14  Probing",
            " FC:EC:DA:11:22:33  D4:61:9D:E4:F5:1A  -42   0 -11e     0        40  Connected"
          ];
        }
        break;
      case "aireplay-ng":
        if (!monitorMode) {
          output = ["Error: No se puede inyectar. Active el modo monitor primero."];
        } else if (trimmed.includes("--deauth")) {
          output = [
            "16:40:15  Enviando Deauth dirigida a STATION -- [D4:61:9D:E4:F5:1A]...",
            "16:40:16  Enviando 64 paquetes de deautenticación (Broadcast)...",
            "16:40:17  Ataque enviado de forma exitosa.",
            "[✔] WPA Handshake capturado correctamente en el aire."
          ];
        } else {
          output = [
            "Uso: aireplay-ng --deauth [num] -a [BSSID] [interfaz]",
            "Ejemplo: aireplay-ng --deauth 15 -a FC:EC:DA:11:22:33 wlan0mon"
          ];
        }
        break;
      case "aircrack-ng":
        output = [
          "Opening handshake.cap",
          "Read 1 handshake",
          "",
          "Aircrack-ng 1.7 ",
          "",
          "      Index  Number  Name",
          "   1      1  Movistar_Fiber_2.4G (FC:EC:DA:11:22:33)",
          "",
          "Selector del objetivo, ejecutando ataque de diccionario con rockyou.txt...",
          "Cracking en progreso: [3,041 / 14,344,392] keys tested. Tasa: 4503.2 keys/s",
          "Intentando: 'margarita123'...",
          "Intentando: 'Movi2026wifi'...",
          "",
          "               KEY FOUND! [ Movi2026wifi ]",
          "",
          "      Decrypted wireless frames successfully."
        ];
        break;
      case "clear":
        setCliLines(["root@beini:~# "]);
        return;
      default:
        output = [`bash: ${mainCmd}: comando no encontrado`];
    }

    setCliLines(prev => [
      ...prev.slice(0, prev.length - 1),
      `root@beini:~# ${trimmed}`,
      ...output,
      "root@beini:~# "
    ]);
  };

  const handleCliKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCliCommand(cliInput);
      setCliInput("");
    }
  };

  useEffect(() => {
    cliEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cliLines]);

  // ===================================
  // Tab 4: DICTIONARY / WORDLIST GENERATOR
  // ===================================
  const [wordlistWords, setWordlistWords] = useState<string[]>([
    "beini2026", "auditoriawifi", "movistar123", "clavewifi2026", "admin123", "rootbeini", "wifisecure", "password123"
  ]);
  const [wlPrefix, setWlPrefix] = useState("");
  const [wlBase, setWlBase] = useState("beini");
  const [wlSuffix, setWlSuffix] = useState("2026");

  const generateWordlist = () => {
    const bases = [wlBase, "wifi", "network", "pass", "root", "admin", "secure"];
    const suffixes = [wlSuffix, "123", "2026", "2025", "!", "$", "abc"];
    const newList: string[] = [];

    bases.forEach(b => {
      suffixes.forEach(s => {
        newList.push(`${wlPrefix}${b}${s}`);
        newList.push(`${wlPrefix}${b.toUpperCase()}${s}`);
      });
    });

    setWordlistWords(newList.slice(0, 50)); // cap display at 50
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 font-sans h-full overflow-hidden">
      
      {/* Header Beini System Bar */}
      <div className="bg-[#e11d48] shrink-0 text-white flex items-center justify-between px-4 py-2.5 select-none shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-rose-300">
            <span className="text-rose-600 font-black text-xs">🍼</span>
          </div>
          <div>
            <h3 className="text-sm font-black tracking-wider uppercase">Beini Wi-Fi Suite</h3>
            <p className="text-[9px] text-rose-100 font-mono">Wireless Auditing System & Core Drivers Loaded</p>
          </div>
        </div>
        
        {/* Hardware quick controller */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-rose-900/60 border border-rose-700 rounded-lg px-2.5 py-1 flex items-center space-x-2">
            <Wifi size={13} className={monitorMode ? "text-emerald-400 animate-pulse" : "text-rose-300"} />
            <select 
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none text-[10px] cursor-pointer"
            >
              <option value="wlan0 (Ralink RT3070 USB)" className="bg-slate-900">wlan0 (Ralink RT3070)</option>
              <option value="wlan1 (Atheros AR9271 HighPower)" className="bg-slate-900">wlan1 (Atheros AR9271)</option>
            </select>
          </div>

          <button
            onClick={() => setMonitorMode(!monitorMode)}
            className={`px-3 py-1 text-[10px] font-bold rounded-md font-mono transition uppercase ${
              monitorMode 
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950" 
                : "bg-slate-900 border border-rose-600/40 text-rose-300 hover:bg-slate-850"
            }`}
          >
            {monitorMode ? "Monitor: ON" : "Monitor: OFF"}
          </button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex bg-slate-900 border-b border-slate-800 select-none overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveTab("feedingbottle")}
          className={`px-4 py-3 text-xs font-bold transition flex items-center space-x-2 shrink-0 border-b-2 cursor-pointer ${
            activeTab === "feedingbottle" 
              ? "border-[#e11d48] text-rose-400 bg-slate-950" 
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          <span>🍼 FeedingBottle v3.0</span>
        </button>
        <button
          onClick={() => setActiveTab("minidwep")}
          className={`px-4 py-3 text-xs font-bold transition flex items-center space-x-2 shrink-0 border-b-2 cursor-pointer ${
            activeTab === "minidwep" 
              ? "border-[#e11d48] text-rose-400 bg-slate-950" 
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          <span>🐉 Minidwep-gtk</span>
        </button>
        <button
          onClick={() => setActiveTab("cli")}
          className={`px-4 py-3 text-xs font-bold transition flex items-center space-x-2 shrink-0 border-b-2 cursor-pointer ${
            activeTab === "cli" 
              ? "border-[#e11d48] text-rose-400 bg-slate-950" 
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          <TermIcon size={14} />
          <span>🐚 Terminal Aircrack</span>
        </button>
        <button
          onClick={() => setActiveTab("wordlists")}
          className={`px-4 py-3 text-xs font-bold transition flex items-center space-x-2 shrink-0 border-b-2 cursor-pointer ${
            activeTab === "wordlists" 
              ? "border-[#e11d48] text-rose-400 bg-slate-950" 
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          <Database size={14} />
          <span>📖 Generador Wordlists</span>
        </button>
      </div>

      {/* Tab Contents Frame */}
      <div className="flex-1 min-h-0 bg-slate-950 overflow-hidden flex flex-col relative">
        
        {/* ===================================
            TAB 1: FEEDINGBOTTLE
        =================================== */}
        {activeTab === "feedingbottle" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
            
            {/* Steps Guide Indicator */}
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono select-none">
              <div 
                onClick={() => !fbIsAttacking && setFbStep(1)}
                className={`p-2 rounded border cursor-pointer transition ${
                  fbStep === 1 
                    ? "bg-rose-500/10 border-rose-500 text-rose-400 font-bold" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                1. INTERFAZ
              </div>
              <div 
                onClick={() => !fbIsAttacking && monitorMode && setFbStep(2)}
                className={`p-2 rounded border transition ${
                  !monitorMode ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                } ${
                  fbStep === 2 
                    ? "bg-rose-500/10 border-rose-500 text-rose-400 font-bold" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                2. ESCANEAR
              </div>
              <div 
                onClick={() => !fbIsAttacking && selectedTarget && setFbStep(3)}
                className={`p-2 rounded border transition ${
                  !selectedTarget ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                } ${
                  fbStep === 3 
                    ? "bg-rose-500/10 border-rose-500 text-rose-400 font-bold" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                3. CONFIGURAR ATAQUE
              </div>
              <div 
                onClick={() => fbStep === 4 && setFbStep(4)}
                className={`p-2 rounded border transition cursor-default ${
                  fbStep === 4 
                    ? "bg-rose-500/10 border-rose-500 text-rose-400 font-bold" 
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
              >
                4. EJECUCIÓN
              </div>
            </div>

            {/* Step 1: Interface selection */}
            {fbStep === 1 && (
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4 max-w-2xl mx-auto w-full">
                <div className="flex items-center space-x-2">
                  <Cpu className="text-rose-500" size={18} />
                  <h4 className="text-sm font-bold text-white">Configuración de Hardware Inalámbrico</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  FeedingBottle requiere una tarjeta con soporte de inyección y modo monitor. Ralink RT3070 y Atheros AR9271 son las ideales en Beini por su compatibilidad out-of-the-box con linux.
                </p>

                <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Interface activa:</span>
                    <span className="text-rose-400 font-bold">{selectedCard}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Estado del controlador:</span>
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <ShieldCheck size={12} />
                      <span>Listo (ath9k_htc)</span>
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Modo de Operación:</span>
                    <span className={monitorMode ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {monitorMode ? "MONITOR (INYECCIÓN HABILITADA)" : "MANAGED (DESACTIVADO)"}
                    </span>
                  </div>
                </div>

                {!monitorMode ? (
                  <button
                    onClick={() => {
                      setMonitorMode(true);
                      triggerNotification("Modo monitor habilitado en wlan0mon", "success");
                    }}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider"
                  >
                    Habilitar Modo Monitor para Escanear
                  </button>
                ) : (
                  <button
                    onClick={() => setFbStep(2)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition uppercase tracking-wider flex items-center justify-center space-x-1.5"
                  >
                    <span>Siguiente: Buscar Redes</span>
                    <Search size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Scanning networks */}
            {fbStep === 2 && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                <div className="flex justify-between items-center shrink-0">
                  <div className="flex items-center space-x-2">
                    <Wifi className="text-rose-500" size={16} />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Puntos de Acceso al Aire</h4>
                  </div>
                  <button
                    onClick={handleStartScan}
                    disabled={isScanning}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer uppercase font-mono"
                  >
                    <RefreshCw size={11} className={isScanning ? "animate-spin" : ""} />
                    <span>{isScanning ? "Escaneando..." : "Buscar Redes"}</span>
                  </button>
                </div>

                {/* Grid layout for Wi-Fi List */}
                <div className="flex-1 bg-slate-900 border border-slate-850 rounded-xl overflow-hidden flex flex-col min-h-[180px]">
                  <div className="grid grid-cols-12 gap-2 bg-slate-950 px-4 py-2 text-[10px] font-mono text-slate-400 border-b border-slate-850 select-none">
                    <span className="col-span-4">ESSID (Nombre Red)</span>
                    <span className="col-span-3">BSSID (Mac AP)</span>
                    <span className="col-span-1 text-center">CH</span>
                    <span className="col-span-2 text-center">Cifrado</span>
                    <span className="col-span-1 text-center">WPS</span>
                    <span className="col-span-1 text-center">Señal</span>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-850/60">
                    {targets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 select-none space-y-2">
                        {isScanning ? (
                          <>
                            <RefreshCw size={24} className="animate-spin text-rose-500" />
                            <p className="text-xs font-mono">Buscando tramas de beacons en canales 1-13 / 36-165...</p>
                          </>
                        ) : (
                          <>
                            <Wifi size={24} className="text-slate-600" />
                            <p className="text-xs">Presione "Buscar Redes" para capturar puntos de acceso locales.</p>
                          </>
                        )}
                      </div>
                    ) : (
                      targets.map((t) => (
                        <div
                          key={t.bssid}
                          onClick={() => setSelectedTarget(t)}
                          className={`grid grid-cols-12 gap-2 px-4 py-3 cursor-pointer items-center transition ${
                            selectedTarget?.bssid === t.bssid 
                              ? "bg-rose-950/20 border-l-2 border-rose-500 text-white" 
                              : "hover:bg-slate-850/50 text-slate-300"
                          }`}
                        >
                          <span className="col-span-4 font-sans font-bold text-xs truncate flex items-center space-x-1.5">
                            <Wifi size={12} className={t.signal > -50 ? "text-emerald-400" : t.signal > -70 ? "text-amber-400" : "text-rose-400"} />
                            <span className="truncate">{t.essid}</span>
                          </span>
                          <span className="col-span-3 font-mono text-[10.5px] text-slate-400">{t.bssid}</span>
                          <span className="col-span-1 text-center font-mono text-xs">{t.channel}</span>
                          <span className="col-span-2 text-center font-mono text-[10.5px]">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              t.encryption === "WEP" 
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                                : t.encryption === "WPA3"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            }`}>
                              {t.encryption}
                            </span>
                          </span>
                          <span className="col-span-1 text-center font-mono text-xs">
                            {t.wps ? (
                              <span className="text-emerald-400 font-bold">SI</span>
                            ) : (
                              <span className="text-slate-600 font-bold">-</span>
                            )}
                          </span>
                          <span className="col-span-1 text-center font-mono text-xs font-semibold">
                            {t.signal} dBm
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selectedTarget && (
                  <div className="bg-slate-900 border border-rose-500/20 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-sans">Objetivo Wi-Fi seleccionado:</p>
                      <p className="text-sm font-bold text-rose-400 mt-0.5">{selectedTarget.essid} <span className="text-slate-550 font-mono text-xs">({selectedTarget.bssid})</span></p>
                    </div>
                    <button
                      onClick={() => setFbStep(3)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition uppercase tracking-wider"
                    >
                      Siguiente: Tipo de Ataque
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Attack Configuration */}
            {fbStep === 3 && selectedTarget && (
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4 max-w-2xl mx-auto w-full">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 shrink-0">
                  <Flame className="text-rose-500" size={18} />
                  <h4 className="text-sm font-bold text-white">Configurar Auditoría: {selectedTarget.essid}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Selectors */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Táctica de Auditoría:</label>
                    <div className="space-y-1.5">
                      {selectedTarget.encryption === "WEP" && (
                        <button
                          onClick={() => setFbAttackType("wep_arp")}
                          className={`w-full p-2.5 rounded-lg border text-left text-xs font-bold font-sans transition flex items-center justify-between ${
                            fbAttackType === "wep_arp"
                              ? "bg-rose-500/10 border-rose-500 text-rose-400"
                              : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800"
                          }`}
                        >
                          <span>ARP Replay & Injection</span>
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 font-mono px-1 border border-amber-500/20 rounded">WEP</span>
                        </button>
                      )}

                      {selectedTarget.encryption !== "WEP" && (
                        <>
                          <button
                            onClick={() => setFbAttackType("wpa_deauth")}
                            className={`w-full p-2.5 rounded-lg border text-left text-xs font-bold font-sans transition flex items-center justify-between ${
                              fbAttackType === "wpa_deauth"
                                ? "bg-rose-500/10 border-rose-500 text-rose-400"
                                : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800"
                            }`}
                          >
                            <span>Deauth (Aireplay Handshake)</span>
                            <span className="text-[9px] bg-cyan-500/10 text-cyan-400 font-mono px-1 border border-cyan-500/20 rounded">WPA2</span>
                          </button>

                          <button
                            onClick={() => setFbAttackType("wpa3_pmkid")}
                            className={`w-full p-2.5 rounded-lg border text-left text-xs font-bold font-sans transition flex items-center justify-between ${
                              fbAttackType === "wpa3_pmkid"
                                ? "bg-rose-500/10 border-rose-500 text-rose-400"
                                : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800"
                            }`}
                          >
                            <span>Ataque PMKID (Clientless)</span>
                            <span className="text-[9px] bg-purple-500/10 text-purple-400 font-mono px-1 border border-purple-500/20 rounded">WPA3</span>
                          </button>
                        </>
                      )}

                      {selectedTarget.wps && (
                        <button
                          onClick={() => setFbAttackType("wps_pixie")}
                          className={`w-full p-2.5 rounded-lg border text-left text-xs font-bold font-sans transition flex items-center justify-between ${
                            fbAttackType === "wps_pixie"
                              ? "bg-rose-500/10 border-rose-500 text-rose-400"
                              : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800"
                          }`}
                        >
                          <span>Reaver WPS (Pixie Dust)</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-mono px-1 border border-emerald-500/20 rounded">WPS PIN</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Context-based details */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 select-none">
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Parámetros del Objetivo:</label>
                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">SSID:</span>
                        <span className="text-slate-200 font-bold">{selectedTarget.essid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">BSSID:</span>
                        <span className="text-slate-200">{selectedTarget.bssid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Canal:</span>
                        <span className="text-slate-200">{selectedTarget.channel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Seguridad:</span>
                        <span className="text-rose-400 font-semibold">{selectedTarget.encryption}</span>
                      </div>
                    </div>

                    {fbAttackType === "wpa_deauth" && selectedTarget.clients.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-900">
                        <label className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Estación Cliente Objetivo:</label>
                        <select
                          value={deauthClient}
                          onChange={(e) => setDeauthClient(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-mono focus:outline-none cursor-pointer"
                        >
                          <option value="ALL CLIENTS (Broadcast)">Todos los Clientes (Broadcast)</option>
                          {selectedTarget.clients.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-3">
                  <button
                    onClick={() => setFbStep(2)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-lg transition uppercase tracking-wider"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => {
                      setFbStep(4);
                      handleFbAttackLaunch();
                    }}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-lg shadow-rose-600/10"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Lanzar Suite de Inyección</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Attack Execution */}
            {fbStep === 4 && selectedTarget && (
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4 max-w-2xl mx-auto w-full flex flex-col min-h-[350px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0 select-none">
                  <div className="flex items-center space-x-2">
                    <Flame className="text-rose-500 animate-pulse" size={18} />
                    <h4 className="text-sm font-bold text-white">Consola de Inyección Activa</h4>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase rounded ${
                    fbIsAttacking ? "bg-rose-500/10 text-rose-400 animate-pulse" : "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {fbIsAttacking ? "Ataque en progreso" : "Terminado"}
                  </span>
                </div>

                {/* Progress scrolling logs */}
                <div className="flex-1 bg-slate-950 border border-slate-850 p-4 rounded-xl font-mono text-xs text-slate-300 overflow-y-auto space-y-1.5 select-text min-h-[160px]">
                  {fbProgressLog.map((log, index) => (
                    <div key={index} className="leading-relaxed">
                      {log.startsWith("[✔]") ? (
                        <span className="text-emerald-400 font-bold">{log}</span>
                      ) : log.startsWith("[!]") ? (
                        <span className="text-amber-400 font-semibold">{log}</span>
                      ) : (
                        log
                      )}
                    </div>
                  ))}
                  {fbIsAttacking && (
                    <div className="text-rose-400 flex items-center space-x-1.5 animate-pulse select-none font-bold">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                      <span>Volcando paquetes en el aire...</span>
                    </div>
                  )}
                </div>

                {/* Captured artifacts view */}
                {!fbIsAttacking && fbCapturedHandshake && (
                  <div className="bg-slate-950 border border-emerald-500/10 p-4 rounded-xl space-y-3 animate-fade-in">
                    <div className="flex items-center space-x-2 select-none">
                      <Unlock className="text-emerald-400" size={16} />
                      <h5 className="text-xs font-bold text-slate-200">Resultados de la Auditoría</h5>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono select-none">
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-850 space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Archivo Volcado:</span>
                        <span className="text-slate-300 font-semibold truncate block" title={fbHandshakeFile}>{fbHandshakeFile}</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-850 space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Estado del descifrado:</span>
                        <span className={fbCrackedKey ? "text-emerald-400 font-bold block" : "text-amber-400 font-semibold block"}>
                          {fbCrackedKey ? "LLAVE OBTENIDA" : "Listo para Descifrar / crackear"}
                        </span>
                      </div>
                    </div>

                    {/* Cracking module */}
                    {fbCracking ? (
                      <div className="space-y-2 select-none">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Aircrack-ng atacando diccionario rockyou.txt...</span>
                          <span className="font-bold text-rose-400">{fbCrackingProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full transition-all duration-100" style={{ width: `${fbCrackingProgress}%` }}></div>
                        </div>
                      </div>
                    ) : fbCrackedKey ? (
                      <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-emerald-400 font-mono uppercase tracking-widest block font-bold">¡CONTRASENA ENCONTRADA CON ÉXITO!</span>
                          <span className="text-sm font-bold text-white font-mono select-text">{fbCrackedKey}</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(fbCrackedKey);
                            triggerNotification("Clave copiada al portapapeles", "success");
                          }}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
                          title="Copiar Clave"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleFbCrackLaunch}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition uppercase tracking-wider flex items-center justify-center space-x-1.5 font-sans"
                      >
                        <Database size={13} fill="currentColor" />
                        <span>Descifrar clave con diccionario rockyou.txt</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="flex space-x-3 pt-3 border-t border-slate-800 select-none">
                  <button
                    onClick={() => {
                      setFbStep(2);
                      setFbProgressLog([]);
                      setFbCapturedHandshake(false);
                      setFbCrackedKey("");
                    }}
                    disabled={fbIsAttacking}
                    className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-lg transition uppercase tracking-wider disabled:opacity-50"
                  >
                    Salir / Reiniciar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================
            TAB 2: MINIDWEP-GTK
        =================================== */}
        {activeTab === "minidwep" && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden font-mono text-xs">
            
            {/* Sidebar for minidwep control */}
            <div className="w-full md:w-56 p-4 bg-slate-900 border-r border-slate-850 flex flex-col justify-between shrink-0 select-none space-y-4">
              <div className="space-y-3.5">
                <div>
                  <span className="text-[9px] text-[#22c55e] uppercase tracking-widest block font-bold">MiniDwep-GTK</span>
                  <h4 className="text-[11px] font-bold text-white mt-0.5">Auditoría WEP/WPA Extrema</h4>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => setMdActiveSubTab("scan")}
                    className={`w-full p-2 rounded text-left transition block ${
                      mdActiveSubTab === "scan" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" : "hover:bg-slate-850 text-slate-400"
                    }`}
                  >
                    1. Rastrear Canales
                  </button>
                  <button
                    onClick={() => setMdActiveSubTab("wps")}
                    className={`w-full p-2 rounded text-left transition block ${
                      mdActiveSubTab === "wps" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" : "hover:bg-slate-850 text-slate-400"
                    }`}
                  >
                    2. Ataque WPS (PIN Reaver)
                  </button>
                  <button
                    onClick={() => setMdActiveSubTab("wep")}
                    className={`w-full p-2 rounded text-left transition block ${
                      mdActiveSubTab === "wep" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" : "hover:bg-slate-850 text-slate-400"
                    }`}
                  >
                    3. Desencriptar WEP
                  </button>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-850 space-y-1.5 text-[10px] text-slate-450 leading-normal">
                  <span className="text-slate-400 font-bold uppercase block mb-1">Estado de Interface:</span>
                  Dispositivo: wlan0mon <br />
                  Velocidad Rx: 150 Mbps <br />
                  Inyección: Soportada <br />
                  Driver udev: ath9k
                </div>
              </div>

              {mdActiveSubTab === "scan" && (
                <button
                  onClick={handleStartScan}
                  disabled={isScanning}
                  className="w-full py-2 bg-[#22c55e] hover:bg-emerald-400 disabled:bg-emerald-900 disabled:opacity-50 text-slate-950 font-bold rounded shadow transition uppercase"
                >
                  {isScanning ? "Sondeando..." : "Escanear Aire"}
                </button>
              )}
            </div>

            {/* Main display board */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#0c0f18] p-4">
              
              {/* Scan SubTab */}
              {mdActiveSubTab === "scan" && (
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  <p className="text-[10px] text-[#22c55e] uppercase tracking-wider font-bold shrink-0">Buscando objetivos con minidwep scanner...</p>
                  
                  <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl overflow-hidden flex flex-col min-h-[140px]">
                    <div className="grid grid-cols-12 gap-1 bg-slate-900 px-3 py-1.5 text-[9.5px] font-bold text-slate-550 border-b border-slate-850 select-none uppercase">
                      <span className="col-span-4">ESSID</span>
                      <span className="col-span-4">MAC BSSID</span>
                      <span className="col-span-1 text-center">CH</span>
                      <span className="col-span-1 text-center">WPS</span>
                      <span className="col-span-2 text-center">SEÑAL</span>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
                      {targets.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-600 select-none text-[11px]">
                          {isScanning ? "Sintonizando frames..." : "Sin datos de escaneo. Inicie desde el panel izquierdo."}
                        </div>
                      ) : (
                        targets.map(t => (
                          <div
                            key={t.bssid}
                            onClick={() => setSelectedTarget(t)}
                            className={`grid grid-cols-12 gap-1 px-3 py-2 cursor-pointer items-center text-[11px] ${
                              selectedTarget?.bssid === t.bssid ? "bg-rose-950/25 text-rose-300" : "hover:bg-slate-900/60 text-slate-400"
                            }`}
                          >
                            <span className="col-span-4 font-sans font-bold text-slate-300 truncate">{t.essid}</span>
                            <span className="col-span-4">{t.bssid}</span>
                            <span className="col-span-1 text-center">{t.channel}</span>
                            <span className="col-span-1 text-center text-emerald-400 font-bold">{t.wps ? "SI" : "NO"}</span>
                            <span className="col-span-2 text-center font-bold text-slate-300">{t.signal} dBm</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {selectedTarget && (
                    <div className="bg-slate-900/40 p-3 rounded-lg flex items-center justify-between border border-slate-850 shrink-0">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Objetivo minidwep:</span>
                        <span className="text-xs font-bold text-slate-200">{selectedTarget.essid} ({selectedTarget.bssid})</span>
                      </div>
                      <div className="flex space-x-2 select-none">
                        {selectedTarget.wps && (
                          <button
                            onClick={() => setMdActiveSubTab("wps")}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 font-bold rounded uppercase text-[10px]"
                          >
                            Ir a ataque WPS
                          </button>
                        )}
                        <button
                          onClick={() => setMdActiveSubTab("wep")}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 font-bold rounded uppercase text-[10px]"
                        >
                          Ir a WEP
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* WPS SubTab */}
              {mdActiveSubTab === "wps" && (
                <div className="flex-1 flex flex-col space-y-4">
                  <div className="flex items-center space-x-2 select-none shrink-0">
                    <Lock className="text-rose-500 animate-pulse" size={15} />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Módulo de Vulnerabilidades WPS (Reaver / Pixie Dust)</span>
                  </div>

                  {selectedTarget ? (
                    <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs pb-2 border-b border-slate-900 select-none">
                          <span className="text-slate-500">Punto de Acceso:</span>
                          <span className="text-slate-200 font-bold">{selectedTarget.essid} ({selectedTarget.bssid})</span>
                        </div>

                        {mdWpsStatus === "running" ? (
                          <div className="space-y-2 select-none">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Ejecutando ataque reaver-pixie...</span>
                              <span className="font-bold text-[#22c55e]">{mdWpsProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                              <div className="bg-[#22c55e] h-full transition-all duration-300" style={{ width: `${mdWpsProgress}%` }}></div>
                            </div>
                          </div>
                        ) : mdWpsStatus === "success" ? (
                          <div className="p-4 bg-emerald-950/20 border border-emerald-500/25 rounded-xl space-y-2.5 animate-fade-in">
                            <div className="flex items-center space-x-1.5 select-none">
                              <Unlock className="text-emerald-400 animate-pulse" size={16} />
                              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">¡Ataque Criptográfico Exitoso!</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs font-mono select-text leading-relaxed">
                              <div>
                                <span className="text-slate-500 uppercase text-[9px] block font-bold">PIN WPS obtenido:</span>
                                <span className="text-white font-bold">{mdWpsPin}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 uppercase text-[9px] block font-bold">Clave WPA obtenida:</span>
                                <span className="text-emerald-300 font-bold">{mdWpsKey}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 leading-relaxed select-none">
                            El protocolo WPS contiene fallas criptográficas en la generación de hashes (Pixie Dust) que permiten descifrar el PIN de 8 dígitos en segundos, revelando la clave secreta de la red sin necesidad de fuerza bruta prolongada.
                          </p>
                        )}
                      </div>

                      <div className="border-t border-slate-900 pt-3 flex justify-end shrink-0 select-none">
                        {mdWpsStatus === "running" ? (
                          <button
                            onClick={() => setMdWpsStatus("idle")}
                            className="px-4 py-2 bg-rose-900 hover:bg-rose-800 text-rose-100 font-bold uppercase rounded font-mono text-[10px]"
                          >
                            Abortar Ataque
                          </button>
                        ) : (
                          <button
                            onClick={runMdWpsAttack}
                            disabled={!selectedTarget.wps}
                            className="px-5 py-2.5 bg-[#22c55e] hover:bg-emerald-400 text-slate-950 font-bold uppercase rounded shadow transition"
                          >
                            Lanzar Auditoría Reaver WPS
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-600 select-none">
                      Seleccione un objetivo en la pestaña Rastrear Canales para iniciar.
                    </div>
                  )}
                </div>
              )}

              {/* WEP SubTab */}
              {mdActiveSubTab === "wep" && (
                <div className="flex-1 flex flex-col justify-center text-center p-8 select-none text-slate-400 space-y-3">
                  <AlertTriangle className="text-amber-500 mx-auto" size={28} />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Simulador WEP ARP Inyección</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Las redes WEP se consideran totalmente inseguras desde 2005. En Beini, herramienas como SpoonWEP automatizan la inyección de paquetes para desencriptar contraseñas en 2-5 minutos.
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Se recomienda utilizar el asistente FeedingBottle de Beini para ataques guiados WEP.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================
            TAB 3: BASH TERMINAL
        =================================== */}
        {activeTab === "cli" && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950 font-mono text-xs select-text">
            
            {/* Upper console header status */}
            <div className="flex items-center justify-between p-2.5 bg-slate-900 border-b border-slate-850 text-[10px] text-slate-450 select-none shrink-0">
              <div className="flex items-center space-x-2">
                <TermIcon size={12} className="text-rose-400 animate-pulse" />
                <span>Interfaz de Consola Aircrack-ng Suite Directa</span>
              </div>
              <span>Status: Online [ttyS0]</span>
            </div>

            {/* Simulated scroll lines terminal box */}
            <div className="flex-1 p-4 overflow-y-auto space-y-1.5 bg-slate-950/90 leading-relaxed">
              {cliLines.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {line.startsWith("root@beini:~# ") ? (
                    <div>
                      <span className="text-rose-500 font-bold">root@beini:~# </span>
                      <span>{line.replace("root@beini:~# ", "")}</span>
                    </div>
                  ) : line.includes("KEY FOUND!") ? (
                    <span className="text-emerald-400 font-black tracking-wide block bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-lg my-1">{line}</span>
                  ) : line.startsWith("Error:") ? (
                    <span className="text-rose-400 font-bold">{line}</span>
                  ) : line.includes("[✔]") ? (
                    <span className="text-emerald-400 font-bold">{line}</span>
                  ) : (
                    <span className="text-slate-300">{line}</span>
                  )}
                </div>
              ))}
              <div ref={cliEndRef} />
            </div>

            {/* Raw shell user input */}
            <div className="p-3 bg-slate-900 border-t border-slate-850 flex items-center space-x-2 shrink-0 select-none">
              <span className="text-rose-500 font-bold shrink-0">root@beini:~#</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                onKeyDown={handleCliKeyDown}
                placeholder="escribe 'help' o comandos de aircrack (e.g. airmon-ng start wlan0)"
                className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-700 caret-rose-500 text-xs"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          </div>
        )}

        {/* ===================================
            TAB 4: WORDLIST GENERATOR
        =================================== */}
        {activeTab === "wordlists" && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto p-4 gap-4">
            
            {/* Configuration side */}
            <div className="flex-1 bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-4 flex flex-col justify-between max-w-xl">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 shrink-0 select-none">
                  <Database className="text-rose-500" size={17} />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Generador de Diccionarios a Medida</h4>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed select-none">
                  Aircrack-ng depende de la robustez del diccionario usado. Un buen wordlist personalizado basado en el SSID y la locación del objetivo acorta el cracking exponencialmente en lugar de usar diccionarios de 15 GB genéricos.
                </p>

                <div className="grid grid-cols-3 gap-3 font-mono text-xs select-none">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block">Prefijo:</span>
                    <input
                      type="text"
                      value={wlPrefix}
                      onChange={(e) => setWlPrefix(e.target.value)}
                      placeholder="Ej: Movi"
                      className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs focus:outline-none focus:border-rose-500/50 text-slate-250 font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block">Palabra base:</span>
                    <input
                      type="text"
                      value={wlBase}
                      onChange={(e) => setWlBase(e.target.value)}
                      placeholder="Ej: wifi"
                      className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs focus:outline-none focus:border-rose-500/50 text-slate-250 font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block">Sufijo:</span>
                    <input
                      type="text"
                      value={wlSuffix}
                      onChange={(e) => setWlSuffix(e.target.value)}
                      placeholder="Ej: 2026"
                      className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs focus:outline-none focus:border-rose-500/50 text-slate-250 font-sans"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={generateWordlist}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider select-none mt-4 shrink-0 font-sans"
              >
                Generar Combinaciones de Diccionario
              </button>
            </div>

            {/* Generated Words Display */}
            <div className="flex-1 bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col space-y-3 min-w-[240px]">
              <div className="flex items-center justify-between shrink-0 select-none">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Palabras Generadas ({wordlistWords.length}):</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-mono px-1 border border-emerald-500/20 rounded font-bold uppercase">Listo para Aircrack</span>
              </div>

              <div className="flex-1 bg-slate-950 border border-slate-850 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-y-auto space-y-1 select-text">
                {wordlistWords.map((word, idx) => (
                  <div key={idx} className="hover:text-rose-400 transition cursor-default">
                    {word}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
