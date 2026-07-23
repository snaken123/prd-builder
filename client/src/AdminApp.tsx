import { useEffect, useState } from "react";
import type { ProcessData, SubmissionDetail, SubmissionSummary } from "./types";
import { ProcessForm } from "./ProcessForm";

type SessionState = "checking" | "loggedOut" | "loggedIn";
type PanelView = "detail" | "processing" | "prompt";

export function AdminApp() {
  const [session, setSession] = useState<SessionState>("checking");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [listError, setListError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [detailError, setDetailError] = useState("");

  const [panelView, setPanelView] = useState<PanelView>("detail");
  const [existingProcess, setExistingProcess] = useState<ProcessData | null>(null);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  function refreshSubmissions() {
    fetch("/api/submissions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load submissions");
        return res.json();
      })
      .then(setSubmissions)
      .catch((err) => setListError(err.message));
  }

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((body) => setSession(body.authenticated ? "loggedIn" : "loggedOut"))
      .catch(() => setSession("loggedOut"));
  }, []);

  useEffect(() => {
    if (session !== "loggedIn") return;
    refreshSubmissions();
  }, [session]);

  useEffect(() => {
    setPanelView("detail");
    setFinalPrompt("");
    if (selectedId === null) {
      setDetail(null);
      return;
    }
    setDetailError("");
    fetch(`/api/submissions/${selectedId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load submission");
        return res.json();
      })
      .then(setDetail)
      .catch((err) => setDetailError(err.message));
  }, [selectedId]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Login failed");
      }
      setSession("loggedIn");
      setPassword("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setSession("loggedOut");
    setSubmissions([]);
    setSelectedId(null);
  }

  async function startProcessing() {
    if (selectedId === null) return;
    setExistingProcess(null);
    try {
      const res = await fetch(`/api/submissions/${selectedId}/process`);
      if (res.ok) {
        const body = await res.json();
        setExistingProcess(body);
      }
    } catch {
      // no existing process data — start fresh
    }
    setPanelView("processing");
  }

  function handleProcessDone(prompt: string) {
    setFinalPrompt(prompt);
    setPanelView("prompt");
    refreshSubmissions();
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadPrompt() {
    if (!detail) return;
    const slug = detail.appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "app";
    const blob = new Blob([finalPrompt], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-claude-code-prompt.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (session === "checking") {
    return <div className="page" />;
  }

  if (session === "loggedOut") {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Admin Login</h1>
          <p>Sign in to view submitted PRD requests.</p>
        </header>
        <form className="prd-form" onSubmit={handleLogin}>
          <section className="form-section">
            <div className="field">
              <div className="field-label">
                <label>Password</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
          </section>
          <div className="submit-row">
            <button type="submit" disabled={loggingIn}>
              {loggingIn ? "Signing in..." : "Sign in"}
            </button>
            {loginError && <span className="error-msg">{loginError}</span>}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header admin-header">
        <div>
          <h1>Submissions</h1>
          <p>All PRD requests submitted by customers.</p>
        </div>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          Log out
        </button>
      </header>

      {listError && <p className="error-msg">{listError}</p>}

      <div className="admin-layout">
        <ul className="submission-list">
          {submissions.length === 0 && !listError && (
            <li className="submission-empty">No submissions yet.</li>
          )}
          {submissions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={s.id === selectedId ? "submission-item active" : "submission-item"}
                onClick={() => setSelectedId(s.id)}
              >
                <strong>
                  {s.appName}
                  {s.processed && <span className="processed-badge">Processed</span>}
                </strong>
                <span>{new Date(s.createdAt).toLocaleString()}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="submission-detail">
          {selectedId === null && <p className="submission-empty">Select a submission to view details.</p>}
          {detailError && <p className="error-msg">{detailError}</p>}

          {detail && panelView === "detail" && (
            <>
              <div className="detail-header">
                <h2>{detail.appName}</h2>
                <div className="detail-actions">
                  <button type="button" className="process-btn" onClick={startProcessing}>
                    Process
                  </button>
                  <a className="download-link" href={`/api/submissions/${detail.id}/download`}>
                    Download PRD zip
                  </a>
                </div>
              </div>
              <p className="detail-meta">
                Submitted {new Date(detail.createdAt).toLocaleString()}
              </p>

              <dl className="detail-list">
                <dt>Tagline</dt>
                <dd>{detail.tagline || "—"}</dd>
                <dt>Problem</dt>
                <dd>{detail.problem || "—"}</dd>
                <dt>Target audience</dt>
                <dd>{[...detail.audience, detail.audienceOther].filter(Boolean).join(", ") || "—"}</dd>
                <dt>Platform</dt>
                <dd>{detail.platform || "—"}</dd>
                <dt>Must-have features</dt>
                <dd>{detail.mustHave || "—"}</dd>
                <dt>Nice-to-have features</dt>
                <dd>{detail.niceToHave || "—"}</dd>
                <dt>Feature checklist</dt>
                <dd>{[...detail.features, detail.featuresOther].filter(Boolean).join(", ") || "—"}</dd>
                <dt>User roles</dt>
                <dd>
                  {detail.userRoles || "—"}
                  {detail.rolesDescription ? ` — ${detail.rolesDescription}` : ""}
                </dd>
                <dt>Notes</dt>
                <dd>{detail.notes || "—"}</dd>
              </dl>
            </>
          )}

          {detail && panelView === "processing" && (
            <>
              <div className="detail-header">
                <h2>Process: {detail.appName}</h2>
              </div>
              <p className="detail-meta">
                Answer these to generate a complete Claude Code prompt (Role, Goal, Context, Expectations).
              </p>
              <ProcessForm
                submissionId={detail.id}
                initial={existingProcess}
                onDone={handleProcessDone}
                onCancel={() => setPanelView("detail")}
              />
            </>
          )}

          {detail && panelView === "prompt" && (
            <>
              <div className="detail-header">
                <h2>Generated Prompt</h2>
                <div className="detail-actions">
                  <button type="button" className="process-btn" onClick={startProcessing}>
                    Edit answers
                  </button>
                  <button type="button" className="download-link prompt-btn" onClick={copyPrompt}>
                    {copied ? "Copied!" : "Copy prompt"}
                  </button>
                  <button type="button" className="download-link prompt-btn" onClick={downloadPrompt}>
                    Download .md
                  </button>
                </div>
              </div>
              <pre className="prompt-preview">{finalPrompt}</pre>
              <button type="button" className="logout-btn" onClick={() => setPanelView("detail")}>
                Back to details
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
