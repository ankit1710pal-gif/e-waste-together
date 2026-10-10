import {
  ArrowRight,
  ClipboardList,
  FileCheck2,
  Recycle,
  Users,
} from "lucide-react";
import type { demoActors } from "../../shared/seed";
export type DemoPersona = keyof typeof demoActors;
export function Welcome({
  onSignIn,
  onSignUp,
  onDemo,
}: {
  onSignIn: () => void;
  onSignUp: () => void;
  onDemo: () => void;
}) {
  return (
    <main className="identity-page">
      <section className="welcome-card">
        <div className="entry-brand">
          <span className="brand-mark">
            <Recycle aria-hidden="true" size={24} />
          </span>
          <strong>E-Waste Together</strong>
        </div>
        <p className="eyebrow">IIITM GWALIOR · CAMPUS COMMUNITY</p>
        <h1>A clearer path for campus e-waste.</h1>
        <p className="welcome-promise">
          Coordinate campus e-waste collection, from request to recycling
          evidence.
        </p>
        <ol className="welcome-steps">
          <li>
            <ClipboardList aria-hidden="true" />
            <div>
              <h2>Submit your items</h2>
              <p>Describe the electronics you want to give for review.</p>
            </div>
          </li>
          <li>
            <Users aria-hidden="true" />
            <div>
              <h2>Wait for confirmed collection</h2>
              <p>
                Keep your items until the organiser records the partner’s
                confirmation.
              </p>
            </div>
          </li>
          <li>
            <FileCheck2 aria-hidden="true" />
            <div>
              <h2>Track handover and evidence</h2>
              <p>
                Measured handover and evidenced recycling are recorded
                separately.
              </p>
            </div>
          </li>
        </ol>
        <div className="entry-actions">
          <button className="primary" onClick={onSignIn}>
            Sign in
            <ArrowRight aria-hidden="true" size={18} />
          </button>
          <button className="secondary-button" onClick={onSignUp}>
            Create account
          </button>
        </div>
        <p className="quiet">
          Campus access: verified campus email + organiser admission.
        </p>
        <button className="text-button" onClick={onDemo}>
          Try the demo
        </button>
        <p className="quiet">
          The demo uses fictional people and browser-local sample data. It does
          not sign you in.
        </p>
      </section>
    </main>
  );
}
export function DemoChooser({
  choose,
  back,
}: {
  choose: (persona: DemoPersona) => void;
  back: () => void;
}) {
  const roles: { id: DemoPersona; name: string; detail: string }[] = [
    {
      id: "resident",
      name: "Asha",
      detail: "Demo resident · submit items and view Asha’s own requests.",
    },
    {
      id: "neighbour",
      name: "Kabir",
      detail: "Demo resident · explore Kabir’s separate request view.",
    },
    {
      id: "organiser",
      name: "Organiser",
      detail:
        "Demo organiser · review a fictional batch and record simulated steps.",
    },
  ];
  return (
    <main className="identity-page">
      <section className="welcome-card">
        <p className="mode-banner">
          Demo — simulated people and data, not real sign-in
        </p>
        <h1>Choose a demo role</h1>
        <p>
          Explore the workflow using sample details. No account or real
          collection is created.
        </p>
        <div className="demo-role-grid">
          {roles.map((role) => (
            <button
              key={role.id}
              className="demo-role-card"
              onClick={() => choose(role.id)}
            >
              <strong>{role.name}</strong>
              <span>{role.detail}</span>
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          ))}
        </div>
        <button className="text-button" onClick={back}>
          Back to welcome
        </button>
      </section>
    </main>
  );
}
