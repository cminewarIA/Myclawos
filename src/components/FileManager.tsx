import React, { useState, useEffect } from "react";
import { VFSNode } from "../types";
import { getNodeByPath, setNodeAtPath, deleteNodeAtPath } from "../vfs";
import { 
  Folder, 
  File, 
  ArrowLeft, 
  Plus, 
  FolderPlus, 
  Trash2, 
  FileCode2, 
  ChevronRight, 
  Server, 
  HardDrive, 
  Laptop, 
  Network, 
  Cloud, 
  ShieldCheck, 
  Download, 
  Upload, 
  Unlink, 
  Link2, 
  RefreshCw, 
  Globe, 
  PlusCircle, 
  X, 
  Terminal, 
  Info,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";

interface FileManagerProps {
  vfs: VFSNode;
  setVfs: (newVfs: VFSNode) => void;
  currentPath: string[];
  setCurrentPath: (path: string[]) => void;
  openWindow: (windowId: string) => void;
  onOpenFileInEditor: (filePath: string[], fileName: string, content: string) => void;
  touchMode?: boolean;
}

interface RemoteFile {
  name: string;
  type: "file" | "dir";
  size: string;
  content: string;
}

interface Connection {
  id: string;
  type: "SMB" | "FTP" | "SFTP";
  name: string;
  host: string;
  port: string;
  path: string;
  username: string;
  files: RemoteFile[];
}

const DEFAULT_CONNECTIONS: Connection[] = [
  {
    id: "smb-corp",
    type: "SMB",
    name: "SMB - Corporativo CMineWarFS",
    host: "10.0.0.45",
    port: "445",
    path: "/Admin_Compartido",
    username: "root",
    files: [
      { name: "contratos_2026.pdf", type: "file", size: "4.2 MB", content: "=====================================================\nCONTRATO DE LICENCIA DE SERVICIOS ADICIONALES DE UNIDAD COGNITIVA\n=====================================================\nReferencia: CMINEWAROS-LIC-2026-X8\nFecha: 2026-05-15\n\nPor el presente documento, se autoriza a CMineWar OS el uso indefinido de los daemons cognitivos en modo autologin raíz de manera permanente para la gestión centralizada de sistemas autónomos." },
      { name: "presupuesto_cminewar.xlsx", type: "file", size: "12.8 MB", content: "Balance General de recursos CMineWar OS:\n* Emulación Cortex CPU: $1,200\n* Clientes síncronos Gemini API: $450\n* Conexiones SSH/SFTP seguras redundantes: $200\n* Total asignado para desarrollo continuo: $1,850" },
      { name: "claves_servidor.txt", type: "file", size: "1.2 KB", content: "[CLAVES DE ENLACE RED INTERNA]\nsmb_pass=C0gn1t1v3CMineWarOS#2026\nsftp_priv_key=sha256:7uK+aB9x2p90zM8aVqX\nftp_anonymous_write=disallowed" },
    ]
  },
  {
    id: "ftp-pub",
    type: "FTP",
    name: "FTP - Descargas Públicas CMineWar OS",
    host: "ftp.cminewar.ai",
    port: "21",
    path: "/pub",
    username: "anonymous",
    files: [
      { name: "cminewaros_source_v1.1.2.tar.gz", type: "file", size: "142 MB", content: "[CONTENIDO BINARIO - CÓDIGO FUENTE COMPILADO DE CMINEWAR OS COMPLETO]" },
      { name: "manual_acpi_espanol.txt", type: "file", size: "45 KB", content: "=====================================================\nMANUAL DE CONFIGURACIÓN DE ENERGÍA DE CMINEWAR OS (HARDWARE ACPI)\n=====================================================\n\nPara garantizar que los servicios de automatización sigan en línea sin interrupciones ni suspensiones no deseadas, el sistema operativo implementa en /etc/systemd/sleep.conf directivas estrictas para anular por completo la suspensión y la hibernación.\n\nADVERTENCIA:\n* No intente reactivar el ACPI sleep a menos que trabaje en modo portátil de batería limitada." },
      { name: "linux_guide.pdf", type: "file", size: "3.5 MB", content: "Guía de referencia rápida sobre comandos del sistema CMineWar OS.\nComandos cubiertos: sudo, whoami, cminewar, neofetch, top, ls, rm, cd." },
    ]
  },
  {
    id: "sftp-secure",
    type: "SFTP",
    name: "SFTP - Servidor Seguro SSH",
    host: "sftp.mycminewaros.org",
    port: "22",
    path: "/root/secure_files",
    username: "root",
    files: [
      { name: "authorized_keys", type: "file", size: "400 B", content: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCy1Zz8v2Jpx9xSdf... root@cminewar" },
      { name: "database_backup_2026.sql", type: "file", size: "89 MB", content: "-- PostgreSQL Database Dump\n-- Backup created on: 2026-05-28 12:00:23 UTC\n\nCREATE TABLE app_users (\n    id SERIAL PRIMARY KEY,\n    username VARCHAR(100) UNIQUE,\n    is_root BOOLEAN DEFAULT TRUE\n);\n\nINSERT INTO app_users VALUES (1, 'root', true);\nINSERT INTO app_users VALUES (2, 'user_cminewar_developer', false);" },
      { name: "auto_update_daemon.py", type: "file", size: "12 KB", content: "import os\nimport sys\n# Daemon de actualización remota síncrona en CMineWar OS.\ndef check_repo_updates():\n    print('[DAEMON] Buscando actualizaciones remotas en cminewarIA/MyCMineWarOS...')\n    # Sincronización git automática activa\n    return True\n\nif __name__ == '__main__':\n    check_repo_updates()" },
    ]
  }
];

export default function FileManager({
  vfs,
  setVfs,
  currentPath,
  setCurrentPath,
  openWindow,
  onOpenFileInEditor,
  touchMode = false,
}: FileManagerProps) {
  // Navigation Location State
  const [activeLocation, setActiveLocation] = useState<"local" | Connection>("local");
  
  // Storage for user connections
  const [connections, setConnections] = useState<Connection[]>(() => {
    const saved = localStorage.getItem("claw_network_connections");
    return saved ? JSON.parse(saved) : DEFAULT_CONNECTIONS;
  });

  // Modal connection state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState<"SMB" | "FTP" | "SFTP">("SMB");
  const [newName, setNewName] = useState("");
  const [newHost, setNewHost] = useState("");
  const [newPort, setNewPort] = useState("");
  const [newPath, setNewPath] = useState("/");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Handshake and simulated loading logs State
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [connectProgress, setConnectProgress] = useState(0);

  // Selected elements state
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [selectedRemoteFile, setSelectedRemoteFile] = useState<RemoteFile | null>(null);

  // Get current local node details
  const currentDirectoryNode = getNodeByPath(vfs, currentPath);

  // Local navigation back
  const handleGoBack = () => {
    if (currentPath.length > 0) {
      const copy = [...currentPath];
      copy.pop();
      setCurrentPath(copy);
      setSelectedItemName(null);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
    setSelectedItemName(null);
  };

  const handleLocalItemClick = (node: VFSNode) => {
    setSelectedItemName(node.name);
    
    if (node.type === "dir") {
      setCurrentPath([...currentPath, node.name]);
      setSelectedItemName(null);
    } else {
      onOpenFileInEditor([...currentPath], node.name, node.content || "");
      openWindow("text_editor");
    }
  };

  // Add standard file
  const handleCreateFile = () => {
    const filename = prompt("Ingrese nombre del nuevo archivo (ej. notas.txt):");
    if (!filename) return;

    if (currentDirectoryNode?.children && currentDirectoryNode.children[filename]) {
      alert("Ya existe un archivo o carpeta con ese nombre.");
      return;
    }

    const newFile: VFSNode = {
      name: filename,
      type: "file",
      content: `Nuevo archivo local creado el ${new Date().toLocaleDateString()} vía explorador gráfico.`,
    };

    const updatedVfs = setNodeAtPath(vfs, currentPath, filename, newFile);
    setVfs(updatedVfs);
  };

  // Add standard folder
  const handleCreateDirectory = () => {
    const dirname = prompt("Ingrese nombre de la nueva carpeta:");
    if (!dirname) return;

    if (currentDirectoryNode?.children && currentDirectoryNode.children[dirname]) {
      alert("Ya existe un archivo o carpeta con ese nombre.");
      return;
    }

    const newDir: VFSNode = {
      name: dirname,
      type: "dir",
      children: {},
    };

    const updatedVfs = setNodeAtPath(vfs, currentPath, dirname, newDir);
    setVfs(updatedVfs);
  };

  // Delete local item
  const handleDeleteItem = (itemName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Está seguro de que desea eliminar permanentemente '${itemName}'?`)) {
      return;
    }

    const updatedVfs = deleteNodeAtPath(vfs, currentPath, itemName);
    setVfs(updatedVfs);
    setSelectedItemName(null);
  };

  // Selection trigger of sidebar location
  const handleSelectLocal = () => {
    setActiveLocation("local");
    setSelectedRemoteFile(null);
    setSelectedItemName(null);
  };

  const handleTriggerConnection = (conn: Connection) => {
    setIsConnecting(true);
    setConnectProgress(0);
    setSelectedRemoteFile(null);
    setSelectedItemName(null);

    // Dynamic handshakes depending on protocol chosen
    let logs: string[] = [];
    if (conn.type === "SMB") {
      logs = [
        `[NET] Iniciando socket TCP seguro con el host ${conn.host} en puerto ${conn.port}...`,
        `[NET] OK: Enlace TCP bidireccional establecido con éxito.`,
        `[SMB] Negociando dialecto de almacenamiento de red SMB (v2.1 / v3.1.1)...`,
        `[SMB] Protocolo de red SMB v3.1.1 acordado con éxito.`,
        `[AUTH] Enviando solicitud de sesión cifrada al usuario '${conn.username || "root"}'...`,
        `[AUTH] Credenciales validadas. Firma digital activa.`,
        `[SMB] Montando carpeta remota: ${conn.path}...`,
        `[SMB] ¡Éxito! Estructura virtual montada correctamente.`
      ];
    } else if (conn.type === "FTP") {
      logs = [
        `[NET] Abriendo socket de control pasivo a ${conn.host}:${conn.port}...`,
        `[FTP] 220 (vsFTPd 3.0.5 - CMineWar OS Embedded Daemon)`,
        `[FTP] -> USER ${conn.username || "anonymous"}`,
        `[FTP] 331 Please specify password for user ${conn.username || "anonymous"}.`,
        `[FTP] -> PASS **********`,
        `[FTP] 230 Login successful. System type is UNIX.`,
        `[FTP] -> CWD ${conn.path}`,
        `[FTP] 250 Directory successfully changed to ${conn.path}`,
        `[FTP] -> PASV`,
        `[FTP] 227 Entering Passive Mode.`,
        `[FTP] -> LIST`,
        `[FTP] 150 Here comes the directory listing.`,
        `[FTP] 226 Directory send OK.`
      ];
    } else { // SFTP
      logs = [
        `[SSH] Estableciendo túnel seguro SSHv2 cifrado a ${conn.host} en el puerto ${conn.port}...`,
        `[SSH] Conexión establecida. Protocolo SSH-2.0-OpenSSH_9.5p1_CMineWarOS`,
        `[SSH] Negociando algoritmos de criptografía y suites MAC...`,
        `[SSH] Algoritmo acordado: chacha20-poly1305@openssh.com`,
        `[SSH] Intercambiando certificados del host. Firma digital correcta.`,
        `[SSH] Solicitando autenticación por par de llaves/contraseña para '${conn.username || "root"}'...`,
        `[AUTH] Acceso autorizado por firmas de seguridad de superusuario.`,
        `[SSH] Inicializando canal de transporte síncrono SFTP...`,
        `[SFTP] Suscribiendo comandos de lectura/escritura en el subdirectorio: ${conn.path}...`,
        `[SFTP] Handshake SFTP v6 exitoso. Canal enlazado.`
      ];
    }

    setConnectionLogs([logs[0]]);
    
    let index = 1;
    const interval = setInterval(() => {
      if (index < logs.length) {
        setConnectionLogs(prev => [...prev, logs[index]]);
        setConnectProgress(Math.floor((index / (logs.length - 1)) * 100));
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsConnecting(false);
          setActiveLocation(conn);
        }, 500);
      }
    }, 200);
  };

  // Add custom server connection form
  const handleAddConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newHost) {
      alert("Por favor rellene al menos el nombre del servidor y la dirección del host.");
      return;
    }

    const defaultPort = newPort || (newType === "SMB" ? "445" : newType === "FTP" ? "21" : "22");
    const connId = `custom-${Date.now()}`;

    const customConn: Connection = {
      id: connId,
      type: newType,
      name: newName,
      host: newHost,
      port: defaultPort,
      path: newPath || "/",
      username: newUsername || "anonymous",
      files: [
        { 
          name: "LEEME_remoto.txt", 
          type: "file", 
          size: "450 B", 
          content: `=====================================================\nCONEXIÓN '${newType}' ESTABLECIDA CORRECTAMENTE\n=====================================================\nHost adjunto: ${newHost}:${defaultPort}\nRuta inicial: ${newPath || "/"}\nUsuario conectado: ${newUsername || "anonymous"}\n\nEste es un volumen remoto virtualizado seguro dentro de la suite de red de CMineWar OS.\nPuedes transferir archivos de este servidor a tu VFS local de inmediato.` 
        },
        { 
          name: "diagnostico_red.xml", 
          type: "file", 
          size: "1.2 KB", 
          content: '<?xml version="1.0" encoding="UTF-8"?>\n<service>\n  <name>CMineWar OS Network Bridge</name>\n  <bandwidth>100 Mbps</bandwidth>\n  <latency>0.4ms</latency>\n  <status>CONNECTED_AND_VERIFIED</status>\n</service>' 
        }
      ]
    };

    const updated = [...connections, customConn];
    setConnections(updated);
    localStorage.setItem("claw_network_connections", JSON.stringify(updated));

    // Clear form
    setNewName("");
    setNewHost("");
    setNewPort("");
    setNewPath("/");
    setNewUsername("");
    setNewPassword("");
    setShowAddForm(false);

    // Instantly launch connection handshake
    handleTriggerConnection(customConn);
  };

  // Remove stored connection
  const handleDeleteConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Está seguro de que desea eliminar permanentemente esta conexión guardada?")) {
      return;
    }

    const filtered = connections.filter(c => c.id !== id);
    setConnections(filtered);
    localStorage.setItem("claw_network_connections", JSON.stringify(filtered));

    if (activeLocation !== "local" && activeLocation.id === id) {
      setActiveLocation("local");
    }
  };

  // Download action: Remote -> Local currentPath
  const handleDownloadRemoteFile = (fileObj: RemoteFile) => {
    const filename = fileObj.name;
    
    if (currentDirectoryNode?.children && currentDirectoryNode.children[filename]) {
      const overwrite = confirm(`El archivo '${filename}' ya existe en el directorio local activo. ¿Deseas sobreescribirlo?`);
      if (!overwrite) return;
    }

    const isConnectionObject = activeLocation !== "local";
    const serverName = isConnectionObject ? activeLocation.name : "Servidor Desconocido";
    const serverType = isConnectionObject ? activeLocation.type : "UNKNOWN";
    const serverHost = isConnectionObject ? activeLocation.host : "0.0.0.0";

    const localCopy: VFSNode = {
      name: filename,
      type: "file",
      content: `--- ARCHIVO DESCARGADO VÍA PROTOCOLO ${serverType} ---\n` +
               `Servidor de origen: ${serverName} (${serverHost})\n` +
               `Fecha de transferencia: ${new Date().toLocaleString()}\n` +
               `------------------------------------------------------\n\n` +
               fileObj.content,
    };

    const updatedVfs = setNodeAtPath(vfs, currentPath, filename, localCopy);
    setVfs(updatedVfs);
    alert(`¡Descarga completada con éxito!\nEl archivo '${filename}' se ha copiado en la ubicación local actual (/${currentPath.join("/")}).`);
  };

  // Upload action: Local currentPath -> Remote server
  const handleUploadLocalFileToRemote = () => {
    if (activeLocation === "local") return;
    
    const localFiles = currentDirectoryNode?.children ? Object.values(currentDirectoryNode.children).filter(c => c.type === "file") : [];
    if (localFiles.length === 0) {
      alert("No hay archivos en tu directorio local para subir. Primero crea o navega a un archivo local.");
      return;
    }

    const fileNames = localFiles.map(f => f.name).join(", ");
    const filenameToUpload = prompt(`Ingrese el nombre del archivo local que desea subir al servidor (${fileNames}):`);
    if (!filenameToUpload) return;

    const fileNode = localFiles.find(f => f.name === filenameToUpload);
    if (!fileNode) {
      alert("Archivo local no encontrado en el directorio activo.");
      return;
    }

    // Append to remote files list of active location
    const updatedConnections = connections.map(conn => {
      if (conn.id === activeLocation.id) {
        // Avoid duplicates in remote folder
        const filteredFiles = conn.files.filter(f => f.name !== fileNode.name);
        
        return {
          ...conn,
          files: [
            ...filteredFiles,
            {
              name: fileNode.name,
              type: "file",
              size: `${Math.ceil((fileNode.content || "").length / 1024 * 10) / 10} KB`,
              content: fileNode.content || ""
            }
          ]
        };
      }
      return conn;
    });

    setConnections(updatedConnections);
    localStorage.setItem("claw_network_connections", JSON.stringify(updatedConnections));

    // Update active connection state too to re-render changes
    const updatedActive = updatedConnections.find(c => c.id === activeLocation.id);
    if (updatedActive) {
      setActiveLocation(updatedActive);
    }

    alert(`¡Archivo '${fileNode.name}' subido con éxito vía ${activeLocation.type} al servidor remoto!`);
  };

  const nodeChildren = currentDirectoryNode?.children ? Object.values(currentDirectoryNode.children) : [];

  return (
    <div className="flex-1 flex bg-slate-900 border-t border-slate-800 h-full overflow-hidden" id="file-manager-wrapper">
      
      {/* SIDEBAR: Local locations and Network connections (SMB / FTP / SFTP) */}
      <div className="w-56 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col p-3 select-none text-xs text-slate-400 space-y-4" id="file-manager-sidebar">
        
        {/* Local Storage Section */}
        <div className="space-y-1.5 animate-fade-in">
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block px-1">Almacenamiento Local</span>
          <button
            onClick={handleSelectLocal}
            className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-left tracking-wide transition ${
              activeLocation === "local" 
                ? "bg-slate-900 text-slate-100 border border-slate-800 shadow shadow-emerald-500/10 font-bold" 
                : "hover:bg-slate-900/50 hover:text-slate-200 border border-transparent"
            }`}
          >
            <HardDrive size={14} className={activeLocation === "local" ? "text-emerald-400" : "text-slate-500"} />
            <div className="truncate flex-1">
              <p className="font-medium text-slate-200">System Root (vfs)</p>
              <p className="text-[9px] text-slate-500">Disco local virtual</p>
            </div>
          </button>
        </div>

        {/* Remote Connections Section (SMB, FTP, SFTP) */}
        <div className="space-y-1.5 flex-1 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">Conexiones de Red</span>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-emerald-400 hover:text-emerald-300 transition flex items-center space-x-1"
              title="Añadir nueva conexión remota (SMB, FTP, SFTP)"
              id="sidebar-add-conn"
            >
              <PlusCircle size={14} />
            </button>
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto pr-1">
            {connections.length === 0 ? (
              <p className="text-[10px] text-slate-600 px-2 italic text-left">No hay conexiones guardadas. Haz clic en el icono superior para añadir una.</p>
            ) : (
              connections.map((conn) => {
                const isSelected = activeLocation !== "local" && activeLocation.id === conn.id;
                
                return (
                  <div
                    key={conn.id}
                    onClick={() => handleTriggerConnection(conn)}
                    className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition border cursor-pointer ${
                      isSelected 
                        ? "bg-slate-900 text-slate-100 border-slate-800 shadow" 
                        : "hover:bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-200"
                    }`}
                    title={`${conn.type} en ${conn.host}`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {conn.type === "SMB" ? (
                        <Cloud size={13} className={isSelected ? "text-amber-400" : "text-amber-500/70"} />
                      ) : conn.type === "FTP" ? (
                        <Globe size={13} className={isSelected ? "text-cyan-400" : "text-cyan-500/70"} />
                      ) : (
                        <ShieldCheck size={13} className={isSelected ? "text-violet-400" : "text-violet-500/70"} />
                      )}
                      
                      <div className="truncate flex-1">
                        <p className={`font-medium ${isSelected ? "text-slate-100 font-bold" : "text-slate-300"}`}>{conn.name}</p>
                        <p className="text-[8px] text-slate-500 font-mono truncate">{conn.type.toLowerCase()}://{conn.host}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteConnection(conn.id, e)}
                      className="p-1 hover:text-red-400 opacity-0 group-hover:opacity-100 transition rounded hover:bg-slate-950 shrink-0 ml-1"
                      title="Quitar conexión"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Informative connection tips */}
        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-900 text-[10px] leading-relaxed text-slate-500 space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
            <Info size={11} className="text-emerald-500" />
            <span>Integración Remota:</span>
          </div>
          <p className="text-left">Puedes explorar servidores de red, descargar archivos compartidos a tu máquina local instantáneamente, o cargar reportes desde tu carpeta virtual.</p>
        </div>
      </div>

      {/* MAIN VIEWPORT CARD */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        
        {/* VIEW 1: Handshake socket simulation loader */}
        {isConnecting && (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6 select-none font-mono">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal size={14} className="text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Protocol Handshake: SSH / NFS</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">{connectProgress}%</span>
              </div>
              
              {/* Spinning progress loader bar */}
              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-150 rounded-full"
                  style={{ width: `${connectProgress}%` }}
                />
              </div>

              {/* Terminal Logs Viewport */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-950 text-[10px] text-slate-400/90 leading-relaxed space-y-1.5 h-36 overflow-y-auto select-text text-left">
                {connectionLogs.map((log, lIdx) => (
                  <p key={lIdx} className={
                    log && (log.includes("OK") || log.includes("¡Éxito!") || log.includes("correcta") || log.includes("exitoso"))
                      ? "text-emerald-400 font-semibold" 
                      : log && (log.includes("USER") || log.includes("PASS") || log.includes("CWD"))
                      ? "text-cyan-400"
                      : "text-slate-400"
                  }>
                    {log}
                  </p>
                ))}
              </div>
              
              <p className="text-center text-[9px] text-slate-500 italic">Negociando sockets virtuales de CMineWar OS en tiempo síncrono...</p>
            </div>
          </div>
        )}

        {/* VIEW 2: Stored Connections Config Modal Panel */}
        {showAddForm && !isConnecting && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Network size={16} className="text-emerald-400" />
                  <h3 className="font-bold text-slate-100 text-sm">Añadir Servidor de Red</h3>
                </div>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  className="p-1 text-slate-500 hover:text-slate-300 transition"
                  type="button"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleAddConnection} className="space-y-4 text-xs text-left">
                {/* Protocol Selector Switch */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1.5 uppercase tracking-wider text-[9px]">Protocolo de Conexión:</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    {(["SMB", "FTP", "SFTP"] as const).map((pType) => (
                      <button
                        type="button"
                        key={pType}
                        onClick={() => setNewType(pType)}
                        className={`py-1.5 px-3 rounded text-center font-bold tracking-wide transition ${
                          newType === pType 
                            ? "bg-slate-950 text-emerald-400 border border-slate-800 shadow shadow-emerald-500/10" 
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {pType}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Nombre Descriptivo:</label>
                    <input 
                      type="text" 
                      placeholder="ej. Servidor NAS Residencial" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-slate-500 font-semibold mb-1">Host o Dirección de Red:</label>
                      <input 
                        type="text" 
                        placeholder="ej. 192.168.1.15" 
                        value={newHost} 
                        onChange={(e) => setNewHost(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Puerto:</label>
                      <input 
                        type="text" 
                        placeholder={newType === "SMB" ? "445" : newType === "FTP" ? "21" : "22"} 
                        value={newPort} 
                        onChange={(e) => setNewPort(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Usuario (Login):</label>
                      <input 
                        type="text" 
                        placeholder="ej. root" 
                        value={newUsername} 
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Contraseña:</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-300 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Recurso Compartido / Ruta:</label>
                    <input 
                      type="text" 
                      placeholder="ej. /compartido" 
                      value={newPath} 
                      onChange={(e) => setNewPath(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-1 p-2 bg-slate-900/50 rounded border border-slate-900 text-[10px] text-slate-500">
                  <ShieldAlert size={12} className="text-amber-400 shrink-0" />
                  <span>Se realiza una negociación encriptada síncrona segura.</span>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 rounded font-semibold text-slate-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded font-semibold"
                  >
                    Guardar y Conectar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 3: Standard Local File System Explorer Viewport */}
        {!isConnecting && !showAddForm && activeLocation === "local" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Control bar / Breadcrumbs */}
            <div className="flex items-center justify-between p-3 bg-slate-950 border-b border-slate-800 select-none">
              {/* Navigation actions */}
              <div className="flex items-center space-x-2 min-w-0">
                <button
                  onClick={handleGoBack}
                  disabled={currentPath.length === 0}
                  className="p-1.5 rounded-md hover:bg-slate-800 bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Volver"
                >
                  <ArrowLeft size={15} />
                </button>

                {/* Breadcrumbs */}
                <div className="flex items-center space-x-1 text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded truncate">
                  <button
                    onClick={() => {
                      setCurrentPath([]);
                      setSelectedItemName(null);
                    }}
                    className="hover:text-emerald-400 transition"
                  >
                    root
                  </button>
                  {currentPath.map((folder, index) => (
                    <React.Fragment key={index}>
                      <ChevronRight size={12} className="text-slate-600 shrink-0" />
                      <button
                        onClick={() => handleBreadcrumbClick(index)}
                        className="hover:text-emerald-400 font-medium transition truncate max-w-[80px]"
                        id={`breadcrumb-${index}-${folder}`}
                      >
                        {folder}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Action controls */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleCreateFile}
                  className="flex items-center space-x-1.5 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs rounded transition"
                  id="btn-new-file"
                >
                  <Plus size={13} className="text-emerald-400" />
                  <span>+ Archivo</span>
                </button>
                <button
                  onClick={handleCreateDirectory}
                  className="flex items-center space-x-1.5 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs rounded transition"
                  id="btn-new-folder"
                >
                  <FolderPlus size={13} className="text-cyan-400" />
                  <span>+ Carpeta</span>
                </button>
              </div>
            </div>

            {/* Grid view of nodes */}
            <div className="flex-1 p-4 overflow-y-auto" id="file-manager-grid">
              {nodeChildren.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12 select-none">
                  <Folder size={48} className="text-slate-700 mb-2 stroke-[1.5]" />
                  <p className="text-sm">Directorio vacío</p>
                  <p className="text-xs text-slate-600 mt-1">Crea un archivo o carpeta arriba.</p>
                </div>
              ) : (
                <div className={`grid gap-3 ${
                  touchMode 
                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" 
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                }`}>
                  {nodeChildren.map((child) => {
                    const isSelected = selectedItemName === child.name;
                    
                    return (
                      <div
                        key={child.name}
                        onClick={() => {
                          setSelectedItemName(child.name);
                          // For touchscreens, immediately execute action on single click to prevent accessibility barriers
                          if (touchMode) {
                            handleLocalItemClick(child);
                          }
                        }}
                        onDoubleClick={() => {
                          if (!touchMode) {
                            handleLocalItemClick(child);
                          }
                        }}
                        className={`flex flex-col items-center rounded-lg border text-center transition cursor-pointer relative group ${
                          isSelected
                            ? "bg-emerald-950/40 border-emerald-500/50 text-slate-100"
                            : "bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300"
                        } ${
                          touchMode ? "p-4.5 scale-102 shadow-md shadow-emerald-950/5" : "p-3"
                        }`}
                        id={`file-node-${child.name}`}
                      >
                        {/* File/Folder Icon */}
                        {child.type === "dir" ? (
                          <Folder className={`${touchMode ? "w-11 h-11" : "w-10 h-10"} text-cyan-400 mb-2 fill-cyan-400/10 shrink-0`} />
                        ) : child.name.endsWith(".sh") ? (
                          <FileCode2 className={`${touchMode ? "w-11 h-11" : "w-10 h-10"} text-amber-400 mb-2 shrink-0`} />
                        ) : (
                          <File className={`${touchMode ? "w-11 h-11" : "w-10 h-10"} text-slate-400 mb-2 shrink-0`} />
                        )}

                        {/* Node Name */}
                        <span className={`font-medium break-all truncate w-full px-1 ${touchMode ? "text-xs" : "text-xs"}`}>
                          {child.name}
                        </span>

                        {/* Actions (Delete icon) */}
                        <button
                          onClick={(e) => handleDeleteItem(child.name, e)}
                          className={`absolute top-1 right-1 p-1 bg-slate-950 border border-slate-800 rounded opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-950/60 transition ${
                            touchMode ? "opacity-100 scale-110 !p-1.5" : ""
                          }`}
                          title="Eliminar de inmediato"
                          id={`btn-delete-node-${child.name}`}
                        >
                          <Trash2 size={touchMode ? 13 : 11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selector info bar */}
            <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between select-none shrink-0">
              <span className="font-mono text-slate-600">
                Ubicación Local: / {currentPath.join("/")}
              </span>
              {selectedItemName && (
                <span className="text-emerald-400 font-mono">
                  Seleccionado: {selectedItemName} (Doble clic para abrir)
                </span>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: Remote Connected files view (SMB/FTP/SFTP protocol mode) */}
        {!isConnecting && !showAddForm && activeLocation !== "local" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden animate-fade-in text-xs">
            {/* Header Connection Bar */}
            <div className={`p-3 border-b flex items-center justify-between select-none text-left shrink-0 ${
              activeLocation.type === "SMB" 
                ? "bg-amber-950/20 border-amber-900/30" 
                : activeLocation.type === "FTP" 
                ? "bg-cyan-950/20 border-cyan-900/30" 
                : "bg-violet-950/20 border-violet-900/30"
            }`}>
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                  activeLocation.type === "SMB" 
                    ? "bg-amber-900/10 border-amber-700/30 text-amber-400" 
                    : activeLocation.type === "FTP" 
                    ? "bg-cyan-900/10 border-cyan-700/30 text-cyan-400" 
                    : "bg-violet-900/10 border-violet-700/30 text-violet-400"
                }`}>
                  <Server size={14} />
                </div>
                <div>
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="font-bold text-slate-100">{activeLocation.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 font-semibold uppercase">{activeLocation.type} v2</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Conectado a {activeLocation.username}@{activeLocation.host}:{activeLocation.port}{activeLocation.path}</p>
                </div>
              </div>

              {/* Action buttons (Upload, Unlink) */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleUploadLocalFileToRemote}
                  className="flex items-center space-x-1 py-1 px-2.5 bg-slate-905 hover:bg-slate-800 border border-slate-800 rounded font-semibold text-xs text-slate-300 transition"
                  title="Subir un archivo desde tu directorio local"
                >
                  <Upload size={12} className="text-emerald-400 animate-pulse" />
                  <span>Subir archivo</span>
                </button>
                <button
                  onClick={handleSelectLocal}
                  className="flex items-center space-x-1 py-1 px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 rounded transition font-semibold text-xs"
                  title="Desconectar del recurso"
                >
                  <Unlink size={12} />
                  <span>Desconectar</span>
                </button>
              </div>
            </div>

            {/* Remote File Grid list view */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-950/30">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeLocation.files.map((fileObj) => {
                  const isSelected = selectedRemoteFile?.name === fileObj.name;
                  
                  return (
                    <div
                      key={fileObj.name}
                      onClick={() => {
                        setSelectedRemoteFile(fileObj);
                        // Open instantly on touch mode
                        if (touchMode) {
                          handleDownloadRemoteFile(fileObj);
                        }
                      }}
                      onDoubleClick={() => {
                        if (!touchMode) {
                          handleDownloadRemoteFile(fileObj);
                        }
                      }}
                      className={`flex flex-col items-center rounded-lg border text-center transition cursor-pointer relative group ${
                        isSelected
                          ? activeLocation.type === "SMB"
                            ? "bg-amber-950/30 border-amber-600/50 text-slate-100 shadow"
                            : activeLocation.type === "FTP"
                            ? "bg-cyan-950/30 border-cyan-600/50 text-slate-100 shadow"
                            : "bg-violet-950/30 border-violet-600/50 text-slate-100 shadow"
                          : "bg-slate-950/40 border-slate-900/60 hover:bg-slate-900/50 text-slate-300"
                      } ${
                        touchMode ? "p-4.5 scale-102 shadow-md" : "p-3"
                      }`}
                    >
                      {/* Connection specific design */}
                      <div className="relative mb-2 shrink-0">
                        {fileObj.type === "dir" ? (
                          <Folder className={`${touchMode ? "w-11 h-11" : "w-10 h-10"} text-cyan-400 fill-cyan-400/10`} />
                        ) : (
                          <File className={`${touchMode ? "w-11 h-11" : "w-10 h-10"} text-slate-400`} />
                        )}
                        <span className="absolute bottom-0 right-0 px-1 py-0.5 bg-slate-950 text-[7px] font-mono text-slate-500 rounded border border-slate-800">
                          {fileObj.type === "dir" ? "dir" : fileObj.name.split(".").pop() || "txt"}
                        </span>
                      </div>

                      <span className="text-xs font-medium break-all truncate w-full px-1">{fileObj.name}</span>
                      <span className="text-[9px] text-slate-500 mt-1 font-mono">{fileObj.size}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selector and remote actions dock */}
            <div className="px-3 py-2.5 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-slate-500 shrink-0 select-none text-left">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] font-mono hover:text-slate-300 cursor-pointer" onClick={() => handleTriggerConnection(activeLocation)}>
                  Enlace de bus de red óptico estable (Velocidad: 1.2 Gbps) • F5 para actualizar
                </span>
              </div>

              {selectedRemoteFile ? (
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[200px] font-mono">
                    Seleccionado: {selectedRemoteFile.name} ({selectedRemoteFile.size})
                  </span>
                  <button
                    onClick={() => handleDownloadRemoteFile(selectedRemoteFile)}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] rounded font-bold transition shrink-0"
                    title="Transferir copia de este archivo de red a tu directorio local activo"
                  >
                    <Download size={11} />
                    <span>Descargar a Local (vfs)</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenFileInEditor([...currentPath], `[REMOTO] ${selectedRemoteFile.name}`, selectedRemoteFile.content);
                      openWindow("text_editor");
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] rounded font-bold transition shrink-0"
                    title="Ver contenido remoto del archivo como lectura rápida"
                  >
                    <FileCode2 size={11} />
                    <span>Ver</span>
                  </button>
                </div>
              ) : (
                <span className="text-[9px] text-slate-600 italic">Haz clic en un archivo remoto para descargarlo u observar sus propiedades.</span>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
