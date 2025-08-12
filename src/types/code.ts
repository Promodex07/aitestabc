export type CodeFile = {
  path: string;
  language: string;
  content: string;
};

export type AiAction = "generate" | "explain" | "edit" | "clone";

export interface AiResponse {
  files: CodeFile[];
  summary?: string;
  warnings?: string[];
}
