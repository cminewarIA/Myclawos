export interface VFSNode {
  name: string;
  type: "file" | "dir";
  content?: string;
  children?: { [key: string]: VFSNode };
}

export interface WindowState {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface TerminalLine {
  id: string;
  text: string;
  type: "input" | "output" | "error" | "info" | "success";
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  timestamp: Date;
}

// Proyecto propiedad de Yonah Llanes

