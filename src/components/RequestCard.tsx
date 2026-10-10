import { Check, ClipboardList, ShieldCheck, Plus } from "lucide-react";
import type {
  Actor,
  Attachment,
  Command,
  DriveStatus,
  RequestRecord,
  View,
} from "../../shared/domain";
import { Badge } from "./ui";
import { Upload, type UploadProps } from "./Upload";
import { categoryIcons, number } from "./format";
export interface RequestCardProps {
  r: RequestRecord;
  actor: Actor;
  driveStatus: DriveStatus;
  busy: boolean;
  reviewNote: string;
  onReviewNote: (id: string, note: string) => void;
  run: (command: Command, message: string) => Promise<View | undefined>;
  onHandover: (request: RequestRecord) => void;
  attach: UploadProps["attach"];
  openFile: (
    target: "photo" | "receipt" | "evidence",
    id: string,
    file: Attachment,
    evidenceId?: string,
  ) => Promise<void>;
}
export function RequestCard({
  r,
  actor,
  driveStatus,
  busy,
  reviewNote,
  onReviewNote,
  run,
  onHandover,
  attach,
  openFile,
}: RequestCardProps) {
  const organiser = actor.role === "organiser";
  const Icon = categoryIcons[r.category];
  return (
    <article className="request-card" key={r.id}>
      <div className="request-main">
        <div className="item-icon">
          <Icon size={23} />
        </div>
        <div className="request-title">
          <h3>{r.category}</h3>
          <p>
            {r.count} {r.count === 1 ? "item" : "items"} ·{" "}
            {r.estimatedKg === undefined
              ? "Weight unknown"
              : `${number(r.estimatedKg)} kg estimated`}
          </p>
        </div>
        <Badge>{r.status}</Badge>
      </div>
      <p className="item-note">{r.note || "No extra item notes."}</p>
      {r.reviewNote && (
        <p className="review-note">
          <ClipboardList size={14} />
          {r.reviewNote}
        </p>
      )}
      {organiser && (
        <p className="private-contact">
          <ShieldCheck size={13} /> Contact: {r.contact}
        </p>
      )}
      {r.received > 0 && (
        <p className="review-note">
          <Check size={14} />
          {r.received} of {r.count} items handed over
          {r.received < r.count && ` · ${r.count - r.received} remaining`}
        </p>
      )}
      <div className="request-actions">
        {r.photo ? (
          <button
            className="text-button"
            onClick={() => openFile("photo", r.id, r.photo!)}
          >
            View photo
          </button>
        ) : (
          ["Submitted", "Needs clarification", "Accepted", "Assigned"].includes(
            r.status,
          ) &&
          !["Closed", "Cancelled"].includes(driveStatus) && (
            <Upload
              target="photo"
              recordId={r.id}
              busy={busy}
              attach={attach}
            />
          )
        )}
        {r.owner === actor.id &&
          ["Submitted", "Accepted", "Needs clarification", "Assigned"].includes(
            r.status,
          ) &&
          !["Confirmed", "Closed", "Cancelled"].includes(driveStatus) && (
            <button
              className="text-button muted"
              disabled={busy}
              onClick={() =>
                run(
                  { type: "withdraw", requestId: r.id },
                  "Request withdrawn. You keep your items.",
                )
              }
            >
              Withdraw request
            </button>
          )}
        {organiser &&
          ["Submitted", "Needs clarification", "Accepted"].includes(r.status) &&
          ["Open", "Awaiting confirmation"].includes(driveStatus) && (
            <div className="review-controls">
              <input
                aria-label={`Review note for ${r.category}`}
                placeholder="Review note (required to clarify / reject)"
                maxLength={500}
                value={reviewNote}
                onChange={(e) => onReviewNote(r.id, e.target.value)}
              />
              <div className="review-buttons">
                <button
                  className="small-button"
                  disabled={busy}
                  onClick={() =>
                    run(
                      {
                        type: "review",
                        requestId: r.id,
                        status: "Accepted",
                        note: reviewNote,
                      },
                      "Request accepted for batching.",
                    )
                  }
                >
                  Accept
                </button>
                <button
                  className="small-button secondary"
                  disabled={busy}
                  onClick={() =>
                    run(
                      {
                        type: "review",
                        requestId: r.id,
                        status: "Needs clarification",
                        note: reviewNote,
                      },
                      "Clarification requested.",
                    )
                  }
                >
                  Clarify
                </button>
                <button
                  className="text-button danger"
                  disabled={busy}
                  onClick={() =>
                    run(
                      {
                        type: "review",
                        requestId: r.id,
                        status: "Rejected",
                        note: reviewNote,
                      },
                      "Request rejected with the review note.",
                    )
                  }
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        {organiser &&
          r.status === "Accepted" &&
          ["Open", "Awaiting confirmation"].includes(driveStatus) && (
            <button
              className="small-button"
              disabled={busy}
              onClick={() =>
                run(
                  { type: "assign", requestId: r.id },
                  "Accepted request added to the batch.",
                )
              }
            >
              Add to batch <Plus size={14} />
            </button>
          )}
        {organiser &&
          ["Assigned", "Partial handover"].includes(r.status) &&
          driveStatus === "Confirmed" && (
            <>
              <button
                className="small-button"
                disabled={busy}
                onClick={() => onHandover(r)}
              >
                Record handover
              </button>
              {r.status === "Assigned" && (
                <button
                  className="text-button muted"
                  disabled={busy}
                  onClick={() =>
                    run(
                      { type: "noShow", requestId: r.id },
                      "No-show recorded. No handover weight added.",
                    )
                  }
                >
                  Mark no-show
                </button>
              )}
            </>
          )}
      </div>
    </article>
  );
}
