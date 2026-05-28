import React, { useState } from "react";
import { VFSNode } from "../types";
import { getNodeByPath, setNodeAtPath, deleteNodeAtPath } from "../vfs";
import { Folder, File, ArrowLeft, Plus, FolderPlus, Trash2, FileCode2, ChevronRight } from "lucide-react";

interface FileManagerProps {
  vfs: VFSNode;
  setVfs: (newVfs: VFSNode) => void;
  currentPath: string[];
  setCurrentPath: (path: string[]) => void;
  openWindow: (windowId: string) => void;
  onOpenFileInEditor: (filePath: string[], fileName: string, content: string) => void;
}

export default function FileManager({
  vfs,
  setVfs,
  currentPath,
  setCurrentPath,
  openWindow,
  onOpenFileInEditor,
}: FileManagerProps) {
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

  // Get current node details
  const currentDirectoryNode = getNodeByPath(vfs, currentPath);

  // Parent directory navigation
  const handleGoBack = () => {
    if (currentPath.length > 0) {
      const copy = [...currentPath];
      copy.pop();
      setCurrentPath(copy);
      setSelectedItemName(null);
    }
  };

  // Directory traversal
  const handleItemClick = (node: VFSNode) => {
    setSelectedItemName(node.name);
    
    // Auto double-click effect or open on action
    if (node.type === "dir") {
      setCurrentPath([...currentPath, node.name]);
      setSelectedItemName(null);
    } else {
      // It's a file, let's trigger Text Editor opening
      onOpenFileInEditor([...currentPath], node.name, node.content || "");
      openWindow("text_editor");
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const nextPath = currentPath.slice(0, index + 1);
    setCurrentPath(nextPath);
    setSelectedItemName(null);
  };

  // Add new file dialogue
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
      content: `Nuevo archivo creado el ${new Date().toLocaleDateString()} vía explorador gráfico.`,
    };

    const updatedVfs = setNodeAtPath(vfs, currentPath, filename, newFile);
    setVfs(updatedVfs);
  };

  // Add new directory dialogue
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

  // Remove selected item
  const handleDeleteItem = (itemName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Está seguro de que desea eliminar permanentemente '${itemName}'?`)) {
      return;
    }

    const updatedVfs = deleteNodeAtPath(vfs, currentPath, itemName);
    setVfs(updatedVfs);
    setSelectedItemName(null);
  };

  // Filter children to show
  const nodeChildren = currentDirectoryNode?.children ? Object.values(currentDirectoryNode.children) : [];

  return (
    <div className="flex-1 flex flex-col bg-slate-900 border-t border-slate-800">
      {/* Control bar / Breadcrumbs */}
      <div className="flex items-center justify-between p-3 bg-slate-950 border-b border-slate-800 select-none">
        {/* Navigation actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleGoBack}
            disabled={currentPath.length === 0}
            className="p-1.5 rounded-md hover:bg-slate-800 bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Volver"
          >
            <ArrowLeft size={15} />
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center space-x-1 text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded">
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
                <ChevronRight size={12} className="text-slate-600" />
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className="hover:text-emerald-400 font-medium transition"
                  id={`breadcrumb-${index}-${folder}`}
                >
                  {folder}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-2">
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
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
            <Folder size={48} className="text-slate-700 mb-2 stroke-[1.5]" />
            <p className="text-sm">Directorio vacío</p>
            <p className="text-xs text-slate-600 mt-1">Crea un archivo o carpeta arriba.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {nodeChildren.map((child) => {
              const isSelected = selectedItemName === child.name;
              
              return (
                <div
                  key={child.name}
                  onClick={() => setSelectedItemName(child.name)}
                  onDoubleClick={() => handleItemClick(child)}
                  className={`flex flex-col items-center p-3 rounded-lg border text-center transition cursor-pointer relative group ${
                    isSelected
                      ? "bg-emerald-950/40 border-emerald-500/50 text-slate-100"
                      : "bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300"
                  }`}
                  id={`file-node-${child.name}`}
                >
                  {/* File/Folder Icon */}
                  {child.type === "dir" ? (
                    <Folder className="w-10 h-10 text-cyan-400 mb-2 fill-cyan-400/10 shrink-0" />
                  ) : child.name.endsWith(".sh") ? (
                    <FileCode2 className="w-10 h-10 text-amber-400 mb-2 shrink-0" />
                  ) : (
                    <File className="w-10 h-10 text-slate-400 mb-2 shrink-0" />
                  )}

                  {/* Node Name */}
                  <span className="text-xs font-medium break-all truncate w-full px-1">
                    {child.name}
                  </span>

                  {/* Actions (Delete icon) */}
                  <button
                    onClick={(e) => handleDeleteItem(child.name, e)}
                    className="absolute top-1 right-1 p-1 bg-slate-950 border border-slate-800 rounded opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-950/60 transition"
                    title="Eliminar de inmediato"
                    id={`btn-delete-node-${child.name}`}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selector info bar */}
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between select-none">
        <span>Artículos: {nodeChildren.length}</span>
        {selectedItemName && (
          <span className="text-emerald-400 font-mono">
            Seleccionado: {selectedItemName} (Doble clic para interactuar)
          </span>
        )}
      </div>
    </div>
  );
}
