import React, { useState, useEffect } from "react";
import { VFSNode } from "../types";
import { setNodeAtPath } from "../vfs";
import { Save, FileText, CheckCircle } from "lucide-react";

interface TextEditorProps {
  vfs: VFSNode;
  setVfs: (newVfs: VFSNode) => void;
  openFilePath: string[] | null;
  openFileName: string | null;
  openFileContent: string | null;
  setOpenFile: (path: string[] | null, name: string | null, content: string | null) => void;
}

export default function TextEditor({
  vfs,
  setVfs,
  openFilePath,
  openFileName,
  openFileContent,
  setOpenFile,
}: TextEditorProps) {
  const [editorText, setEditorText] = useState("");
  const [fileNameInput, setFileNameInput] = useState("");
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Sync with state updates
  useEffect(() => {
    setEditorText(openFileContent || "");
    setFileNameInput(openFileName || "nuevo_documento.txt");
  }, [openFileName, openFileContent]);

  // Handle saving
  const handleSave = () => {
    if (!fileNameInput.trim()) {
      alert("Por favor ingrese un nombre de archivo válido.");
      return;
    }

    const targetPath = openFilePath || ["home", "user"];
    const fileId = fileNameInput.trim();

    const updatedNode: VFSNode = {
      name: fileId,
      type: "file",
      content: editorText,
    };

    const updatedVfs = setNodeAtPath(vfs, targetPath, fileId, updatedNode);
    setVfs(updatedVfs);
    
    // Update local loaded details
    setOpenFile(targetPath, fileId, editorText);

    // Dynamic UI feedback toast
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-200">
      {/* Tool header */}
      <div className="flex items-center justify-between p-2.5 bg-slate-950 border-b border-claw-border border-slate-800 select-none shrink-0 text-xs">
        <div className="flex items-center space-x-2">
          <FileText size={14} className="text-emerald-400" />
          <input
            type="text"
            value={fileNameInput}
            onChange={(e) => setFileNameInput(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-100 px-2 py-1 rounded w-48 text-xs font-mono outline-none focus:border-emerald-500/50"
            placeholder="documento.txt"
            id="editor-filename"
          />
          <span className="text-slate-600 font-mono hidden sm:inline">
            Directorio: /{openFilePath ? openFilePath.join("/") : "home/user"}
          </span>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded text-xs transition"
          id="btn-save-editor"
        >
          <Save size={13} />
          <span>Guardar</span>
        </button>
      </div>

      {/* Editor workarea */}
      <div className="flex-1 relative p-1 bg-slate-950 flex flex-col">
        <textarea
          value={editorText}
          onChange={(e) => setEditorText(e.target.value)}
          className="flex-1 bg-slate-950 text-slate-200 font-mono text-xs p-4 outline-none resize-none leading-relaxed border-none focus:ring-0"
          placeholder="# Escribe aquí tus notas..."
          id="editor-textarea"
        />

        {/* Temporary Save Toast */}
        {showSavedToast && (
          <div className="absolute top-4 right-4 bg-emerald-900/90 border border-emerald-500/30 text-emerald-200 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-2 animate-fade-in shadow-xl select-none">
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            <span>Archivo guardado con éxito</span>
          </div>
        )}
      </div>

      {/* Editor metadata stats */}
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between select-none">
        <span>Líneas: {editorText.split("\n").length}</span>
        <span>Caracteres: {editorText.length}</span>
      </div>
    </div>
  );
}
