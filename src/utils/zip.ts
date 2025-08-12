import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { CodeFile } from "@/types/code";

export async function downloadAsZip(files: CodeFile[], name = "devforge") {
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.path, f.content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${name}.zip`);
}
