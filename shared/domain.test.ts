import { describe, expect, it } from "vitest";
import {
  applyCommand,
  attachmentTarget,
  attachmentUploadTarget,
  categories,
  initialState,
  metrics,
  viewFor,
  type Actor,
  type Command,
  type State,
} from "./domain";
import { seed } from "./seed";
const resident: Actor = {
  id: "resident-a",
  role: "resident",
  community: "iiitm-gwalior",
};
const other: Actor = { ...resident, id: "resident-b" };
const admin: Actor = { ...resident, id: "organiser", role: "organiser" };
let counter = 0;
function act(
  s: State,
  actor: Actor,
  command: Command,
  id = `action-${String(++counter).padStart(8, "0")}`,
) {
  return applyCommand(
    s,
    actor,
    command,
    id,
    s.revision,
    command.type === "handover" || command.type === "evidence"
      ? "2026-10-20T10:00:00.000Z"
      : "2026-10-10T10:00:00.000Z",
  );
}
function submit(s = initialState(), owner = resident, count = 3) {
  return act(s, owner, {
    type: "submit",
    category: "Phones",
    count,
    estimatedKg: 0.7,
    contact: "Sample private contact",
    note: "Sample phones",
  });
}
function confirmed() {
  let s = submit();
  const id = s.requests[0].id;
  s = act(s, admin, {
    type: "review",
    requestId: id,
    status: "Accepted",
    note: "",
  });
  s = act(s, admin, { type: "assign", requestId: id });
  s = act(s, admin, { type: "drive", status: "Awaiting confirmation" });
  s = act(s, admin, {
    type: "confirm",
    confirmation: {
      partner: "Sample partner",
      source: "Synthetic email",
      confirmedAt: "2026-10-10T10:00Z",
      date: "2026-10-18T10:00+05:30",
      location: "Sample location",
      fees: "No fee (sample)",
      instructions: "Sample instructions",
      accepted: ["Phones"],
    },
  });
  return s;
}
describe("Access and admission", () => {
  it("rejects members of another community", () =>
    expect(() =>
      viewFor(seed(), { ...resident, community: "another-campus" }),
    ).toThrow("admitted"));
  it("rejects invalid role and missing identity", () => {
    expect(() =>
      viewFor(seed(), { ...resident, role: "administrator" as never }),
    ).toThrow();
    expect(() => viewFor(seed(), { ...resident, id: "" })).toThrow();
  });
  it("returns only a resident’s private records", () => {
    let s = submit();
    s = submit(s, other);
    const v = viewFor(s, resident);
    expect(v.requests).toHaveLength(1);
    expect(v.requests[0].owner).toBe(resident.id);
    expect(JSON.stringify(v)).not.toContain(other.id);
    expect(v.audit).toEqual([]);
    expect(v.metrics.participants).toBe(2);
  });
  it("does not include idempotency payloads in views", () =>
    expect(viewFor(submit(), admin)).not.toHaveProperty("processed"));
  it("denies all organiser commands to a resident", () => {
    const s = confirmed(),
      id = s.requests[0].id;
    const commands: Command[] = [
      { type: "review", requestId: id, status: "Rejected", note: "No" },
      { type: "assign", requestId: id },
      { type: "drive", status: "Cancelled" },
      {
        type: "handover",
        requestId: id,
        count: 1,
        kg: 0.1,
        recipient: "Partner",
        date: "2026-10-18T10:15:00+05:30",
      },
      { type: "noShow", requestId: id },
    ];
    for (const command of commands)
      expect(() => act(s, resident, command)).toThrow("Organiser");
  });
  it("blocks cross-resident actions and photo access", () => {
    const s = submit();
    const id = s.requests[0].id;
    expect(() => act(s, other, { type: "withdraw", requestId: id })).toThrow(
      "unavailable",
    );
    expect(() => attachmentTarget(s, other, "photo", id)).toThrow(
      "unavailable",
    );
  });
});
describe("Request and drive lifecycle", () => {
  it.each([0, -1, 1.5, NaN, Infinity, 101])(
    "rejects invalid count %s",
    (count) => expect(() => submit(initialState(), resident, count)).toThrow(),
  );
  it("rejects unsupported categories and negative weights", () => {
    const base = {
      type: "submit" as const,
      count: 1,
      contact: "Sample",
      note: "",
    };
    expect(() =>
      act(initialState(), resident, { ...base, category: "TV" as never }),
    ).toThrow("category");
    expect(() =>
      act(initialState(), resident, {
        ...base,
        category: "Phones",
        estimatedKg: -1,
      }),
    ).toThrow("weight");
  });
  it("requires a review note for rejection and clarification", () => {
    const s = submit();
    expect(() =>
      act(s, admin, {
        type: "review",
        requestId: s.requests[0].id,
        status: "Rejected",
        note: "",
      }),
    ).toThrow("Review note");
  });
  it("allows owner withdrawal before confirmation and excludes totals", () => {
    let s = submit();
    s = act(s, resident, { type: "withdraw", requestId: s.requests[0].id });
    expect(metrics(s).requests).toBe(0);
    expect(metrics(s).estimatedKg).toBe(0);
  });
  it("prevents organiser impersonating a withdrawal", () => {
    const s = submit();
    expect(() =>
      act(s, admin, { type: "withdraw", requestId: s.requests[0].id }),
    ).toThrow("resident");
  });
  it("requires acceptance before assignment", () => {
    const s = submit();
    expect(() =>
      act(s, admin, { type: "assign", requestId: s.requests[0].id }),
    ).toThrow("Accept");
  });
  it("prevents handover before partner confirmation", () => {
    const s = submit();
    expect(() =>
      act(s, admin, {
        type: "handover",
        requestId: s.requests[0].id,
        count: 1,
        kg: 0.2,
        recipient: "Sample",
        date: "2026-10-18T10:15:00+05:30",
      }),
    ).toThrow("confirmed");
  });
  it("requires partner acceptance of every assigned category", () => {
    const s = confirmed();
    const before = {
      ...s,
      drive: { ...s.drive, status: "Awaiting confirmation" as const },
    };
    expect(() =>
      act(before, admin, {
        type: "confirm",
        confirmation: { ...s.drive.confirmation!, accepted: ["Computers"] },
      }),
    ).toThrow("every assigned");
  });
  it("rejects unapproved drive transitions and empty batches", () => {
    expect(() =>
      act(initialState(), admin, { type: "drive", status: "Closed" }),
    ).toThrow("transition");
    expect(() =>
      act(initialState(), admin, {
        type: "drive",
        status: "Awaiting confirmation",
      }),
    ).toThrow("at least one");
  });
  it("prevents late requests and withdrawal", () => {
    const s = confirmed();
    expect(() => submit(s)).toThrow("open");
    expect(() =>
      act(s, resident, { type: "withdraw", requestId: s.requests[0].id }),
    ).toThrow("no longer");
  });
  it("records a partial handover without inflating quantities", () => {
    let s = confirmed();
    s = act(s, admin, {
      type: "handover",
      requestId: s.requests[0].id,
      count: 1,
      kg: 0.21,
      recipient: "Demo collector",
      date: "2026-10-18T10:15:00+05:30",
    });
    expect(s.requests[0].status).toBe("Partial handover");
    expect(s.requests[0].received).toBe(1);
    expect(metrics(s)).toMatchObject({
      receivedItems: 1,
      measuredKg: 0.21,
      recycledKg: 0,
    });
  });
  it("rejects count exceeding remaining items, then completes exactly", () => {
    let s = confirmed();
    const requestId = s.requests[0].id;
    s = act(s, admin, {
      type: "handover",
      requestId,
      count: 1,
      kg: 0.2,
      recipient: "Demo",
      date: "2026-10-18T10:15:00+05:30",
    });
    expect(() =>
      act(s, admin, {
        type: "handover",
        requestId,
        count: 3,
        kg: 0.5,
        recipient: "Demo",
        date: "2026-10-18T10:15:00+05:30",
      }),
    ).toThrow("remaining");
    s = act(s, admin, {
      type: "handover",
      requestId,
      count: 2,
      kg: 0.4,
      recipient: "Demo",
      date: "2026-10-18T10:15:00+05:30",
    });
    expect(s.requests[0].status).toBe("Handed over");
    expect(metrics(s).receivedItems).toBe(3);
  });
  it("does not count no-shows as handovers", () => {
    let s = confirmed();
    s = act(s, admin, { type: "noShow", requestId: s.requests[0].id });
    expect(s.requests[0].status).toBe("No show");
    expect(metrics(s).receivedItems).toBe(0);
  });
  it("preserves measured handovers when cancelled", () => {
    let s = confirmed();
    s = act(s, admin, {
      type: "handover",
      requestId: s.requests[0].id,
      count: 1,
      kg: 0.3,
      recipient: "Demo",
      date: "2026-10-18T10:15:00+05:30",
    });
    s = act(s, admin, { type: "drive", status: "Cancelled" });
    expect(metrics(s).measuredKg).toBe(0.3);
    expect(s.requests[0].status).toBe("Partial handover");
  });
  it("marks assigned items uncollected on closure", () => {
    let s = confirmed();
    s = act(s, admin, { type: "drive", status: "Closed" });
    expect(s.requests[0].status).toBe("Uncollected");
    expect(metrics(s).receivedItems).toBe(0);
  });
});
describe("Concurrency, idempotency and evidence", () => {
  it("namespaces record identifiers by actor even when action IDs collide", () => {
    const command: Command = {
      type: "submit",
      category: "Phones",
      count: 1,
      contact: "Sample",
      note: "",
    };
    let s = act(initialState(), resident, command, "same-action-001");
    s = act(s, other, command, "same-action-001");
    expect(new Set(s.requests.map((r) => r.id)).size).toBe(2);
    expect(viewFor(s, resident).requests).toHaveLength(1);
  });
  it("replays an action without duplicating its handover even with stale revision", () => {
    const before = confirmed();
    const cmd: Command = {
      type: "handover",
      requestId: before.requests[0].id,
      count: 1,
      kg: 0.3,
      recipient: "Demo",
      date: "2026-10-18T10:15:00+05:30",
    };
    const after = applyCommand(
      before,
      admin,
      cmd,
      "repeat-action-001",
      before.revision,
      "2026-10-20T10:00:00.000Z",
    );
    const retry = applyCommand(
      after,
      admin,
      cmd,
      "repeat-action-001",
      before.revision,
      "2026-10-20T10:00:00.000Z",
    );
    expect(retry).toBe(after);
    expect(metrics(retry).measuredKg).toBe(0.3);
  });
  it("rejects reused identifiers with a changed payload", () => {
    const before = confirmed();
    const cmd: Command = {
      type: "handover",
      requestId: before.requests[0].id,
      count: 1,
      kg: 0.3,
      recipient: "Demo",
      date: "2026-10-18T10:15:00+05:30",
    };
    const after = act(before, admin, cmd, "repeat-action-002");
    expect(() =>
      act(after, admin, { ...cmd, count: 2 }, "repeat-action-002"),
    ).toThrow("different");
  });
  it("rejects stale state changes", () => {
    const s = submit();
    expect(() =>
      applyCommand(
        s,
        admin,
        { type: "drive", status: "Cancelled" },
        "stale-action-001",
        0,
      ),
    ).toThrow("Refresh");
  });
  it("keeps estimates separate from measured weight", () => {
    const s = confirmed();
    expect(metrics(s)).toMatchObject({
      estimatedKg: 0.7,
      measuredKg: 0,
      recycledKg: 0,
      confirmedItems: 3,
    });
  });
  it("requires a downstream document, prevents over-crediting and duplicate evidence", () => {
    let s = confirmed();
    const reqId = s.requests[0].id;
    s = act(s, admin, {
      type: "handover",
      requestId: reqId,
      count: 1,
      kg: 0.3,
      recipient: "Demo",
      date: "2026-10-18T10:15:00+05:30",
    });
    const command: Command = {
      type: "evidence",
      kg: 0.2,
      source: "Synthetic recycler document",
      date: "2026-10-19T10:15:00+05:30",
      document: {
        key: "private/evidence/drive/sample-document-01",
        name: "sample.pdf",
        type: "application/pdf",
      },
    };
    s = act(s, admin, command, "evidence-action-01");
    expect(metrics(s).recycledKg).toBe(0.2);
    expect(() => act(s, admin, command)).toThrow("exceed");
    expect(viewFor(s, resident).evidence).toEqual([]);
  });
  it("prevents file references to another record", () => {
    const s = submit();
    expect(() =>
      act(s, resident, {
        type: "attach",
        target: "photo",
        recordId: s.requests[0].id,
        attachment: {
          key: "private/photo/other-record/sample-object",
          type: "image/png",
          name: "x.png",
        },
      }),
    ).toThrow("belong");
  });
  it("keeps all sample metrics in the demo namespace", () => {
    const s = seed();
    expect(viewFor(s, admin).demo).toBe(true);
    expect(initialState(false).requests).toHaveLength(0);
    expect(categories).toHaveLength(5);
  });
});

