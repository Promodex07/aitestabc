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

    // Sử dụng Gemini API Key
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Hàm gọi Gemini
    async function callGemini(messages: Array<{ role: string; content: string }>) {
      // Chuyển đổi messages sang format của Gemini
      const history = messages.map((m) => ({
        role: m.role === "system" ? "user" : m.role, // Gemini không có "system", gộp vào "user"
        parts: [{ text: m.content }]
      }));

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: history,
          generationConfig: {
            temperature: 0.2,
            response_mime_type: "application/json"
          }
        }),
      });
      const data = await res.json();
      // Lấy kết quả JSON từ Gemini
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      return JSON.parse(content);
    }

    if (action === "generate") {
      const { prompt } = body as { prompt: string };
      const user = `Build the following as a small runnable app. Include minimal files.\nTask: ${prompt}`;
      const out = await callGemini([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "explain") {
      const { code } = body as { code: string };
      const user = `Explain this code in plain language and include it as a markdown file explanation.md with a short summary. Provide the original code as code.txt too.\n\nCODE:\n${code}`;
      const out = await callGemini([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "edit") {
      const { code, instruction } = body as { code: string; instruction: string };
      const user = `Apply the following edits to the code and return the full modified file(s). If multiple files are implied, split logically.\nInstruction: ${instruction}\n\nCODE:\n${code}`;
      const out = await callGemini([
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

      const out = await callGemini([
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
