import type { ReactNode } from "react";
import { ArrowRight, Plus } from "lucide-react";
import type { Command, RequestRecord, View } from "../../shared/domain";
import { Badge } from "./ui";
import { Upload } from "./Upload";
import { number, displayDate } from "./format";
import type { RequestCardProps } from "./RequestCard";
export function DrivePanel({
  view,
  busy,
  run,
  setModal,
  renderRequestCard,
  attach,
  openFile,
}: {
  view: View;
  busy: boolean;
  run: (command: Command, message: string) => Promise<View | undefined>;
  setModal: (modal: "confirmation" | "close" | "cancel" | "evidence") => void;
  renderRequestCard: (request: RequestRecord) => ReactNode;
  attach: RequestCardProps["attach"];
  openFile: RequestCardProps["openFile"];
}) {
  const status = view.drive.status;
  const confirmed = view.drive.confirmation;
  return (
    <>
      <section className="drive-panel">
        <div className="section-title">
          <h2>Campus collection</h2>
          <Badge>{status}</Badge>
        </div>
        <div className="drive-facts">
          <div>
            <small>ESTIMATED BATCH WEIGHT</small>
            <strong>{number(view.metrics.estimatedKg)} kg</strong>
            <p>Resident estimates; never measured weight</p>
          </div>
          <div>
            <small>PARTNER-CONFIRMED ITEMS</small>
            <strong>{view.metrics.confirmedItems}</strong>
            <p>Assigned requests in a confirmed batch</p>
          </div>
          <div>
            <small>COLLECTION PARTNER</small>
            <strong>{confirmed?.partner ?? "Not confirmed"}</strong>
            <p>
              {view.demo
                ? "Demonstration only"
                : "External confirmation required"}
            </p>
          </div>
        </div>
        {confirmed && (
          <div className="confirmation-details">
            <p>
              <strong>Collection:</strong> {displayDate(confirmed.date)} ·{" "}
              {confirmed.location}
            </p>
            <p>
              <strong>Terms:</strong> {confirmed.fees}
            </p>
            <p>
              <strong>Instructions:</strong> {confirmed.instructions}
            </p>
            <p>
              <strong>Confirmation source:</strong> {confirmed.source} ·{" "}
              {displayDate(confirmed.confirmedAt)}
            </p>
            <p>
              <strong>Accepted:</strong> {confirmed.accepted.join(", ")}
            </p>
          </div>
        )}
        <div className="drive-actions">
          {status === "Open" && (
            <button
              className="primary"
              disabled={
                busy || !view.requests.some((r) => r.status === "Assigned")
              }
              onClick={() =>
                run(
                  {
                    type: "drive",
                    status: "Awaiting confirmation",
                  },
                  "Batch ready. Record the partner’s explicit confirmation next.",
                )
              }
            >
              Request partner confirmation
              <ArrowRight size={16} />
            </button>
          )}
          {status === "Awaiting confirmation" && (
            <>
              <button
                className="primary"
                onClick={() => setModal("confirmation")}
              >
                Record {view.demo ? "simulated " : ""}confirmation
              </button>
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() =>
                  run(
                    { type: "drive", status: "Open" },
                    "Drive reopened for requests.",
                  )
                }
              >
                Reopen requests
              </button>
            </>
          )}
          {status === "Confirmed" && (
            <button
              className="secondary-button"
              onClick={() => setModal("close")}
            >
              Close drive
            </button>
          )}
          {!["Closed", "Cancelled"].includes(status) && (
            <button
              className="text-button danger"
              onClick={() => setModal("cancel")}
            >
              Cancel drive
            </button>
          )}
        </div>
      </section>
      <div className="section-title">
        <h2>Review & batch</h2>
        <span>Accept eligible items before adding them to the batch</span>
      </div>
      <div className="requests-grid">
        {view.requests.map(renderRequestCard)}
      </div>
      <section className="records-panel">
        <div className="section-title">
          <h2>Handover records</h2>
          <span>{view.handovers.length} documented handovers</span>
        </div>
        {view.handovers.length ? (
          view.handovers.map((h) => (
            <div className="record" key={h.id}>
              <div>
                <strong>
                  {view.requests.find((r) => r.id === h.requestId)?.category} ·{" "}
                  {h.count} items · {number(h.kg)} kg measured
                </strong>
                <p>
                  {h.recipient} · {displayDate(h.date)}
                </p>
              </div>
              {h.receipt ? (
                <button
                  className="text-button"
                  onClick={() => openFile("receipt", h.id, h.receipt!)}
                >
                  View receipt
                </button>
              ) : (
                <Upload
                  target="receipt"
                  recordId={h.id}
                  busy={busy}
                  attach={attach}
                />
              )}
            </div>
          ))
        ) : (
          <p className="quiet">
            Handover records appear after the drive is confirmed and items are
            received.
          </p>
        )}
      </section>
      <section className="records-panel">
        <div className="section-title">
          <h2>Downstream recycling evidence</h2>
          <button
            className="small-button"
            disabled={!view.handovers.length || busy}
            onClick={() => setModal("evidence")}
          >
            <Plus size={15} />
            Record evidence
          </button>
        </div>
        <p className="quiet">
          A pickup receipt alone is not evidence of recycling. Upload a
          downstream document and record the kilograms it supports.
        </p>
        {view.evidence.map((e) => (
          <div className="record" key={e.id}>
            <div>
              <strong>
                {number(e.kg)} kg · {e.source}
              </strong>
              <p>{displayDate(e.date)}</p>
            </div>
            <button
              className="text-button"
              onClick={() => openFile("evidence", "drive", e.document, e.id)}
            >
              View document
            </button>
          </div>
        ))}
      </section>
      <details className="audit">
        <summary>Activity log · {view.audit.length} actions</summary>
        {view.audit.length ? (
          [...view.audit].reverse().map((a, i) => (
            <p key={i}>
              <strong>{a.action}</strong> · {displayDate(a.at)} · {a.actor}
            </p>
          ))
        ) : (
          <p>No workflow actions recorded yet.</p>
        )}
      </details>
    </>
  );
}
