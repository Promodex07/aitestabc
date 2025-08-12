import { useMemo } from "react";
import Editor from "@monaco-editor/react";
import type { CodeFile } from "@/types/code";

interface CodeEditorProps {
  file: CodeFile | null;
  onChange: (updated: CodeFile) => void;
}

const extToLanguage: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  tsx: "typescript",
  jsx: "javascript",
  json: "json",
  css: "css",
  html: "html",
  md: "markdown",
  py: "python",
  sh: "shell",
};

export function CodeEditor({ file, onChange }: CodeEditorProps) {
  const language = useMemo(() => {
    if (!file) return "plaintext";
    if (file.language) return file.language;
    const ext = file.path.split(".").pop() || "";
    return extToLanguage[ext] || "plaintext";
  }, [file]);

  return (
    <div className="h-full border rounded-lg overflow-hidden surface-card">
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        value={file?.content ?? ""}
        options={{
          minimap: { enabled: false },
          fontLigatures: true,
          fontSize: 14,
          scrollBeyondLastLine: false,
          wordWrap: "on",
        }}
        onChange={(val) => {
          if (!file) return;
          onChange({ ...file, content: val ?? "" });
        }}
      />
    </div>
  );
}
