// Supabase Edge Function: ai-code
// Handles: generate, explain, edit, clone
// Requires secret: OPENAI_API_KEY

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CodeFile { path: string; language: string; content: string }

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body as { action: string };

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const system = `You are DevForge, an AI code generator. Always answer STRICTLY in JSON matching this TypeScript type:\ninterface CodeFile { path: string; language: string; content: string }\ninterface Response { files: CodeFile[]; summary?: string }\nRules:\n- Always include language for each file (javascript, typescript, html, css, python, markdown, json).\n- Prefer simple, runnable projects.\n- For small apps, include index.html, styles.css, and main.js at minimum.\n- Keep explanations brief in 'summary'.`;

    async function callOpenAI(messages: Array<{ role: string; content: string }>) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-2025-04-14",
          temperature: 0.2,
          messages,
          response_format: { type: "json_object" },
        }),
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "{}";
      return JSON.parse(content);
    }

    if (action === "generate") {
      const { prompt } = body as { prompt: string };
      const user = `Build the following as a small runnable app. Include minimal files.\nTask: ${prompt}`;
      const out = await callOpenAI([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "explain") {
      const { code } = body as { code: string };
      const user = `Explain this code in plain language and include it as a markdown file explanation.md with a short summary. Provide the original code as code.txt too.\n\nCODE:\n${code}`;
      const out = await callOpenAI([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "edit") {
      const { code, instruction } = body as { code: string; instruction: string };
      const user = `Apply the following edits to the code and return the full modified file(s). If multiple files are implied, split logically.\nInstruction: ${instruction}\n\nCODE:\n${code}`;
      const out = await callOpenAI([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "clone") {
      const { url } = body as { url: string };
      const res = await fetch(url);
      const html = await res.text();

      // naive CSS discovery
      const cssLinks = Array.from(html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)).map((m) => m[1]);
      const base = new URL(url);
      const cssContents: string[] = [];
      for (const href of cssLinks) {
        try {
          const u = new URL(href, base);
          const r = await fetch(u);
          cssContents.push(await r.text());
        } catch (_) { /* ignore */ }
      }

      const user = `You are given the raw HTML and extracted CSS of a website. Reconstruct a clean, minimal, functional clone with these files: index.html, styles.css, main.js. Keep semantics, typography, and key layout. Replace external assets with placeholders if necessary.\nHTML:\n${html}\n\nCSS:\n${cssContents.join("\n\n")}\n`;

      const out = await callOpenAI([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) } ), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