describe("Review regression cases", () => {
  const pendingConfirmation = () => {
    const s = confirmed();
    s.drive.status = "Awaiting confirmation";
    return s;
  };
  const handoverCommand = (
    s: State,
    date = "2026-10-18T10:15:00+05:30",
  ): Command => ({
    type: "handover",
    requestId: s.requests[0].id,
    count: 1,
    kg: 0.3,
    recipient: "Synthetic collector",
    date,
  });
  const photoCommand = (s: State): Command => ({
    type: "attach",
    target: "photo",
    recordId: s.requests[0].id,
    attachment: {
      key: `private/photo/${s.requests[0].id}/sample-photo-01`,
      name: "sample.png",
      type: "image/png",
    },
  });

  it("rejects confirmation when the last assigned resident withdraws", () => {
    let s = pendingConfirmation();
    const confirmation = s.drive.confirmation!;
    s = act(s, resident, { type: "withdraw", requestId: s.requests[0].id });
    expect(() => act(s, admin, { type: "confirm", confirmation })).toThrow(
      "at least one",
    );
  });
  it("rejects proposed and confirmed collection dates in the past", () => {
    const s = pendingConfirmation();
    expect(() =>
      act(s, admin, {
        type: "confirm",
        confirmation: {
          ...s.drive.confirmation!,
          date: "2026-10-09T10:00:00+05:30",
        },
      }),
    ).toThrow("past");
    expect(() =>
      act(initialState(), admin, {
        type: "drive",
        status: "Cancelled",
        proposedDate: "2026-10-09T10:00:00+05:30",
      }),
    ).toThrow("past");
  });
  it("rejects a future confirmation timestamp in real mode", () => {
    const s = pendingConfirmation();
    expect(() =>
      act(s, admin, {
        type: "confirm",
        confirmation: {
          ...s.drive.confirmation!,
          confirmedAt: "2026-10-11T10:00:00Z",
        },
      }),
    ).toThrow("future");
  });
  it("rejects collection before the reported confirmation", () => {
    const s = pendingConfirmation();
    s.demo = true;
    expect(() =>
      act(s, admin, {
        type: "confirm",
        confirmation: {
          ...s.drive.confirmation!,
          confirmedAt: "2026-10-19T10:00:00Z",
        },
      }),
    ).toThrow("precede");
  });
  it.each([
    "2026-10-18",
    "2026-10-18T10:15",
    "2026-02-31T10:00:00Z",
    "2026-10-18T24:00:00Z",
  ])("rejects invalid or ambiguous timestamp %s", (date) => {
    const s = confirmed();
    expect(() => act(s, admin, handoverCommand(s, date))).toThrow("valid");
  });
  it("rejects handover before confirmation and before collection", () => {
    const s = confirmed();
    expect(() =>
      act(s, admin, handoverCommand(s, "2026-10-09T10:00:00Z")),
    ).toThrow("partner confirmation");
    expect(() =>
      act(s, admin, handoverCommand(s, "2026-10-17T10:00:00Z")),
    ).toThrow("collection time");
  });
  it("rejects future real handovers, while labelled demo permits simulation", () => {
    const s = confirmed();
    const command = handoverCommand(s);
    expect(() =>
      applyCommand(
        s,
        admin,
        command,
        "future-handover-01",
        s.revision,
        "2026-10-10T10:00:00Z",
      ),
    ).toThrow("future");
    s.demo = true;
    expect(
      applyCommand(
        s,
        admin,
        command,
        "future-handover-01",
        s.revision,
        "2026-10-10T10:00:00Z",
      ).handovers,
    ).toHaveLength(1);
  });
  it("rejects evidence that predates the measured handover", () => {
    let s = confirmed();
    s = act(s, admin, handoverCommand(s));
    expect(() =>
      act(s, admin, {
        type: "evidence",
        kg: 0.2,
        source: "Synthetic document",
        date: "2026-10-18T10:00:00+05:30",
        document: {
          key: "private/evidence/drive/sample-evidence-01",
          name: "sample.pdf",
          type: "application/pdf",
        },
      }),
    ).toThrow("precede");
  });
  it.each([
    "Withdrawn",
    "Rejected",
    "Handed over",
    "No show",
    "Uncollected",
    "Partial handover",
  ] as const)("rejects photo uploads and linking on %s requests", (status) => {
    const s = submit();
    s.requests[0].status = status;
    expect(() =>
      attachmentUploadTarget(s, resident, "photo", s.requests[0].id),
    ).toThrow("closed");
    expect(() => act(s, resident, photoCommand(s))).toThrow("closed");
  });
  it.each(["Closed", "Cancelled"] as const)(
    "rejects photo uploads on %s drives",
    (status) => {
      const s = submit();
      s.drive.status = status;
      expect(() => act(s, resident, photoCommand(s))).toThrow("closed");
    },
  );
  it("never replaces a photo and preserves read access after withdrawal", () => {
    let s = submit();
    s = act(s, resident, photoCommand(s));
    expect(() => act(s, resident, photoCommand(s))).toThrow(
      "cannot be replaced",
    );
    expect(() =>
      attachmentUploadTarget(s, resident, "photo", s.requests[0].id),
    ).toThrow("cannot be replaced");
    s = act(s, resident, { type: "withdraw", requestId: s.requests[0].id });
    expect(() =>
      attachmentTarget(s, resident, "photo", s.requests[0].id),
    ).not.toThrow();
  });
  it("never replaces a handover receipt", () => {
    let s = confirmed();
    s = act(s, admin, handoverCommand(s));
    const recordId = s.handovers[0].id;
    const command: Command = {
      type: "attach",
      target: "receipt",
      recordId,
      attachment: {
        key: `private/receipt/${recordId}/sample-receipt-01`,
        name: "sample.pdf",
        type: "application/pdf",
      },
    };
    s = act(s, admin, command);
    expect(() => act(s, admin, command)).toThrow("cannot be replaced");
  });
  it("stores fixed-size command hashes without a duplicate private payload", () => {
    const s = submit();
    const values = Object.values(s.processed);
    expect(values).toHaveLength(1);
    expect(values[0]).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(JSON.stringify(s.processed)).not.toContain("Sample private contact");
  });
  it("replays legacy action IDs and migrates old payloads on a new write", () => {
    const command: Command = {
      type: "submit",
      category: "Phones",
      count: 1,
      contact: "Legacy contact",
      note: "",
    };
    const before = act(initialState(), resident, command, "legacy-action-001");
    before.processed[`${resident.id}:legacy-action-001`] =
      JSON.stringify(command);
    expect(
      applyCommand(before, resident, command, "legacy-action-001", 0),
    ).toBe(before);
    const after = act(before, resident, {
      type: "withdraw",
      requestId: before.requests[0].id,
    });
    expect(
      Object.values(after.processed).every((value) =>
        /^sha256:[a-f0-9]{64}$/.test(value),
      ),
    ).toBe(true);
  });
});
