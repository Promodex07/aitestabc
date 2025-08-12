import type { AiAction, AiResponse } from "@/types/code";

interface BasePayload {
  action: AiAction;
}

export async function aiRequest(payload: BasePayload & Record<string, unknown>) {
  const res = await fetch("/functions/v1/ai-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const data = (await res.json()) as AiResponse;
  return data;
}
