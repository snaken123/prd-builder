import express from "express";
import archiver from "archiver";
import type { PRDFormData } from "./types.js";
import { buildPRD, buildClaudeCodePrompt } from "./generate.js";
import { insertSubmission, listSubmissions, getSubmission } from "./db.js";
import { createSessionCookie, clearSessionCookie, isValidSession, checkPassword } from "./auth.js";

function slugify(s: string): string {
  const slug = s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "app";
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!isValidSession(req.headers.cookie)) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

const app = express();
app.use(express.json());

app.post("/api/submissions", async (req, res) => {
  const data = req.body as PRDFormData;

  if (!data || typeof data.appName !== "string" || !data.appName.trim()) {
    res.status(400).json({ error: "appName is required" });
    return;
  }

  try {
    const id = await insertSubmission(data);
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to save submission" });
    console.error(err);
  }
});

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body ?? {};
  if (typeof password !== "string" || !checkPassword(password)) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }
  res.setHeader("Set-Cookie", createSessionCookie());
  res.json({ ok: true });
});

app.post("/api/admin/logout", (_req, res) => {
  res.setHeader("Set-Cookie", clearSessionCookie());
  res.json({ ok: true });
});

app.get("/api/admin/session", (req, res) => {
  res.json({ authenticated: isValidSession(req.headers.cookie) });
});

app.get("/api/submissions", requireAdmin, async (_req, res) => {
  try {
    const rows = await listSubmissions();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load submissions" });
    console.error(err);
  }
});

app.get("/api/submissions/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const row = await getSubmission(id);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to load submission" });
    console.error(err);
  }
});

app.get("/api/submissions/:id/download", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  let row;
  try {
    row = await getSubmission(id);
  } catch (err) {
    res.status(500).json({ error: "Failed to load submission" });
    console.error(err);
    return;
  }
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const prd = buildPRD(row);
  const prompt = buildClaudeCodePrompt(row);
  const slug = slugify(row.appName);

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
