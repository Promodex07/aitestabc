import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ChatPanelProps {
  onGenerate: (prompt: string) => Promise<void>;
  onExplain: (code: string) => Promise<void>;
  onEdit: (code: string, instruction: string) => Promise<void>;
  onClone: (url: string) => Promise<void>;
}

export function ChatPanel({ onGenerate, onExplain, onEdit, onClone }: ChatPanelProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [instruction, setInstruction] = useState("");
  const [url, setUrl] = useState("");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function handle<T extends (...args: any[]) => Promise<void>>(fn: T, key: string, ...args: Parameters<T>) {
    try {
      setLoadingKey(key);
      await fn(...args);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Action failed", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="h-full flex flex-col border rounded-lg surface-glass">
      <div className="p-4">
        <h1 className="text-2xl font-semibold">DevForge AI</h1>
        <p className="text-sm text-muted-foreground">Prompt-to-code, debugging, explanations, and site cloning.</p>
      </div>
      <Tabs defaultValue="generate" className="px-4 flex-1 flex flex-col">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="generate">Generate Code</TabsTrigger>
          <TabsTrigger value="explain">Explain Code</TabsTrigger>
          <TabsTrigger value="edit">Edit / Debug</TabsTrigger>
          <TabsTrigger value="clone">Clone Website</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="generate" className="space-y-3">
            <Label htmlFor="prompt">What should I build?</Label>
            <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={8} placeholder="Build a to-do list app with filters and local storage..." />
            <Button variant="hero" onClick={() => handle(onGenerate, "generate", prompt)} disabled={!prompt || loadingKey === "generate"}>
              {loadingKey === "generate" ? "Generating..." : "Generate Code"}
            </Button>
          </TabsContent>

          <TabsContent value="explain" className="space-y-3">
            <Label htmlFor="code-explain">Paste code to explain</Label>
            <Textarea id="code-explain" value={code} onChange={(e) => setCode(e.target.value)} rows={10} placeholder="// Paste code here" />
            <Button onClick={() => handle(onExplain, "explain", code)} disabled={!code || loadingKey === "explain"}> 
              {loadingKey === "explain" ? "Explaining..." : "Explain Code"}
            </Button>
          </TabsContent>

          <TabsContent value="edit" className="space-y-3">
            <Label htmlFor="code-edit">Paste code to edit/debug</Label>
            <Textarea id="code-edit" value={code} onChange={(e) => setCode(e.target.value)} rows={8} placeholder="// Paste code here" />
            <Label htmlFor="instruction">What should change?</Label>
            <Textarea id="instruction" value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={4} placeholder="Fix the bug where... Optimize by..." />
            <Button onClick={() => handle(onEdit, "edit", code, instruction)} disabled={!code || !instruction || loadingKey === "edit"}>
              {loadingKey === "edit" ? "Applying edits..." : "Apply Edits"}
            </Button>
          </TabsContent>

          <TabsContent value="clone" className="space-y-3">
            <Label htmlFor="url">Website URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://example.com" />
            <Button onClick={() => handle(onClone, "clone", url)} disabled={!url || loadingKey === "clone"}>
              {loadingKey === "clone" ? "Cloning..." : "Clone Website"}
            </Button>
          </TabsContent>
        </div>
      </Tabs>

      <div className="p-3 text-xs text-muted-foreground">
        Tip: You can refine outputs with follow-up prompts; we keep your session locally.
      </div>
    </div>
  );
}
