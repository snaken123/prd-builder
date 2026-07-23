import { useState } from "react";
import { Field } from "./components/Field";
import { CheckboxGroup } from "./components/CheckboxGroup";
import { RadioGroup } from "./components/RadioGroup";
import { initialProcessData, type ProcessData } from "./types";

const ROLE_OPTIONS = [
  { value: "senior", label: "Senior full-stack engineer building this from scratch" },
  { value: "contractor", label: "Contractor extending an existing codebase" },
  { value: "indie", label: "Solo indie hacker moving fast, okay with some rough edges" },
  { value: "other", label: "Other (describe below)" },
];

const GOAL_SCOPE_OPTIONS = [
  { value: "mvp", label: "Build a complete, working MVP end-to-end" },
  { value: "scaffold", label: "Scaffold the project structure only (no feature implementation yet)" },
  { value: "features", label: "Implement a specific set of features on an existing codebase" },
  { value: "infra", label: "Set up infrastructure / deployment only" },
];

const CONTEXT_OPTIONS = [
  "Starting from an empty repo",
  "Adding to an existing codebase",
  "Must integrate with an existing auth system",
  "Must follow existing code style/conventions",
  "Has design mockups or wireframes to follow",
];

const EXPECTATION_OPTIONS = [
  "Should include automated tests",
  "Should include error handling for edge cases",
  "Should include documentation/README",
  "Should be production-ready, not just a demo",
  "Keep it as simple as possible — no extra abstractions",
];

interface ProcessFormProps {
  submissionId: number;
  initial: ProcessData | null;
  onDone: (prompt: string) => void;
  onCancel: () => void;
}

export function ProcessForm({ submissionId, initial, onDone, onCancel }: ProcessFormProps) {
  const [form, setForm] = useState<ProcessData>(initial ?? initialProcessData);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  function set<K extends keyof ProcessData>(key: K, value: ProcessData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.goalScope) {
      setError("Please choose a goal scope.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch(`/api/submissions/${submissionId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }

      const promptRes = await fetch(`/api/submissions/${submissionId}/final-prompt`);
      if (!promptRes.ok) {
        const body = await promptRes.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${promptRes.status}`);
      }
      const { prompt } = await promptRes.json();
      onDone(prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <form className="prd-form" onSubmit={handleSubmit}>
      <section className="form-section">
        <h2>Role</h2>
        <Field
          label="What role should Claude Code adopt?"
          explanation="Frames how thorough and cautious the AI should be while building this."
          example="A 'contractor extending an existing codebase' will be more careful about existing conventions than a 'solo indie hacker moving fast'."
          required
        >
          <RadioGroup name="role" options={ROLE_OPTIONS} value={form.role} onChange={(v) => set("role", v)} />
          {form.role === "other" && (
            <input
              type="text"
              className="other-input"
              value={form.roleOther}
              onChange={(e) => set("roleOther", e.target.value)}
              placeholder="Describe the role"
            />
          )}
        </Field>
      </section>

      <section className="form-section">
        <h2>Goal</h2>
        <Field
          label="What's the scope of this session?"
          explanation="Sets the boundary for how much Claude Code should attempt in one go."
          example="Choose 'Scaffold only' if you just want the project structure set up before deciding on features."
          required
        >
          <RadioGroup
            name="goalScope"
            options={GOAL_SCOPE_OPTIONS}
            value={form.goalScope}
            onChange={(v) => set("goalScope", v)}
          />
        </Field>
        <Field
          label="Anything specific about the goal?"
          explanation="Narrow down the goal further if needed — e.g. a specific feature set, milestone, or deadline."
          example="Just get the checkout flow working end-to-end; the rest of the app can stay stubbed out."
        >
          <textarea
            value={form.goalDetails}
            onChange={(e) => set("goalDetails", e.target.value)}
            rows={3}
            placeholder="Optional details..."
          />
        </Field>
      </section>

      <section className="form-section">
        <h2>Context</h2>
        <Field
          label="What context should Claude Code know about?"
          explanation="Facts about the starting point that change how Claude Code should approach the work."
          example="If 'Adding to an existing codebase' is checked, Claude Code will look for existing patterns before writing new code."
        >
          <CheckboxGroup
            options={CONTEXT_OPTIONS}
            values={form.contextFlags}
            onChange={(v) => set("contextFlags", v)}
          />
          <textarea
            className="other-input"
            value={form.contextOther}
            onChange={(e) => set("contextOther", e.target.value)}
            rows={2}
            placeholder="Any other context (repo location, tech stack decisions, deployment target, etc.)"
          />
        </Field>
      </section>

      <section className="form-section">
        <h2>Expectations</h2>
        <Field
          label="What does a good result look like?"
          explanation="The quality bar and definition of done — this is what stops Claude Code from either over- or under-building."
          example="For a quick prototype, uncheck 'production-ready' and 'automated tests' to keep things fast."
        >
          <CheckboxGroup
            options={EXPECTATION_OPTIONS}
            values={form.expectationFlags}
            onChange={(v) => set("expectationFlags", v)}
          />
          <textarea
            className="other-input"
            value={form.expectationOther}
            onChange={(e) => set("expectationOther", e.target.value)}
            rows={2}
            placeholder="Any other expectations..."
          />
        </Field>
      </section>

      <div className="submit-row">
        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Generating..." : "Generate prompt"}
        </button>
        <button type="button" className="logout-btn" onClick={onCancel}>
          Cancel
        </button>
        {status === "error" && <span className="error-msg">{error}</span>}
      </div>
    </form>
  );
}
