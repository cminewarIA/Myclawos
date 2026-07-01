import React, { useState, useRef, useEffect } from "react";
import { TerminalLine, VFSNode } from "../types";
import { parsePath, getNodeByPath, setNodeAtPath, deleteNodeAtPath } from "../vfs";
import { VERSION, BUILD_NUMBER } from "../version";
import { 
  Terminal as TerminalIcon, 
  Sparkles,
  Clock,
  Search,
  Trash2,
  X,
  Play,
  CornerDownLeft,
  ChevronRight
} from "lucide-react";

interface TerminalProps {
  vfs: VFSNode;
  setVfs: (newVfs: VFSNode) => void;
  currentPath: string[];
  setCurrentPath: (path: string[]) => void;
  openWindow: (windowId: string) => void;
  onOpenFileInEditor: (filePath: string[], fileName: string, content: string) => void;
  onPostChatMessageFromShell: (text: string) => void;
  touchMode?: boolean;
}

export default function Terminal({
  vfs,
  setVfs,
  currentPath,
  setCurrentPath,
  openWindow,
  onOpenFileInEditor,
  onPostChatMessageFromShell,
  touchMode = false,
}: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(() => {
    const isRoot = localStorage.getItem("claw_is_root") === "true";
    const baseLines: TerminalLine[] = [
      {
        id: "init-1",
        text: "Welcome to ClawBash Terminal v3.2.1-lts",
        type: "info",
      },
    ];
    if (isRoot) {
      baseLines.push(
        {
          id: "init-root-warn",
          text: "¡ATENCIÓN! Modo de Superusuario Directo (Acceso ROOT) activo.",
          type: "success",
        },
        {
          id: "init-root-info",
          text: "Sesión iniciada sin contraseña. Todos los comandos heredan privilegios elevados.",
          type: "info",
        }
      );
    } else {
      baseLines.push({
        id: "init-2",
        text: "Kernel con núcleo de inteligencia central: CMineWar OS Core ONLINE.",
        type: "success",
      });
    }
    baseLines.push({
      id: "init-3",
      text: "Escribe 'help' para ver una lista de comandos disponibles, o 'neofetch' para ver especificaciones.",
      type: "info",
    });
    return baseLines;
  });
  const [inputValue, setInputValue] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("claw_terminal_history");
    return saved ? JSON.parse(saved) : ["neofetch", "ls", "cd home/user", "help", "cminewar hola", "uname -a"];
  });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [themeColor, setThemeColor] = useState<"green" | "amber" | "white">("green");

  // History popup states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState(0);

  // Sync command history to localStorage
  useEffect(() => {
    localStorage.setItem("claw_terminal_history", JSON.stringify(commandHistory));
  }, [commandHistory]);

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom whenever logs update
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTo({
        top: terminalContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [lines]);

  // Handle focus on clicking terminal area
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  // Keep focus on input initially
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLine = (text: string, type: TerminalLine["type"] = "output") => {
    const newLine: TerminalLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      type,
    };
    setLines((prev) => [...prev, newLine]);
  };

  const getPathString = (pathArr: string[]) => {
    return "/" + pathArr.join("/");
  };

  // Command executor
  const executeCommand = async (fullCommand: string) => {
    const trimmed = fullCommand.trim();
    if (!trimmed) return;

    let activeVfs = vfs;
    let wasSuccess = true;
    let failureReason = "";

    // Save history
    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    // Show input echo line
    const isRoot = localStorage.getItem("claw_is_root") === "true";
    const promptUser = isRoot ? "root" : "user";
    const promptChar = isRoot ? "#" : "$";
    const pathPrompt = `${promptUser}@cminewar:${getPathString(currentPath)}${promptChar}`;
    addLine(`${pathPrompt} ${trimmed}`, "input");

    // Parse command name and arguments
    const parts = trimmed.split(/\s+/);
    let cmd = parts[0].toLowerCase();
    let args = parts.slice(1);

    // Automatical superuser assimilation (strips sudo prefix and executes with root permissions)
    if (cmd === "sudo" && args.length > 0) {
      cmd = args[0].toLowerCase();
      args = args.slice(1);
    }

    switch (cmd) {
      case "help":
        addLine("Comandos de CMineWarBash disponibles:", "info");
        addLine("  ls [dir]          - Listar archivos y directorios virtuales.", "output");
        addLine("  cd [dir]          - Cambiar de directorio (es posible usar '..').", "output");
        addLine("  pwd               - Imprimir la ruta del directorio de trabajo actual.", "output");
        addLine("  cat [archivo]     - Mostrar contenido de un archivo.", "output");
        addLine("  touch [archivo]   - Crear un archivo de texto vacío.", "output");
        addLine("  mkdir [dir]       - Crear una nueva carpeta virtual.", "output");
        addLine("  rm [archivo/dir]  - Eliminar archivos o directorios.", "output");
        addLine("  neofetch          - Mostrar logotipo estético del kernel y datos del SO.", "output");
        addLine("  date              - Mostrar el reloj de sistema.", "output");
        addLine("  whoami            - Mostrar el usuario con sesión activa.", "output");
        addLine("  uname -a          - Imprimir detalles del firmware y kernel central.", "output");
        addLine("  top               - Mostrar procesos clave ejecutándose en segundo plano.", "output");
        addLine("  agy [msg]         - Enviar directamente una pregunta a Antigravity CLI.", "success");
        addLine("  git [cmd]         - Gestionar y refrescar actualizaciones de GitHub.", "success");
        addLine("  download-iso      - Compilar y descargar la imagen ISO oficial (.iso).", "success");
        addLine("  history           - Ver, buscar y re-ejecutar comandos anteriores.", "success");
        addLine("  clear             - Limpiar la pantalla de la terminal.", "output");
        addLine("  theme [color]     - Cambiar tema de la terminal (green, amber, white).", "output");
        addLine("  install-service   - Instalar un nuevo servicio y asimilarlo en fondo.", "success");
        break;

      case "history":
        setIsHistoryOpen(true);
        addLine("Abriendo la ventana emergente de historial interactivo de CMineWar OS...", "success");
        break;

      case "clear":
        setLines([]);
        break;

      case "download-iso":
        {
          const isRoot = localStorage.getItem("claw_is_root") === "true";
          const sleepDisabled = localStorage.getItem("claw_sleep_disabled") === "true";
          const defaultBrowserChromium = localStorage.getItem("claw_default_browser") === "chromium";

          addLine("Iniciando compilador del firmware CMineWar OS ISO-9660...", "info");
          addLine("Sincronizando volumen del sistema de archivos actual (VFS)...", "info");
          addLine("Escribiendo sector de arranque GRUB bootloader con configuraciones locales...", "info");

          setTimeout(() => {
            addLine("[10%] Estructura de tracks virtuales asignada...", "output");
          }, 300);
          setTimeout(() => {
            addLine("[50%] Respaldo de base de datos VFS inyectado en /boot/vfs-backup.json...", "output");
          }, 600);
          setTimeout(() => {
            addLine("[90%] Certificados RSA firmados de forma segura...", "output");
          }, 900);

          setTimeout(() => {
            const vfsJson = JSON.stringify(vfs, null, 2);
            const isoDataContent = `========================================================================
CLAWOS LINUX COGNITIVE SYSTEM v1.1.2 ISO-9660 DEPLOYMENT ARCHIVE
========================================================================
Volume Label:  CMINEWAR_OS_LIVE_V112
Publisher:     CMineWar OS Foundation
Architecture:  x86_amd64 / Intel Virtualization Cores
Build Date:    2026-05-28 21:00 UTC
Virtual Size:  142.6 MB

[ BAKED KERNEL PARAMETERS - SELECTED INTEGRATED DIRECTIVES ]
------------------------------------------------------------------------
● AUTOLOGIN TARGET:    ${isRoot ? "Superuser 'root' Direct Mode (No Passwords)" : "Standard User 'user_claw_developer'"}
● ACPI POWER SUSPEND:  ${sleepDisabled ? "DISABLED PERMANENTLY (acpi=off sleep.allow=no)" : "ENABLED STANDARD POLICIES"}
● CORE WEB SUITE:      ${defaultBrowserChromium ? "Chromium Web Browser Defaulting" : "Generic Web Host Controller"}
------------------------------------------------------------------------

* GRUB BOOTLOADER DESCRIPTOR & HARDWARE INVOCATOR *
------------------------------------------------------------------------
cat << 'GRUB_CONFIG'
# /boot/grub/grub.cfg
set default="0"
set timeout=5

menuentry "CMineWar OS - Modo Omarchy (Consola Interactiva TUI/CLI Nativas x86)" {
    search --no-floppy --fs-uuid --set=root e8f2cb38-cc82-411a-8292
    linux /boot/vmlinuz-cminewar-x86_64 root=UUID=e8f2cb38-cc82-411a-8292 console=tty1 console=ttyS0 quiet intel_iommu=on init=/bin/cminewar-omarchy-init ${sleepDisabled ? "acpi=off sleep.allow=no" : ""}
    initrd /boot/initramfs-cminewar-x86_64-direct.img
}

menuentry "CMineWar OS - Modo Kiosco (Entorno Gráfico GUI x86 Nativas)" {
    search --no-floppy --fs-uuid --set=root e8f2cb38-cc82-411a-8292
    linux /boot/vmlinuz-cminewar-x86_64 root=UUID=e8f2cb38-cc82-411a-8292 console=tty1 console=ttyS0 quiet intel_iommu=on init=/bin/cminewar-kiosk-init ${sleepDisabled ? "acpi=off sleep.allow=no" : ""}
    initrd /boot/initramfs-cminewar-x86_64-direct.img
}

menuentry "CMineWar OS - Modo de Recuperación (System Safe Mode x86)" {
    linux /boot/vmlinuz-cminewar-x86_64 root=UUID=e8f2cb38-cc82-411a-8292 console=tty1 console=ttyS0 single quiet init=/bin/cminewar-recovery-init
    initrd /boot/initramfs-cminewar-x86_64-direct.img
}
GRUB_CONFIG

------------------------------------------------------------------------
* RECREATING THE WORKSPACE LOCAL COGNITIVE STRUCTURE (JSON SNAPSHOT) *
------------------------------------------------------------------------
This snapshot matches your current virtual disk environment precisely.
You can import or paste this VFS dump into CMineWar OS back-restores:

VFS_SNAPSHOT_BEGIN
${vfsJson}
VFS_SNAPSHOT_END

------------------------------------------------------------------------
* BASH BOOTSTRAP DEPLOYMENT SCRIPT (install.sh) *
------------------------------------------------------------------------
#!/usr/bin/env bash
# CMineWar OS Virtual deployment script
echo "=== CMINEWAR OS DEPLOYMENT INITIALIZER ==="
echo "Montando estructura virtual..."
mkdir -p /mnt/cminewar_root
mount -t ext4 /dev/sda3 /mnt/cminewar_root

echo "Escribiendo configuraciones del kernel..."
echo "${isRoot ? "ROOT_AUTOLOGIN=yes" : "STANDARD_USER=yes"}" > /mnt/cminewar_root/etc/cminewar/auth.conf
echo "${sleepDisabled ? "ALLOW_SUSPEND=no" : "ALLOW_SUSPEND=yes"}" > /mnt/cminewar_root/etc/systemd/sleep.conf

echo "Iniciando descarga de modulos cognitivos..."
curl -fsSL https://cminewar.ai/install.sh | bash

echo "Sincronizando volumen de archivos del usuario..."
sync
echo "== INSTALACION COMPLETADA CON EXITO - REINICIE SU CORTEX =="
`;

            const blob = new Blob([isoDataContent], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `cminewar-os-v1.1.2-live-${isRoot ? "root" : "user"}.iso`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            addLine("[SUCCESS] ¡Proceso de compilación de firmware completado con éxito!", "success");
            addLine(`[SUCCESS] Se descargó el archivo 'cminewar-os-v1.1.2-live-${isRoot ? "root" : "user"}.iso'.`, "success");
          }, 1200);
        }
        break;

      case "date":
        addLine(new Date().toString(), "output");
        break;

      case "whoami":
        {
          const isRoot = localStorage.getItem("claw_is_root") === "true";
          addLine(isRoot ? "root" : "user_claw_developer", "output");
        }
        break;

      case "git":
        {
          const subGit = args[0]?.toLowerCase();
          if (subGit === "pull" || subGit === "sync") {
            addLine("Conectando con api.github.com mediante túnel seguro...", "info");
            addLine("Comparando hash local de CMineWar OS con la rama remota de producción...", "info");
            addLine("Para sincronizar y aplicar la actualización completamente por consola o daemon de automatización:", "success");
            addLine("1. Inicie la aplicación gráfica 'Actualizador de GitHub' en su Escritorio.", "output");
            addLine("2. Configure su repositorio o pulse en 'Actualizar desde GitHub Ahora'.", "output");
            addLine("3. ¡O simplemente active el interruptor del Daemon de Actualización para automatizarlo!", "output");
          } else if (subGit === "status") {
            addLine("En la rama actual: main", "output");
            addLine("Tu rama está sincronizada con 'origin/main'.", "info");
            addLine("nada para hacer commit, el árbol de trabajo está limpio.", "output");
          } else if (subGit === "log") {
            addLine("commit a59e81b3f9dc23d8c1920ac349e1e2d93e1b7fcf", "success");
            addLine("Author: cminewar <admin@cminewar.org>", "output");
            addLine("Date:   Thu May 28 19:28:15 2026 -0400", "output");
            addLine("    feat: Añadir módulo de sincronización GitHub auto-actualizable", "info");
          } else {
            addLine("Uso: git [pull | status | log]", "error");
            wasSuccess = false;
            failureReason = `Subcomando git no soportado o inválido: ${args[0] || "ninguno"}`;
          }
        }
        break;

      case "uname":
        if (args.includes("-a") || args.includes("-r")) {
          addLine("Linux cminewar-kernel 5.16.0-cminewar-generic-quantum #1 SMP PREEMPT Thu May 28 18:43:12 UTC 2026 x86_64 GNU/Linux", "output");
        } else {
          addLine("Linux", "output");
        }
        break;

      case "theme":
        const col = args[0]?.toLowerCase();
        if (col === "green" || col === "amber" || col === "white") {
          setThemeColor(col as any);
          addLine(`Tema del terminal configurado a: ${col}`, "success");
        } else {
          addLine("Uso: theme [green | amber | white]", "error");
          wasSuccess = false;
          failureReason = `Tema de color inválido: ${args[0] || "no especificado"}`;
        }
        break;

      case "neofetch":
        {
          const isRoot = localStorage.getItem("claw_is_root") === "true";
          addLine(`       /\\_/\\       ${isRoot ? "root" : "user"}@cminewar.linux.os`, "success");
          addLine(`      ( o.o )      ----------------------------`, "success");
          addLine(`       > ^ <       SO: CMineWar OS Linux v${VERSION} (Compilación #${BUILD_NUMBER})`, "success");
          addLine(`      /     \\      Kernel: 5.16.0-cminewar-${isRoot ? "direct-root" : "generic"}`, "success");
          addLine(`     |       |     Tiempo encendido: 1 hora, 42 minutos`, "success");
          addLine(`    (_______)      Consola: CMineWarBash 3.2`, "success");
          addLine(`                   Tema: CMineWarDE (Oscuro Moderno)`, "success");
          addLine(`                   CPU: Emulador de Núcleo Cuántico Cortex (4 Núcleos)`, "success");
          addLine(`                   Memoria: 4096MB / 16384MB (32%)`, "success");
          addLine(`                   Motor de IA Núcleo CMineWar OS: EN LÍNEA (Activo)`, "success");
        }
        break;

      case "top":
        addLine("ID de Proceso (PID)  | NOMBRE               | CPU % | MEM % | ESTADO", "info");
        addLine("  1                  | systemd              | 0.0   | 0.1   | S (sleep)", "output");
        addLine("  42                 | cminewar-kernel-core | 1.8   | 8.4   | R (running)", "success");
        addLine("  50                 | cminewarbash-shell   | 0.2   | 1.2   | R (running)", "output");
        addLine("  120                | agetty-tty1          | 0.1   | 0.2   | S (sleep)", "output");
        addLine("  204                | code-editor-daemon   | 0.0   | 2.1   | S (sleep)", "output");
        addLine("  301                | tmux-server          | 1.2   | 1.4   | R (running)", "output");
        break;

      case "pwd":
        addLine(getPathString(currentPath), "output");
        break;

      case "install-service":
        if (!args[0] || !args[1]) {
          addLine("Uso: install-service [nombre-del-servicio] [descripción breve...]", "error");
          addLine("Ejemplo: install-service BananaSync 'Sincronizador automático de ramilletes'", "info");
          wasSuccess = false;
          failureReason = "Faltan argumentos para registrar el servicio";
        } else {
          const sName = args[0].replace(/-/g, " ");
          const sDesc = args.slice(1).join(" ");
          const sId = "custom-" + Date.now();
          
          let savedServices = [];
          try {
            const savedStr = localStorage.getItem("claw_system_services");
            if (savedStr) savedServices = JSON.parse(savedStr);
          } catch(err) {}
          
          if (savedServices.length === 0) {
            const sleepDisabled = localStorage.getItem("claw_sleep_disabled") === "true";
            savedServices = [
              { id: "openclaw-cog", name: "CMineWar OS Cognitive Daemon", description: "Enlace inteligente con el LLM", status: "active" },
              { id: "vfs-share", name: "Virtual File System Share", description: "Indexado en tiempo real con explorador", status: "active" },
              { id: "net-analyzer", name: "CMineWarNet Network Traffic Monitor", description: "Sensor de ancho de banda y paquetes", status: "active" },
              { id: "hardware-watch", name: "Cortex Thermal Supervisor", description: "Mantiene la temperatura estable", status: "active" },
              { id: "acpi-sleep", name: "ACPI Sleep/Suspend Supervisor", description: "Gestor de estado de energía de hardware. Suspendido permanentemente por root.", status: sleepDisabled ? "disabled_permanently" : "active" },
            ];
          }

          const newService = {
            id: sId,
            name: sName,
            description: sDesc,
            status: "active"
          };

          savedServices.push(newService);
          localStorage.setItem("claw_system_services", JSON.stringify(savedServices));
          
          addLine(`[SYSTEMD] Descargando y resolviendo dependencias para daemon: ${sName}...`, "info");
          addLine(`[SYSTEMD] Enlazando sockets y cargando firmas unitarias...`, "info");
          addLine(`[SUCCESS] ¡Servicio '${sName}' registrado y activado con éxito!`, "success");
          addLine(`[SUCCESS] Nano Banana ha asimilado el nuevo nudo de servicio en el fondo dinámico.`, "success");
          
          // Dispatch window event so background updates smoothly
          window.dispatchEvent(new Event("storage"));
        }
        break;

      case "ls":
        const targetLsPath = args[0] ? parsePath(currentPath, args[0]) : currentPath;
        const lsNode = getNodeByPath(activeVfs, targetLsPath);
        
        if (!lsNode) {
          addLine(`ls: no se puede acceder a '${args[0]}': No existe el archivo o el directorio`, "error");
          wasSuccess = false;
          failureReason = `No existe el archivo o el directorio: ${args[0]}`;
        } else if (lsNode.type === "file") {
          // just display file name
          addLine(lsNode.name, "output");
        } else if (lsNode.type === "dir" && lsNode.children) {
          const names = Object.values(lsNode.children).map((child) => {
            if (child.type === "dir") {
              return `${child.name}/  [Carpeta]`;
            }
            return `${child.name}   [Archivo]`;
          });
          if (names.length === 0) {
            addLine("(directorio vacío)", "info");
          } else {
            names.forEach((name) => addLine(name, "output"));
          }
        }
        break;

      case "cd":
        if (!args[0]) {
          // cd without arguments goes to /home/user or root
          setCurrentPath(["home", "user"]);
          break;
        }
        const targetCdPath = parsePath(currentPath, args[0]);
        const cdNode = getNodeByPath(activeVfs, targetCdPath);

        if (!cdNode) {
          addLine(`cd: '${args[0]}': No existe el directorio`, "error");
          wasSuccess = false;
          failureReason = `No existe el directorio: ${args[0]}`;
        } else if (cdNode.type !== "dir") {
          addLine(`cd: '${args[0]}': No es un directorio`, "error");
          wasSuccess = false;
          failureReason = `No es un directorio: ${args[0]}`;
        } else {
          setCurrentPath(targetCdPath);
        }
        break;

      case "cat":
        if (!args[0]) {
          addLine("Uso: cat [nombre_archivo]", "error");
          wasSuccess = false;
          failureReason = "Falta especificar el archivo";
          break;
        }
        const targetCatPath = parsePath(currentPath, args[0]);
        const fileName = targetCatPath.pop() || "";
        const parentNodeDir = getNodeByPath(activeVfs, targetCatPath);

        if (!parentNodeDir || !parentNodeDir.children || !parentNodeDir.children[fileName]) {
          addLine(`cat: ${args[0]}: El archivo no existe`, "error");
          wasSuccess = false;
          failureReason = `El archivo no existe: ${args[0]}`;
        } else {
          const fileToRead = parentNodeDir.children[fileName];
          if (fileToRead.type === "dir") {
            addLine(`cat: ${args[0]}: Es un directorio`, "error");
            wasSuccess = false;
            failureReason = `No se puede leer un directorio con cat: ${args[0]}`;
          } else {
            addLine(fileToRead.content || "(archivo sin contenido)", "output");
          }
        }
        break;

      case "touch":
        if (!args[0]) {
          addLine("Uso: touch [nombre_archivo]", "error");
          wasSuccess = false;
          failureReason = "Falta especificar el nombre de archivo";
          break;
        }
        const targetTouchPath = parsePath(currentPath, args[0]);
        const touchFileName = targetTouchPath.pop() || "";
        const touchParentNode = getNodeByPath(activeVfs, targetTouchPath);

        if (!touchParentNode || touchParentNode.type !== "dir") {
          addLine(`touch: no se puede crear '${args[0]}': Ruta inválida`, "error");
          wasSuccess = false;
          failureReason = `Ruta contenedora inválida para: ${args[0]}`;
        } else {
          // Node structure modification
          const newFile: VFSNode = {
            name: touchFileName,
            type: "file",
            content: `Creado el ${new Date().toLocaleDateString()} vía terminal bash.`,
          };
          const updatedVfs = setNodeAtPath(activeVfs, targetTouchPath, touchFileName, newFile);
          activeVfs = updatedVfs;
          addLine(`Archivo de texto '${touchFileName}' creado con éxito.`, "success");
        }
        break;

      case "mkdir":
        if (!args[0]) {
          addLine("Uso: mkdir [nombre_carpeta]", "error");
          wasSuccess = false;
          failureReason = "Falta especificar el nombre de carpeta";
          break;
        }
        const targetMkdirPath = parsePath(currentPath, args[0]);
        const mkdirName = targetMkdirPath.pop() || "";
        const mkdirParentNode = getNodeByPath(activeVfs, targetMkdirPath);

        if (!mkdirParentNode || mkdirParentNode.type !== "dir") {
          addLine(`mkdir: no se puede crear '${args[0]}': Carpeta contenedora inválida`, "error");
          wasSuccess = false;
          failureReason = `Ruta contenedora inválida para: ${args[0]}`;
        } else {
          const newDir: VFSNode = {
            name: mkdirName,
            type: "dir",
            children: {},
          };
          const updatedVfs = setNodeAtPath(activeVfs, targetMkdirPath, mkdirName, newDir);
          activeVfs = updatedVfs;
          addLine(`Carpeta de usuario '${mkdirName}' creada con éxito.`, "success");
        }
        break;

      case "rm":
        if (!args[0]) {
          addLine("Uso: rm [nombre_archivo_o_carpeta]", "error");
          wasSuccess = false;
          failureReason = "Falta especificar el elemento a eliminar";
          break;
        }
        const targetRmPath = parsePath(currentPath, args[0]);
        const rmName = targetRmPath.pop() || "";
        const rmParentNode = getNodeByPath(activeVfs, targetRmPath);

        if (!rmParentNode || !rmParentNode.children || !rmParentNode.children[rmName]) {
          addLine(`rm: no se puede eliminar '${args[0]}': No existe`, "error");
          wasSuccess = false;
          failureReason = `Elemento no encontrado: ${args[0]}`;
        } else {
          const updatedVfs = deleteNodeAtPath(activeVfs, targetRmPath, rmName);
          activeVfs = updatedVfs;
          addLine(`Elemento '${rmName}' eliminado de forma permanente.`, "info");
        }
        break;

      case "sudo":
        addLine("[SISTEMA] Ya tienes privilegios de root (superusuario) de forma permanente en CMineWar OS.", "info");
        addLine("Cualquier cambio se ejecuta de forma directa sin trabas ni restricciones de permisos.", "success");
        break;

      case "agy":
        const chatPrompt = args.join(" ");
        if (!chatPrompt.trim()) {
          addLine("Uso: agy [un mensaje para Antigravity CLI]", "error");
          wasSuccess = false;
          failureReason = "El mensaje para la IA no puede estar vacío";
          break;
        }
        
        addLine("Estableciendo enlace de baja latencia con Antigravity CLI...", "info");
        
        try {
          const response = await fetch("/api/cminewar/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: chatPrompt }),
          });
          const data = await response.json();
          
          addLine("--- Antigravity CLI Response (agy) ---", "success");
          addLine(data.text, "success");
          addLine("--------------------------------------", "success");
          
          // Also synch and open the central chat app for convenient interaction
          onPostChatMessageFromShell(chatPrompt);
        } catch (e: any) {
          addLine(`Error de enlace Antigravity CLI: ${e.message}`, "error");
          wasSuccess = false;
          failureReason = `Error de red de la IA: ${e.message}`;
        }
        break;

      default:
        // Try to check if target is a file in the working directory that can be ran
        const parentW = getNodeByPath(activeVfs, currentPath);
        if (parentW && parentW.children && parentW.children[cmd] && parentW.children[cmd].type === "file") {
          const selfFile = parentW.children[cmd];
          addLine(`Ejecutando script local '${cmd}':`, "info");
          addLine(selfFile.content || "Sin salida estándar.", "output");
        } else {
          addLine(`clawbash: comando no encontrado: '${cmd}'.`, "error");
          addLine("Tip: Escribe 'help' para descubrir utilidades.", "info");
          wasSuccess = false;
          failureReason = `Comando no encontrado: ${cmd}`;
        }
        break;
    }

    // Guardar registro de auditoría persistente en /var/log/cmd.log
    const logUser = isRoot ? "root" : "user_claw_developer";
    const logTime = new Date().toISOString().replace("T", " ").substring(0, 19);
    const logStatus = wasSuccess ? "SUCCESS" : `FAILED [${failureReason}]`;
    const logEntry = `[${logTime}] User: ${logUser} | Cwd: ${getPathString(currentPath)} | Cmd: "${trimmed}" | Status: ${logStatus}\n`;

    const logPath = ["var", "log"];
    const existingLogNode = getNodeByPath(activeVfs, [...logPath, "cmd.log"]);
    let oldLogs = "";
    if (existingLogNode && existingLogNode.type === "file") {
      oldLogs = existingLogNode.content || "";
    }

    const updatedLogNode: VFSNode = {
      name: "cmd.log",
      type: "file",
      content: oldLogs + logEntry,
    };

    const finalVfs = setNodeAtPath(activeVfs, logPath, "cmd.log", updatedLogNode);
    setVfs(finalVfs);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Intercept Ctrl+H to open command history popup
    if (e.key === "h" && e.ctrlKey) {
      e.preventDefault();
      setIsHistoryOpen(true);
      return;
    }

    if (e.key === "Enter") {
      const val = inputValue;
      setInputValue("");
      executeCommand(val);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputValue(commandHistory[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputValue("");
      } else {
        setHistoryIndex(nextIndex);
        setInputValue(commandHistory[nextIndex]);
      }
    }
  };

  // Filter and sort history (newest first)
  const sortedFilteredHistory = commandHistory
    .map((cmd, originalIdx) => ({ cmd, originalIdx }))
    .filter((item) => item.cmd.toLowerCase().includes(historySearch.toLowerCase()))
    .reverse();

  const handleSelectAndFill = (commandText: string) => {
    setInputValue(commandText);
    setIsHistoryOpen(false);
    setHistorySearch("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelectAndExecute = (commandText: string) => {
    setIsHistoryOpen(false);
    setHistorySearch("");
    executeCommand(commandText);
  };

  const handleDeleteHistoryItem = (originalIdx: number) => {
    setCommandHistory((prev) => prev.filter((_, idx) => idx !== originalIdx));
    setSelectedHistoryIdx((prev) => Math.max(0, prev - 1));
  };

  const handleHistoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (sortedFilteredHistory.length === 0) return;
      setSelectedHistoryIdx((prev) => 
        prev === 0 ? sortedFilteredHistory.length - 1 : prev - 1
      );
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (sortedFilteredHistory.length === 0) return;
      setSelectedHistoryIdx((prev) => 
        prev === sortedFilteredHistory.length - 1 ? 0 : prev + 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (sortedFilteredHistory.length > 0 && selectedHistoryIdx < sortedFilteredHistory.length) {
        handleSelectAndExecute(sortedFilteredHistory[selectedHistoryIdx].cmd);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsHistoryOpen(false);
      setHistorySearch("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const colorClasses = {
    green: {
      text: "text-emerald-400 font-mono",
      caret: "bg-emerald-400",
      border: "border-emerald-500/30",
      accent: "text-emerald-500",
    },
    amber: {
      text: "text-amber-500 font-mono",
      caret: "bg-amber-500",
      border: "border-amber-500/30",
      accent: "text-amber-600",
    },
    white: {
      text: "text-slate-100 font-mono",
      caret: "bg-slate-300",
      border: "border-slate-500/30",
      accent: "text-slate-400",
    },
  }[themeColor];

  return (
    <div
      ref={terminalContainerRef}
      onClick={handleTerminalClick}
      className="relative flex-1 flex flex-col bg-slate-950 p-4 font-mono text-xs overflow-y-auto cursor-text select-text overflow-x-hidden"
      style={{ minHeight: "100%" }}
    >
      {/* Scrollable terminal lines */}
      <div className="flex-1 space-y-2">
        {lines.map((line) => {
          let lineStyle = "text-slate-300";
          if (line.type === "input") lineStyle = "text-slate-100 font-semibold";
          else if (line.type === "error") lineStyle = "text-rose-400 font-bold";
          else if (line.type === "success") lineStyle = "text-emerald-400";
          else if (line.type === "info") lineStyle = "text-blue-400";

          return (
            <div key={line.id} className="whitespace-pre-wrap leading-relaxed break-all">
              {line.type === "input" ? (
                <span className={lineStyle}>{line.text}</span>
              ) : (
                <span className={lineStyle}>{line.text}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Touch Mode On-Screen Auxiliary Command Keys (Fully touchscreen/tablet optimized) */}
      {touchMode && (
        <div className="flex items-center space-x-1.5 overflow-x-auto py-2 shrink-0 select-none scrollbar-thin scrollbar-thumb-slate-800 touch-pan-x border-t border-slate-900/60 mt-3">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-black shrink-0 mr-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">
            Comandos:
          </span>
          {[
            { label: "ls", cmd: "ls" },
            { label: "cd ..", cmd: "cd .." },
            { label: "clear", cmd: "clear" },
            { label: "help", cmd: "help" },
            { label: "neofetch", cmd: "neofetch" },
            { label: "whoami", cmd: "whoami" },
            { label: "uname -a", cmd: "uname -a" },
            { label: "cminewar", cmd: "cminewar ¿qué servicios están activos?" },
            { label: "top", cmd: "top" },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                executeCommand(btn.cmd);
              }}
              className="px-3 py-1 bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900 active:bg-emerald-950/40 text-[11px] font-mono text-slate-300 hover:text-emerald-400 rounded-md whitespace-nowrap transition cursor-pointer"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Shell interactive command builder */}
      <div className="flex items-center space-x-1.5 border-t border-slate-900/60 pt-3 mt-4 shrink-0">
        <span className={`${colorClasses.text} font-bold shrink-0`}>
          {localStorage.getItem("claw_is_root") === "true" ? "root" : "user"}@cminewar:{getPathString(currentPath)}{localStorage.getItem("claw_is_root") === "true" ? "#" : "$"}
        </span>
        <div className="flex-1 relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full bg-transparent border-none outline-none focus:ring-0 p-0 ${colorClasses.text}`}
            spellCheck="false"
            autoComplete="off"
            id="terminal-input"
          />
        </div>
      </div>

      {/* Terminal Footer Indicator */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-4 pt-2 border-t border-slate-900 shrink-0 select-none flex-wrap gap-2">
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="flex items-center space-x-1">
            <TerminalIcon size={11} className="text-slate-500" />
            <span>Bash Simulator v3.2</span>
          </span>
          <span>•</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setThemeColor("green");
            }}
            className={`hover:underline ${themeColor === "green" ? "text-emerald-400" : ""}`}
          >
            Green
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setThemeColor("amber");
            }}
            className={`hover:underline ${themeColor === "amber" ? "text-amber-500" : ""}`}
          >
            Amber
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setThemeColor("white");
            }}
            className={`hover:underline ${themeColor === "white" ? "text-white" : ""}`}
          >
            White
          </button>
          <span>•</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHistoryOpen(true);
            }}
            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-900 border ${colorClasses.border} hover:border-emerald-500/60 text-[9px] hover:text-emerald-400 transition ml-1`}
            title="Abrir historial de comandos interactivo (Atajo: Ctrl+H o escribe 'history')"
            id="btn-open-terminal-history-footer"
          >
            <Clock size={10} className="text-emerald-400 shrink-0" />
            <span>Historial ({commandHistory.length})</span>
          </button>
        </div>
        <div className="flex items-center space-x-1 text-slate-400 bg-sky-950/40 border border-sky-500/20 px-1.5 py-0.5 rounded">
          <Sparkles size={10} className="text-cyan-400 animate-pulse" />
          <span>Núcleo CMineWar OS Vinculado</span>
        </div>
      </div>

      {/* Commands history list popup system */}
      {isHistoryOpen && (
        <div 
          className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-30 p-5 flex flex-col select-none border border-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
            <div className={`flex items-center space-x-2 ${colorClasses.text}`}>
              <Clock size={14} className="animate-pulse text-emerald-400" />
              <span className="font-bold tracking-wider uppercase text-[11px] text-slate-100">
                Historial de Comandos de CMineWar OS
              </span>
            </div>
            <button
              onClick={() => {
                setIsHistoryOpen(false);
                setHistorySearch("");
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="p-1 hover:bg-slate-900 rounded-md text-slate-400 hover:text-rose-400 transition"
              title="Cerrar historial (Esc)"
              id="btn-close-terminal-history-popup"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-3 shrink-0">
            <input
              type="text"
              placeholder="Buscar comando en el historial..."
              value={historySearch}
              onChange={(e) => {
                setHistorySearch(e.target.value);
                setSelectedHistoryIdx(0);
              }}
              onKeyDown={handleHistoryKeyDown}
              className={`w-full bg-slate-900 border ${colorClasses.border} focus:border-emerald-500/80 rounded px-3 py-2 pl-9 text-xs text-slate-200 outline-none transition font-mono`}
              autoFocus
              id="history-search-input"
            />
            <Search className="absolute left-3 top-2.5 text-slate-500" size={13} strokeWidth={2.5} />
            {historySearch && (
              <button
                onClick={() => {
                  setHistorySearch("");
                  setSelectedHistoryIdx(0);
                }}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-350 text-[10px]"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Instruction helper */}
          <div className="text-[10px] text-slate-400 mb-2 border-b border-slate-900 pb-2 flex justify-between items-center">
            <span>Usa <kbd className="bg-slate-900 border border-slate-850 px-1 py-0.5 rounded text-cyan-400">↑↓</kbd> para navegar, <kbd className="bg-slate-900 border border-slate-850 px-1 py-0.5 rounded text-emerald-400">Enter</kbd> para ejecutar, o doble clic.</span>
            <span className="font-mono text-xs font-bold text-slate-500">
              {sortedFilteredHistory.length} comando(s)
            </span>
          </div>

          {/* Command history list */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
            {sortedFilteredHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-500 space-y-1 text-xs">
                <Clock size={20} className="mx-auto text-slate-700 mb-2" />
                <p>No se encontraron comandos en el historial.</p>
                <p className="text-[10px] text-slate-600">Prueba con otra búsqueda o ejecuta nuevos comandos en la terminal.</p>
              </div>
            ) : (
              sortedFilteredHistory.map((item, index) => {
                const isSelected = index === selectedHistoryIdx;
                return (
                  <div
                    key={`${item.originalIdx}-${index}`}
                    onClick={() => setSelectedHistoryIdx(index)}
                    onDoubleClick={() => handleSelectAndExecute(item.cmd)}
                    className={`group flex items-center justify-between p-2 rounded cursor-pointer transition ${
                      isSelected
                        ? "bg-slate-900/90 border border-emerald-500/30 text-emerald-400 shadow shadow-emerald-500/5"
                        : "bg-slate-900/25 border border-transparent text-slate-300 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <span className="text-[9px] font-mono text-slate-500 tracking-tight font-bold shrink-0 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">
                        #{item.originalIdx + 1}
                      </span>
                      <span className="font-mono text-xs truncate break-all block text-left">
                        {item.cmd}
                      </span>
                    </div>

                    {/* Fast actions */}
                    <div className="flex items-center space-x-1 shrink-0 opacity-80 md:opacity-0 group-hover:opacity-100 transition pl-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndFill(item.cmd);
                        }}
                        title="Pegar comando en la consola"
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition"
                      >
                        <CornerDownLeft size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndExecute(item.cmd);
                        }}
                        title="Ejecutar ahora"
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition"
                      >
                        <Play size={11} fill="currentColor" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHistoryItem(item.originalIdx);
                        }}
                        title="Eliminar de historial"
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action Footer buttons */}
          <div className="mt-4 border-t border-slate-900 pt-3 flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                if (confirm("¿Estás seguro de que quieres vaciar todo el historial de comandos?")) {
                  setCommandHistory([]);
                  setSelectedHistoryIdx(0);
                }
              }}
              disabled={commandHistory.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-rose-950/20 border border-slate-850 hover:border-rose-900/30 text-[10px] text-slate-400 hover:text-rose-400 rounded transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              id="btn-clear-terminal-history"
            >
              <Trash2 size={11} />
              <span>Limpiar Historial</span>
            </button>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsHistoryOpen(false);
                  setHistorySearch("");
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-slate-100 rounded transition text-[10px] font-semibold"
              >
                Cancelar
              </button>

              {sortedFilteredHistory.length > 0 && (
                <button
                  onClick={() => handleSelectAndExecute(sortedFilteredHistory[selectedHistoryIdx].cmd)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition flex items-center space-x-1 text-[10px] font-bold shadow shadow-emerald-500/10"
                >
                  <Play size={11} fill="currentColor" />
                  <span>Ejecutar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
