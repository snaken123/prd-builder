import { useState } from "react";
import { Field } from "./components/Field";
import { CheckboxGroup } from "./components/CheckboxGroup";
import { RadioGroup } from "./components/RadioGroup";
import { initialFormData, type PRDFormData } from "./types";

const AUDIENCE_OPTIONS = [
  "Consumers / individuals",
  "Small businesses",
  "Enterprises",
  "Developers",
  "Students / educators",
  "Internal team / employees",
];

const PLATFORM_OPTIONS = [
  { value: "web", label: "Web app" },
  { value: "mobile", label: "Mobile app (iOS/Android)" },
  { value: "desktop", label: "Desktop app" },
  { value: "extension", label: "Browser extension" },
  { value: "cli", label: "CLI tool" },
];

const FEATURE_OPTIONS = [
  "User accounts & login",
  "Search",
  "Notifications",
  "File upload",
  "Payments / checkout",
  "Admin dashboard",
  "Real-time collaboration",
  "Reporting / analytics",
  "Third-party integrations",
  "Offline support",
];

const ROLE_OPTIONS = [
  { value: "single", label: "Single user type — everyone has the same access" },
  { value: "multiple", label: "Multiple roles (e.g. admin/user)" },
  { value: "unsure", label: "Not sure yet" },
];

export function CustomerForm() {
  const [form, setForm] = useState<PRDFormData>(initialFormData);
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "done">("idle");
  const [error, setError] = useState("");

  function set<K extends keyof PRDFormData>(key: K, value: PRDFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.appName.trim()) {
      setError("App name is required.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }

      setStatus("done");
      setForm(initialFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Thank you!</h1>
          <p>We've received your answers. We'll follow up with your PRD and next steps.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>PRD Builder</h1>
        <p>
          Answer a few questions about your app idea. We'll use your answers to put together a
          PRD and a plan for building it.
        </p>
      </header>

      <form className="prd-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h2>App Basics</h2>

          <Field
            label="App name"
            explanation="The working name of your app. It doesn't need to be final — this just gives everyone a way to refer to it."
            example="TaskFlow, PantryPal, InvoiceHero"
            required
          >
            <input
              type="text"
              value={form.appName}
              onChange={(e) => set("appName", e.target.value)}
              placeholder="e.g. TaskFlow"
            />
          </Field>

          <Field
            label="One-line pitch"
            explanation="A single sentence describing what the app does. Useful for keeping everyone aligned on the core idea."
            example="A shared grocery list that syncs across a household in real time."
          >
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="e.g. A shared grocery list that syncs in real time"
            />
          </Field>

          <Field
            label="What problem does it solve?"
            explanation="Describe the pain point or gap this app addresses. Focus on the 'why' rather than the 'how'."
            example="Roommates keep buying duplicate groceries because there's no shared, up-to-date list."
          >
            <textarea
              value={form.problem}
              onChange={(e) => set("problem", e.target.value)}
              rows={3}
              placeholder="Describe the problem..."
            />
          </Field>

          <Field
            label="Target audience"
            explanation="Who will actually use this app day-to-day? Pick all that apply."
            example="A B2B invoicing tool might target 'Small businesses'; a course app might target 'Students / educators'."
          >
            <CheckboxGroup
              options={AUDIENCE_OPTIONS}
              values={form.audience}
              onChange={(v) => set("audience", v)}
            />
            <input
              type="text"
              className="other-input"
              value={form.audienceOther}
              onChange={(e) => set("audienceOther", e.target.value)}
              placeholder="Other (optional)"
            />
          </Field>

          <Field
            label="Platform"
            explanation="Where will people use this app? This drives the tech stack Claude Code will choose."
            example="A tool people check quickly on the go is probably a mobile app; an internal tool for a team is probably a web app."
            required
          >
            <RadioGroup
              name="platform"
              options={PLATFORM_OPTIONS}
              value={form.platform}
              onChange={(v) => set("platform", v)}
            />
          </Field>
        </section>

        <section className="form-section">
          <h2>Features & Functionality</h2>

          <Field
            label="Feature checklist"
            explanation="Common building blocks many apps need. Check any that apply — this becomes a quick-reference list in the PRD."
            example="A marketplace app might need: User accounts & login, Payments / checkout, Search."
          >
            <CheckboxGroup
              options={FEATURE_OPTIONS}
              values={form.features}
              onChange={(v) => set("features", v)}
            />
            <input
              type="text"
              className="other-input"
              value={form.featuresOther}
              onChange={(e) => set("featuresOther", e.target.value)}
              placeholder="Other feature (optional)"
            />
          </Field>

          <Field
            label="Must-have features (v1)"
            explanation="The features the app cannot launch without. Claude Code will build these first."
            example="Users can create an account, add items to a list, and mark items as done."
          >
            <textarea
              value={form.mustHave}
              onChange={(e) => set("mustHave", e.target.value)}
              rows={3}
              placeholder="List the essential features..."
            />
          </Field>

          <Field
            label="Nice-to-have features (later)"
            explanation="Features that would be great to have but aren't required for launch."
            example="Dark mode, shareable public links, export to CSV."
          >
            <textarea
              value={form.niceToHave}
              onChange={(e) => set("niceToHave", e.target.value)}
              rows={3}
              placeholder="List features you'd like eventually..."
            />
          </Field>

          <Field
            label="User roles"
            explanation="Does everyone using the app have the same permissions, or are there different roles like admin vs. regular user?"
            example="An internal admin tool might have 'Admin' and 'Viewer' roles with different permissions."
          >
            <RadioGroup
              name="userRoles"
              options={ROLE_OPTIONS}
              value={form.userRoles}
              onChange={(v) => set("userRoles", v)}
            />
            {form.userRoles === "multiple" && (
              <textarea
                className="other-input"
                value={form.rolesDescription}
                onChange={(e) => set("rolesDescription", e.target.value)}
                rows={2}
                placeholder="Briefly describe the roles, e.g. Admin: manage users; User: view/edit own data"
              />
            )}
          </Field>
        </section>

        <section className="form-section">
          <h2>Anything Else?</h2>
          <Field
            label="Additional notes"
            explanation="Anything else worth mentioning — constraints, inspiration apps, things to avoid."
            example="Should feel similar to Linear but simpler; avoid needing a mobile app for v1."
          >
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Optional notes..."
            />
          </Field>
        </section>

        <div className="submit-row">
          <button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Submitting..." : "Submit"}
          </button>
          {status === "error" && <span className="error-msg">{error}</span>}
        </div>
      </form>

      <a href="/admin" className="admin-link">
        Admin
      </a>
    </div>
  );
}
