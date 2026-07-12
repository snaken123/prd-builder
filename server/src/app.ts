import express from "express";
import cors from "cors";
import archiver from "archiver";
import type { PRDFormData } from "./types.js";
import { buildPRD, buildClaudeCodePrompt } from "./generate.js";

function slugify(s: string): string {
  const slug = s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "app";
}

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/generate", (req, res) => {
  const data = req.body as PRDFormData;

  if (!data || typeof data.appName !== "string" || !data.appName.trim()) {
    res.status(400).json({ error: "appName is required" });
    return;
  }

  const prd = buildPRD(data);
  const prompt = buildClaudeCodePrompt(data);
  const slug = slugify(data.appName);

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${slug}-prd.zip"`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    res.status(500).end(String(err));
  });
  archive.pipe(res);
  archive.append(prd, { name: "PRD.md" });
  archive.append(prompt, { name: "claude-code-prompt.md" });
  archive.finalize();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

export default app;
