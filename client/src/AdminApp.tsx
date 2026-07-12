import { useEffect, useState } from "react";
import type { SubmissionDetail, SubmissionSummary } from "./types";

type SessionState = "checking" | "loggedOut" | "loggedIn";

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

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((body) => setSession(body.authenticated ? "loggedIn" : "loggedOut"))
      .catch(() => setSession("loggedOut"));
  }, []);

  useEffect(() => {
    if (session !== "loggedIn") return;
    fetch("/api/submissions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load submissions");
        return res.json();
      })
      .then(setSubmissions)
      .catch((err) => setListError(err.message));
  }, [session]);

  useEffect(() => {
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
                <strong>{s.appName}</strong>
                <span>{new Date(s.createdAt).toLocaleString()}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="submission-detail">
          {selectedId === null && <p className="submission-empty">Select a submission to view details.</p>}
          {detailError && <p className="error-msg">{detailError}</p>}
          {detail && (
            <>
              <div className="detail-header">
                <h2>{detail.appName}</h2>
                <a
                  className="download-link"
                  href={`/api/submissions/${detail.id}/download`}
                >
                  Download PRD zip
                </a>
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
        </div>
      </div>
    </div>
  );
}
