import { VFSNode } from "./types";

export const initialVFS: VFSNode = {
  name: "/",
  type: "dir",
  children: {
    home: {
      name: "home",
      type: "dir",
      children: {
        user: {
          name: "user",
          type: "dir",
          children: {
            "documento.txt": {
              name: "documento.txt",
              type: "file",
              content: "¡Bienvenido a ClawOS!\nEste es el sistema operativo Linux simulado con OpenClaw como núcleo central.\nAquí puedes crear archivos y carpetas, ejecutar comandos Bash o programar en bash elemental.",
            },
            "OpenClaw_manual.md": {
              name: "OpenClaw_manual.md",
              type: "file",
              content: `# Manual del Núcleo Inteligente OpenClaw

OpenClaw es el microkernel cognitivo de ClawOS.
Interactúa con él mediante la app interactiva 'OpenClaw Core' o el comando de shell:
$ openclaw "Hola OpenClaw"

CARACTERÍSTICAS:
- Núcleo Linux virtual compartido.
- Modificación directa del espacio de usuario.
- Enlace síncrono con el modelo Gemini-3.5-flash.`,
            },
            "leeme.txt": {
              name: "leeme.txt",
              type: "file",
              content: "Prueba a crear archivos usando:\ntouch archivo_nuevo.txt\no crea carpetas usando:\nmkdir nueva_carpeta\n\nTodo se sincronizará entre la terminal Bash y la interfaz gráfica.",
            },
            "proyectos": {
              name: "proyectos",
              type: "dir",
              children: {
                "script.sh": {
                  name: "script.sh",
                  type: "file",
                  content: "echo \"Iniciando diagnóstico del sistema...\"\necho \"Cargando kernel OpenClaw v1.1.0...\"\necho \"Todo está estable.\"",
                }
              }
            }
          }
        }
      }
    },
    var: {
      name: "var",
      type: "dir",
      children: {
        log: {
          name: "log",
          type: "dir",
          children: {
            "kernel.log": {
              name: "kernel.log",
              type: "file",
              content: "[0.000000] Linux version 5.16.0-openclaw-generic (gcc version 11.2.0)\n[0.101235] Quantum core initialized.\n[0.245891] ACPI: Core ACPI tables parsed successfully.\n[0.518293] ClawBus: PCI controllers initialized.\n[1.025381] OpenClaw Cognitive Module: ONLINE (Mode: Hot Standby).\n[1.240591] ClawOS desktop daemon successfully loaded.",
            }
          }
        }
      }
    },
    bin: {
      name: "bin",
      type: "dir",
      children: {
        "openclaw": {
          name: "openclaw",
          type: "file",
          content: "[Binary Executable - OpenClaw System Core Direct Command Link]",
        },
        "neofetch": {
          name: "neofetch",
          type: "file",
          content: "[Binary Executable - System Spec Renderer]",
        }
      }
    }
  }
};

// Traverse VFS following array path e.g. ["home", "user"]
export function getNodeByPath(vfs: VFSNode, pathArr: string[]): VFSNode | null {
  let current: VFSNode = vfs;
  for (const part of pathArr) {
    if (!part || part === ".") continue;
    if (part === "..") {
      // Note: Cannot easily climb back inside this direct resolve without parent pointers,
      // handled separately in path-string resolution.
      continue;
    }
    if (current.type !== "dir" || !current.children || !current.children[part]) {
      return null;
    }
    current = current.children[part];
  }
  return current;
}

// Convert a path string to path array based on current directory
export function parsePath(currentPath: string[], targetStr: string): string[] {
  let result = targetStr.startsWith("/") ? [] : [...currentPath];
  const parts = targetStr.split("/");
  
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (result.length > 0) result.pop();
    } else {
      result.push(part);
    }
  }
  return result;
}

// Helper to make an immutable deep copy of VFS with updates
export function setNodeAtPath(
  vfs: VFSNode,
  pathArr: string[],
  name: string,
  newNode: VFSNode
): VFSNode {
  const clone = JSON.parse(JSON.stringify(vfs)) as VFSNode;
  let current = clone;
  
  for (const part of pathArr) {
    if (!part) continue;
    if (!current.children || !current.children[part]) {
      // Fallback, create missing directories along the way
      current.children = current.children || {};
      current.children[part] = { name: part, type: "dir", children: {} };
    }
    current = current.children[part];
  }
  
  current.children = current.children || {};
  current.children[name] = newNode;
  return clone;
}

// Remove node from VFS
export function deleteNodeAtPath(vfs: VFSNode, pathArr: string[], name: string): VFSNode {
  const clone = JSON.parse(JSON.stringify(vfs)) as VFSNode;
  let current = clone;
  
  for (const part of pathArr) {
    if (!part) continue;
    if (!current.children || !current.children[part]) {
       return vfs; // Path not found, return original
    }
    current = current.children[part];
  }
  
  if (current.children && current.children[name]) {
    delete current.children[name];
  }
  return clone;
}
