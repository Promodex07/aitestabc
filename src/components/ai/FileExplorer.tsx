import type { CodeFile } from "@/types/code";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, FileCode2 } from "lucide-react";

interface FileExplorerProps {
  files: CodeFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onDownloadAll: () => void;
}

function groupByDir(files: CodeFile[]) {
  const map: Record<string, string[]> = {};
  for (const f of files) {
    const parts = f.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "/";
    if (!map[dir]) map[dir] = [];
    map[dir].push(f.path);
  }
  return map;
}

export function FileExplorer({ files, activePath, onSelect, onDownloadAll }: FileExplorerProps) {
  const grouped = groupByDir(files);
  const dirs = Object.keys(grouped).sort();

  return (
    <div className="h-full flex flex-col border rounded-lg surface-card">
      <div className="flex items-center justify-between p-3">
        <h3 className="text-sm font-medium">Files</h3>
        <Button size="sm" variant="soft" onClick={onDownloadAll}>
          <Download className="mr-2" /> Download ZIP
        </Button>
      </div>
      <Separator />
      <div className="flex-1 overflow-auto p-2 space-y-3">
        {dirs.length === 0 && (
          <p className="text-sm text-muted-foreground px-2">No files yet. Generate code to see files here.</p>
        )}
        {dirs.map((dir) => (
          <div key={dir}>
            <p className="text-xs text-muted-foreground px-2 mb-1">{dir}</p>
            <ul className="space-y-1">
              {grouped[dir].map((p) => (
                <li key={p}>
                  <button
                    onClick={() => onSelect(p)}
                    className={`w-full text-left px-2 py-1 rounded-md transition ${
                      activePath === p ? "bg-accent text-accent-foreground" : "hover:bg-muted/60"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-sm">
                      <FileCode2 className="h-4 w-4" />
                      {p}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
