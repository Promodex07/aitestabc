import { useEffect, useMemo, useState } from "react";
import type { CodeFile } from "@/types/code";

interface PreviewPaneProps {
  files: CodeFile[];
}

function buildSrcDoc(files: CodeFile[]) {
  const htmlFile = files.find((f) => /index\.html$/i.test(f.path));
  const css = files.filter((f) => f.path.endsWith(".css")).map((f) => f.content).join("\n\n");
  const js = files.filter((f) => f.path.endsWith(".js")).map((f) => f.content).join("\n\n");
  const html = htmlFile?.content ?? `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>${css}</style></head><body><div id="app"></div><script>${js}<\/script></body></html>`;
  return html;
}

export function PreviewPane({ files }: PreviewPaneProps) {
  const [srcDoc, setSrcDoc] = useState<string>("<html><body><p style='font-family: ui-sans-serif, system-ui'>No preview yet</p></body></html>");

  const doc = useMemo(() => buildSrcDoc(files), [files]);

  useEffect(() => {
    setSrcDoc(doc);
  }, [doc]);

  return (
    <div className="h-full border rounded-lg overflow-hidden surface-card">
      <iframe
        title="App Preview"
        className="w-full h-full"
        sandbox="allow-scripts allow-forms allow-same-origin"
        srcDoc={srcDoc}
      />
    </div>
  );
}
