import type { FormEventHandler } from "react";
import { ArrowRight } from "lucide-react";
import {
  categories,
  type Metrics,
  type RequestRecord,
} from "../../shared/domain";
import { isAws } from "../api";
import { Field } from "./ui";
export function RequestForm({
  busy,
  demo,
  onSubmit,
}: {
  busy: boolean;
  demo: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form onSubmit={onSubmit}>
      <p className="form-intro">
        A request starts the review. Keep your items until collection is
        confirmed.
      </p>
      <Field label="Item category">
        <select name="category" required>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <div className="form-row">
        <Field label="Number of items">
          <input
            name="count"
            type="number"
            min="1"
            max="100"
            step="1"
            defaultValue="1"
            required
          />
        </Field>
        <Field
          label="Estimated weight (kg)"
          hint="Optional · leave blank if unknown"
        >
          <input
            name="weight"
            type="number"
            min="0"
            max="1000"
            step="0.01"
            placeholder="I don’t know"
          />
        </Field>
      </div>
      <Field
        label="How should the organiser contact you?"
        hint="Visible only to you and the organiser"
      >
        <input
          name="contact"
          maxLength={200}
          required
          placeholder="Campus email or preferred contact"
        />
      </Field>
      <Field label="Item condition / notes">
        <textarea
          name="note"
          maxLength={500}
          rows={3}
          placeholder="Anything the partner should review?"
        />
      </Field>
      <p className="form-intro">
        You can add an optional photo to the saved request.{" "}
        {demo && "Use sample contact details in this demo."}
      </p>
      <button className="primary full" disabled={busy}>
        {busy ? "Saving…" : "Submit for review"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
export function ConfirmationForm({
  busy,
  demo,
  onSubmit,
}: {
  busy: boolean;
  demo: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form onSubmit={onSubmit}>
      <p className="form-intro">
        {demo
          ? "This records a simulated partner confirmation for the demo only."
          : "Enter the partner’s actual confirmation. Do not infer approval from an unanswered message."}
      </p>
      {!demo && (
        <p className="form-intro">
          Handovers can be recorded only after the confirmed collection time has
          arrived. Use demo mode for a simulated walkthrough before that time.
        </p>
      )}
      <Field label="Collection partner">
        <input
          name="partner"
          maxLength={120}
          defaultValue={
            demo ? "Demo Circular Collection · fictional partner" : ""
          }
          required
        />
      </Field>
      <Field label="Confirmation source" hint="Email, call record or reference">
        <input
          name="source"
          maxLength={300}
          defaultValue={
            demo ? "Synthetic demo confirmation, no agreement exists" : ""
          }
          required
        />
      </Field>
      <div className="form-row">
        <Field label="Confirmation received at (IST)">
          <input type="datetime-local" name="confirmedAt" required />
        </Field>
        <Field label="Collection date & time (IST)">
          <input type="datetime-local" name="date" required />
        </Field>
      </div>
      <Field label="Collection location">
        <input
          name="location"
          maxLength={200}
          defaultValue={demo ? "Demo campus gate, IIITM Gwalior" : ""}
          required
        />
      </Field>
      <Field label="Fees and collection terms">
        <input
          name="fees"
          maxLength={200}
          placeholder="Record explicitly, including no fee if agreed"
          required
        />
      </Field>
      <Field label="Confirmed handling instructions">
        <textarea name="instructions" maxLength={500} rows={3} required />
      </Field>
      <fieldset>
        <legend>Partner-accepted categories</legend>
        {categories.map((c) => (
          <label className="check-row" key={c}>
            <input type="checkbox" name="accepted" value={c} />
            {c}
          </label>
        ))}
      </fieldset>
      <button className="primary full" disabled={busy}>
        {busy ? "Saving…" : "Record confirmation"}
      </button>
    </form>
  );
}
export function HandoverForm({
  busy,
  request,
  onSubmit,
}: {
  busy: boolean;
  request: RequestRecord;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form onSubmit={onSubmit}>
      <p className="form-intro">
        {request.count - request.received} items remaining. Enter only items
        received in this handover.
      </p>
      <div className="form-row">
        <Field label="Received items">
          <input
            type="number"
            name="count"
            min="1"
            max={request.count - request.received}
            step="1"
            required
          />
        </Field>
        <Field label="Measured weight (kg)">
          <input
            type="number"
            name="kg"
            min="0"
            max="1000"
            step="0.01"
            required
          />
        </Field>
      </div>
      <Field label="Recipient / receiving organisation">
        <input name="recipient" maxLength={120} required />
      </Field>
      <Field label="Handover date & time (IST)">
        <input name="date" type="datetime-local" required />
      </Field>
      <p className="form-intro">
        Attach the receipt to the saved handover record. This transfer does not
        count as recycling.
      </p>
      <button className="primary full" disabled={busy}>
        {busy ? "Saving…" : "Record received items"}
      </button>
    </form>
  );
}
export function EvidenceForm({
  busy,
  demo,
  metrics,
  onSubmit,
}: {
  busy: boolean;
  demo: boolean;
  metrics: Metrics;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form onSubmit={onSubmit}>
      <p className="form-intro">
        {demo
          ? "Upload a labelled sample document only. Demo evidence never enters real pilot totals."
          : "Only record evidence covering this drive’s measured handovers."}
      </p>
      <Field label="Kilograms supported by this evidence">
        <input
          name="kg"
          type="number"
          min="0.01"
          max={(metrics.measuredKg ?? 0) - (metrics.recycledKg ?? 0)}
          step="0.01"
          required
        />
      </Field>
      <Field label="Receiving recycler / document reference">
        <input name="source" maxLength={300} required />
      </Field>
      <Field label="Evidence date & time (IST)">
        <input name="date" type="datetime-local" required />
      </Field>
      <Field
        label="Downstream evidence document"
        hint={
          isAws
            ? "JPEG, PNG or PDF · up to 5 MB"
            : "Sample JPEG, PNG or PDF · up to 500 KB in local demo"
        }
      >
        <input
          name="document"
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          required
        />
      </Field>
      <button className="primary full" disabled={busy}>
        {busy ? "Uploading…" : "Record evidence"}
      </button>
    </form>
  );
}
