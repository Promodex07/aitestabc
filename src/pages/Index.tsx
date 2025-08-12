import { useEffect, useMemo, useState } from "react";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { FileExplorer } from "@/components/ai/FileExplorer";
import { CodeEditor } from "@/components/ai/CodeEditor";
import { PreviewPane } from "@/components/ai/PreviewPane";
import { downloadAsZip } from "@/utils/zip";
import type { CodeFile } from "@/types/code";
import { aiRequest } from "@/services/aiClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);

  useEffect(() => {
    if (files.length && !activePath) setActivePath(files[0].path);
  }, [files, activePath]);

  // Load and persist session files locally
  useEffect(() => {
    const saved = localStorage.getItem("devforge_files");
    if (saved) {
      try { setFiles(JSON.parse(saved)); } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("devforge_files", JSON.stringify(files));
  }, [files]);

  const activeFile = useMemo(() => files.find((f) => f.path === activePath) ?? null, [files, activePath]);

  function upsertFiles(newFiles: CodeFile[]) {
    setFiles((prev) => {
      const map = new Map(prev.map((f) => [f.path, f] as const));
      for (const nf of newFiles) map.set(nf.path, nf);
      return Array.from(map.values());
    });
  }

  async function onGenerate(prompt: string) {
    const data = await aiRequest({ action: "generate", prompt });
    upsertFiles(data.files);
  }
  async function onExplain(code: string) {
    const data = await aiRequest({ action: "explain", code });
    upsertFiles(data.files);
  }
  async function onEdit(code: string, instruction: string) {
    const data = await aiRequest({ action: "edit", code, instruction });
    upsertFiles(data.files);
  }
  async function onClone(url: string) {
    const data = await aiRequest({ action: "clone", url });
    upsertFiles(data.files);
  }

  function updateActiveFile(updated: CodeFile) {
    setFiles((prev) => prev.map((f) => (f.path === updated.path ? updated : f)));
  }

  return (
    <div className="min-h-screen py-6 container">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">DevForge AI</h1>
          <p className="text-sm text-muted-foreground">Blackbox-style prompt-to-code studio.</p>
        </div>
        <Button variant="hero" onClick={() => downloadAsZip(files)} disabled={!files.length}>Download ZIP</Button>
      </header>

      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-5 h-[70vh]">
          <ChatPanel onGenerate={onGenerate} onExplain={onExplain} onEdit={onEdit} onClone={onClone} />
        </div>
        <div className="md:col-span-7 h-[70vh] flex flex-col gap-4">
          <Tabs defaultValue="files" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-hidden">
              <TabsContent value="files" className="h-full">
                <FileExplorer files={files} activePath={activePath} onSelect={setActivePath} onDownloadAll={() => downloadAsZip(files)} />
              </TabsContent>
              <TabsContent value="editor" className="h-full">
                <CodeEditor file={activeFile} onChange={updateActiveFile} />
              </TabsContent>
              <TabsContent value="preview" className="h-full">
                <PreviewPane files={files} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* SEO semantic structure */}
      <section className="sr-only">
        <h2>AI coding assistant: generate code, explain, edit/debug, and clone websites</h2>
        <p>DevForge AI turns natural language into multi-file projects with export.</p>
        <link rel="canonical" href="/" />
      </section>
    </div>
  );
};

export default Index;
