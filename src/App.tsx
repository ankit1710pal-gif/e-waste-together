import { Badge, Modal, Stat, Empty, Guide } from "./components/ui";
import { number, displayDate, istTimestamp } from "./components/format";
import { RequestCard } from "./components/RequestCard";
import { DrivePanel } from "./components/DrivePanel";
import {
  RequestForm,
  ConfirmationForm,
  HandoverForm,
  EvidenceForm,
} from "./components/WorkflowForms";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileCheck2,
  Laptop,
  Leaf,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  X,
  Cable,
  Package,
  Recycle,
} from "lucide-react";
import {
  categories,
  type Actor,
  type Attachment,
  type Category,
  type Command,
  type Confirmation,
  type RequestRecord,
  type View,
} from "../shared/domain";
import { demoActors } from "../shared/seed";
import {
  execute,
  fileUrl,
  isAws,
  loadView,
  resetDemo,
  uploadFile,
} from "./api";
type Page = "Overview" | "My requests" | "Manage drive" | "Collection guide";

export default function App({ cloudIdentity }: { cloudIdentity?: Actor }) {
  const [persona, setPersona] = useState<keyof typeof demoActors>("resident");
  const actor = cloudIdentity ?? demoActors[persona];
  const organiser = actor.role === "organiser";
  const [view, setView] = useState<View>();
  const [page, setPage] = useState<Page>("Overview");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState<
    | "submit"
    | "confirmation"
    | "evidence"
    | "reset"
    | "cancel"
    | "close"
    | RequestRecord
    | null
  >(null);
  const [preview, setPreview] = useState<{ url: string; name: string }>();
  const [filter, setFilter] = useState("All requests");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const stagedEvidence = useRef<
    { fingerprint: string; document: Attachment } | undefined
  >(undefined);
  async function refresh() {
    setError("");
    try {
      setView(await loadView(actor));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    let active = true;
    setView(undefined);
    loadView(actor)
      .then((v) => {
        if (active) setView(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [actor.id]);
  useEffect(() => {
    if (!organiser && page === "Manage drive") setPage("Overview");
  }, [organiser]);
  async function run(command: Command, message: string) {
    if (!view || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await execute(actor, command, view.revision);
      setView(next);
      setNotice(message);
      return next;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function attach(
    target: "photo" | "receipt",
    recordId: string,
    file?: File,
  ) {
    if (!file || !view || busy) return;
    setBusy(true);
    setError("");
    try {
      const attachment = await uploadFile(target, recordId, file);
      const next = await execute(
        actor,
        { type: "attach", target, recordId, attachment },
        view.revision,
      );
      setView(next);
      setNotice(
        "File attached. Access follows the permissions for this record.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function openFile(
    target: "photo" | "receipt" | "evidence",
    recordId: string,
    file: NonNullable<RequestRecord["photo"]>,
    evidenceId?: string,
  ) {
    try {
      setPreview({
        url: await fileUrl(target, recordId, file, evidenceId),
        name: file.name,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function renderRequestCard(r: RequestRecord) {
    return (
      <RequestCard
        key={r.id}
        r={r}
        actor={actor}
        driveStatus={view!.drive.status}
        busy={busy}
        reviewNote={reviewNotes[r.id] ?? ""}
        onReviewNote={(id, note) =>
          setReviewNotes((previous) => ({ ...previous, [id]: note }))
        }
        run={run}
        onHandover={setModal}
        attach={attach}
        openFile={openFile}
      />
    );
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next = await run(
      {
        type: "submit",
        category: String(f.get("category")) as Category,
        count: Number(f.get("count")),
        estimatedKg: f.get("weight") ? Number(f.get("weight")) : undefined,
        contact: String(f.get("contact")),
        note: String(f.get("note")),
      },
      "Request submitted. The organiser will review your items; collection is not yet confirmed.",
    );
    if (next) {
      setModal(null);
      setPage("My requests");
    }
  }
  async function confirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const confirmation: Confirmation = {
      partner: String(f.get("partner")),
      source: String(f.get("source")),
      confirmedAt: istTimestamp(f.get("confirmedAt")),
      date: istTimestamp(f.get("date")),
      location: String(f.get("location")),
      fees: String(f.get("fees")),
      instructions: String(f.get("instructions")),
      accepted: f.getAll("accepted") as Category[],
    };
    if (
      await run(
        { type: "confirm", confirmation },
        isAws
          ? "External partner confirmation recorded."
          : "Simulated partner confirmation recorded for this demo.",
      )
    )
      setModal(null);
  }
  async function handover(
    e: FormEvent<HTMLFormElement>,
    request: RequestRecord,
  ) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (
      await run(
        {
          type: "handover",
          requestId: request.id,
          count: Number(f.get("count")),
          kg: Number(f.get("kg")),
          recipient: String(f.get("recipient")),
          date: istTimestamp(f.get("date")),
        },
        "Handover recorded. Only the received items and measured weight were added.",
      )
    )
      setModal(null);
  }
  async function evidence(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!view || busy) return;
    const f = new FormData(e.currentTarget);
    const file = f.get("document") as File;
    setBusy(true);
    setError("");
    try {
      const fingerprint = JSON.stringify([
        actor.id,
        f.get("kg"),
        f.get("source"),
        f.get("date"),
        file.name,
        file.size,
        file.lastModified,
      ]);
      const document =
        stagedEvidence.current?.fingerprint === fingerprint
          ? stagedEvidence.current.document
          : await uploadFile("evidence", "drive", file);
      stagedEvidence.current = { fingerprint, document };
      const next = await execute(
        actor,
        {
          type: "evidence",
          kg: Number(f.get("kg")),
          source: String(f.get("source")),
          date: istTimestamp(f.get("date")),
          document,
        },
        view.revision,
      );
      stagedEvidence.current = undefined;
      setView(next);
      setModal(null);
      setNotice(
        "Downstream evidence recorded. Evidence totals are separate from handover totals.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const ownRequests =
    view?.requests.filter((r) => organiser || r.owner === actor.id) ?? [];
  const list = ownRequests.filter(
    (r) =>
      filter === "All requests" ||
      (filter === "Needs review"
        ? ["Submitted", "Needs clarification"].includes(r.status)
        : r.status === filter),
  );
  const confirmed = view?.drive.confirmation;
  const status = view?.drive.status ?? "Loading";
  const nav: { name: Page; icon: typeof Leaf }[] = [
    { name: "Overview", icon: Leaf },
    { name: "My requests", icon: ClipboardList },
    ...(organiser ? [{ name: "Manage drive" as Page, icon: Users }] : []),
    { name: "Collection guide", icon: ShieldCheck },
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Overview");
          }}
        >
          <div className="brand-mark">
            <Recycle size={24} />
          </div>
          <span>
            e-waste
            <br />
            <strong>
              together<span className="brand-dot">.</span>
            </strong>
          </span>
        </a>
        <div className="campus-label">
          <span className="campus-initials">II</span>
          <div>
            <strong>IIITM Gwalior</strong>
            <small>Campus community</small>
          </div>
        </div>
        <p className="nav-label">YOUR COMMUNITY</p>
        <nav aria-label="Main navigation">
          {nav.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={page === name ? "nav-item active" : "nav-item"}
              onClick={() => {
                setPage(name);
                setFilter("All requests");
              }}
              aria-current={page === name ? "page" : undefined}
            >
              <Icon size={18} />
              {name}
              {page === name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="leaf-circle">
            <Leaf size={19} />
          </span>
          <h3>
            Small items.
            <br />
            Shared effort.
          </h3>
          <p>
            A little coordination makes a campus collection easier to follow.
          </p>
          <span className="note-line" />
        </div>
        <div className="profile">
          <span className="avatar">
            {organiser ? "O" : persona === "neighbour" ? "K" : "A"}
          </span>
          <div>
            <strong>
              {isAws
                ? organiser
                  ? "Campus organiser"
                  : "Campus member"
                : organiser
                  ? "Demo organiser"
                  : persona === "neighbour"
                    ? "Kabir · demo"
                    : "Asha · demo"}
            </strong>
            <small>{organiser ? "Organiser" : "Resident"} workspace</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            Community <ChevronRight size={13} />
            <strong>{page}</strong>
          </div>
          <div className="top-actions">
            {!isAws && (
              <label className="persona">
                <span>Demo role</span>
                <select
                  aria-label="Demo role"
                  value={persona}
                  onChange={(e) => {
                    setPersona(e.target.value as keyof typeof demoActors);
                    setError("");
                    setNotice("");
                  }}
                >
                  <option value="resident">Resident · Asha</option>
                  <option value="neighbour">Resident · Kabir</option>
                  <option value="organiser">Organiser</option>
                </select>
              </label>
            )}
            <button
              className="icon-button"
              disabled={busy}
              onClick={refresh}
              aria-label="Refresh drive"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </header>
        <main id="main">
          <div className={`mode-banner ${isAws ? "cloud" : ""}`}>
            <span>
              <Sparkles size={15} />
              {isAws
                ? "AWS connected mode · campus access required"
                : "Demo workspace · all people, partner details and results are simulated"}
            </span>
            {!isAws && (
              <button onClick={() => setModal("reset")}>Reset demo</button>
            )}
          </div>
          {notice && (
            <div className="notice" role="status">
              <Check size={17} />
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
              <button onClick={refresh}>Refresh</button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <p className="eyebrow">A CLEANER CAMPUS, TOGETHER</p>
              <h1>
                {page === "Overview"
                  ? "Give your electronics a next step."
                  : page === "My requests"
                    ? organiser
                      ? "Every request, one place."
                      : "Your collection requests."
                    : page === "Manage drive"
                      ? "Coordinate the collection."
                      : "A little preparation goes a long way."}
              </h1>
              <p>
                {page === "Overview"
                  ? "Bring small quantities together. Follow the journey, from request to handover."
                  : page === "My requests"
                    ? "Keep track of what’s submitted, reviewed and actually received."
                    : page === "Manage drive"
                      ? "Prepare the batch, record partner confirmation and document what was received."
                      : "Keep your devices with you until a collection has been confirmed."}
              </p>
            </div>
            {!organiser && view?.drive.status === "Open" && (
              <button className="primary" onClick={() => setModal("submit")}>
                <Plus size={18} />
                Submit a request
              </button>
            )}
          </div>
          {!view ? (
            <div className="empty" aria-live="polite">
              {error
                ? "The drive could not be loaded. Check the message above."
                : "Loading your community…"}
            </div>
          ) : (
            <>
              {page === "Overview" && (
                <>
                  <section className="hero">
                    <div className="hero-copy">
                      <span className="hero-kicker">
                        <span className="live-dot" /> YOUR CAMPUS COLLECTION
                        DRIVE
                      </span>
                      <div className="hero-title">
                        <h2>
                          Less in a drawer.
                          <br />
                          More done together.
                        </h2>
                        <Badge>{status}</Badge>
                      </div>
                      <p>
                        Old phones, unused chargers, that laptop you’ve kept.
                        <br className="desktop-break" /> Add them to the shared
                        campus collection.
                      </p>
                      <div className="hero-details">
                        <span>
                          <MapPin size={16} />
                          {confirmed?.location ??
                            "IIITM Gwalior · location to be confirmed"}
                        </span>
                        <span>
                          <Clock3 size={16} />
                          {confirmed
                            ? displayDate(confirmed.date)
                            : `Proposed: ${displayDate(view.drive.proposedDate)}`}
                        </span>
                      </div>
                      <button
                        className="hero-button"
                        onClick={() => {
                          setPage(
                            organiser ? "Manage drive" : "Collection guide",
                          );
                        }}
                      >
                        {organiser
                          ? "Manage this drive"
                          : "How collection works"}
                        <ArrowRight size={17} />
                      </button>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <span className="art-orbit orbit-one" />
                      <span className="art-orbit orbit-two" />
                      <div className="art-leaf">
                        <Leaf size={31} />
                      </div>
                      <div className="art-laptop">
                        <div className="screen">
                          <Recycle size={62} strokeWidth={1.2} />
                          <span>ANOTHER CHAPTER</span>
                        </div>
                        <div className="keyboard" />
                      </div>
                      <div className="art-phone">
                        <Smartphone size={64} strokeWidth={1.2} />
                      </div>
                      <div className="art-cable">
                        <Cable size={44} />
                      </div>
                      <span className="art-spark">✳</span>
                      <div className="art-caption">COLLECT WITH CARE.</div>
                    </div>
                  </section>
                  <div className="section-title">
                    <h2>The drive at a glance</h2>
                    <span>
                      {view.demo
                        ? "Sample totals · excluded from real pilot results"
                        : "This campus drive"}
                    </span>
                  </div>
                  <section className="stats" aria-label="Drive metrics">
                    <Stat
                      icon={<ClipboardList size={19} />}
                      label="Items requested"
                      value={number(view.metrics.requestedItems)}
                      foot={`${view.metrics.requests} active requests`}
                    />
                    <Stat
                      icon={<Users size={19} />}
                      label="Participating accounts"
                      value={number(view.metrics.participants)}
                      foot="Accounts, not verified households"
                    />
                    <Stat
                      icon={<Package size={19} />}
                      label="Measured handover"
                      value={`${number(view.metrics.measuredKg)} kg`}
                      foot={`${view.metrics.receivedItems} items received`}
                    />
                    <Stat
                      icon={<FileCheck2 size={19} />}
                      label="Evidenced recycling"
                      value={`${number(view.metrics.recycledKg)} kg`}
                      foot={
                        view.metrics.recycledKg
                          ? "Downstream evidence recorded"
                          : "Awaiting downstream evidence"
                      }
                    />
                  </section>
                  <div className="overview-grid">
                    <section>
                      <div className="section-title">
                        <h2>
                          {organiser
                            ? "Requests to follow up"
                            : "Your recent requests"}
                        </h2>
                        <button
                          className="text-button"
                          onClick={() => setPage("My requests")}
                        >
                          View all
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      {ownRequests.length ? (
                        ownRequests.slice(0, 3).map(renderRequestCard)
                      ) : (
                        <Empty
                          action={() => setModal("submit")}
                          canSubmit={status === "Open"}
                        />
                      )}
                    </section>
                    <aside>
                      <div className="journey-panel">
                        <h3>One drive. Clear next steps.</h3>
                        <ol className="journey">
                          <li className="complete">
                            <span>1</span>
                            <div>
                              <strong>Submit your items</strong>
                              <p>Tell us what you have. Weight is optional.</p>
                            </div>
                          </li>
                          <li className={confirmed ? "complete" : "current"}>
                            <span>2</span>
                            <div>
                              <strong>Review & partner confirmation</strong>
                              <p>Eligibility, location and date are agreed.</p>
                            </div>
                          </li>
                          <li
                            className={
                              view.metrics.receivedItems ? "complete" : ""
                            }
                          >
                            <span>3</span>
                            <div>
                              <strong>Document the handover</strong>
                              <p>Record received items and measured weight.</p>
                            </div>
                          </li>
                          <li
                            className={
                              view.metrics.recycledKg ? "complete" : ""
                            }
                          >
                            <span>4</span>
                            <div>
                              <strong>Follow the evidence</strong>
                              <p>
                                Recycling is counted only with documentation.
                              </p>
                            </div>
                          </li>
                        </ol>
                      </div>
                      <div className="tip">
                        <ShieldCheck size={21} />
                        <div>
                          <strong>Your data stays yours to manage.</strong>
                          <p>
                            Back up and remove device data before handover. This
                            app cannot erase or certify your devices.
                          </p>
                        </div>
                      </div>
                    </aside>
                  </div>
                </>
              )}
              {page === "My requests" && (
                <>
                  <div className="filterbar">
                    <label>
                      Show{" "}
                      <select
                        aria-label="Filter requests"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        {[
                          "All requests",
                          "Needs review",
                          "Accepted",
                          "Assigned",
                          "Partial handover",
                          "Handed over",
                          "Withdrawn",
                          "Rejected",
                          "No show",
                          "Uncollected",
                        ].map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </label>
                    <span>
                      {list.length} {list.length === 1 ? "request" : "requests"}
                    </span>
                  </div>
                  <div className="requests-grid">
                    {list.map(renderRequestCard)}
                    {!list.length && (
                      <Empty
                        canSubmit={!organiser && status === "Open"}
                        action={() => setModal("submit")}
                      />
                    )}
                  </div>
                </>
              )}
              {page === "Manage drive" && organiser && (
                <DrivePanel
                  view={view}
                  busy={busy}
                  run={run}
                  setModal={setModal}
                  renderRequestCard={renderRequestCard}
                  attach={attach}
                  openFile={openFile}
                />
              )}
              {page === "Collection guide" && (
                <div className="guide-grid">
                  <Guide
                    icon={<ClipboardList />}
                    title="1. Tell us what you have"
                  >
                    Choose a category and item count. An estimated weight helps
                    planning, but “I don’t know” is fine. Add an item photo
                    after submitting if useful.
                  </Guide>
                  <Guide
                    icon={<ShieldCheck />}
                    title="2. Keep your items with you"
                  >
                    Requests need review and partner confirmation. The app does
                    not arrange unattended storage. Damaged batteries need the
                    partner’s specific handling instructions.
                  </Guide>
                  <Guide
                    icon={<MapPin />}
                    title="3. Follow confirmed instructions"
                  >
                    {confirmed
                      ? `Collection: ${displayDate(confirmed.date)} at ${confirmed.location}. ${confirmed.instructions}`
                      : "The current date and location are proposals. Confirmed collection instructions will appear once the organiser records partner acceptance."}
                  </Guide>
                  <Guide icon={<Laptop />} title="4. Prepare your device data">
                    Back up what you need. Sign out of accounts and remove
                    personal data according to the device manufacturer’s
                    instructions. This app does not erase devices or certify
                    data destruction.
                  </Guide>
                  <Guide icon={<Package />} title="5. Count what is received">
                    Handovers can be partial. Remaining items stay uncollected
                    until recorded. Estimates and measured weight are shown
                    separately.
                  </Guide>
                  <Guide
                    icon={<FileCheck2 />}
                    title="6. Follow downstream evidence"
                  >
                    Handover is a recorded transfer to the collection recipient.
                    Recycling totals stay at zero until a separate downstream
                    document supports them.
                  </Guide>
                  <section className="guide-card wide">
                    <h3>Categories for review</h3>
                    <p>{categories.join(" · ")}</p>
                    <p>
                      These are request categories. Final acceptance depends on
                      the collection partner; no recycler has been verified for
                      this prototype.
                    </p>
                  </section>
                </div>
              )}
            </>
          )}
          <footer>
            <span>
              <Recycle size={14} /> E-Waste Together · IIITM Gwalior
            </span>
            <span>Built for a shared next step.</span>
          </footer>
        </main>
      </div>
      {modal && (
        <Modal
          title={
            typeof modal === "object"
              ? `Record handover · ${modal.category}`
              : modal === "submit"
                ? "What electronics do you have?"
                : modal === "confirmation"
                  ? "Record partner confirmation"
                  : modal === "evidence"
                    ? "Add downstream recycling evidence"
                    : modal === "reset"
                      ? "Reset this demonstration?"
                      : modal === "cancel"
                        ? "Cancel the collection drive?"
                        : "Close the collection drive?"
          }
          close={() => {
            if (!busy) setModal(null);
          }}
        >
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {modal === "submit" && (
            <RequestForm
              busy={busy}
              demo={Boolean(view?.demo)}
              onSubmit={submit}
            />
          )}
          {modal === "confirmation" && (
            <ConfirmationForm
              busy={busy}
              demo={Boolean(view?.demo)}
              onSubmit={confirm}
            />
          )}
          {typeof modal === "object" && (
            <HandoverForm
              busy={busy}
              request={modal}
              onSubmit={(e) => handover(e, modal)}
            />
          )}
          {modal === "evidence" && (
            <EvidenceForm
              busy={busy}
              demo={Boolean(view?.demo)}
              metrics={view!.metrics}
              onSubmit={evidence}
            />
          )}
          {modal === "reset" && (
            <>
              <p>
                This removes the saved demo workflow in this browser and
                restores the sample requests. It does not affect AWS records.
              </p>
              <button
                className="primary full"
                onClick={() => {
                  resetDemo();
                  setModal(null);
                  setNotice("Sample requests restored.");
                  setError("");
                  void refresh();
                }}
              >
                Reset sample workflow
              </button>
            </>
          )}
          {(modal === "cancel" || modal === "close") && (
            <>
              <p>
                {modal === "cancel"
                  ? "Residents should retain items and wait for new arrangements. Existing handovers and evidence stay recorded."
                  : "Remaining assigned requests will be marked uncollected. Partial handovers remain partial; only received items count."}
              </p>
              <button
                className="primary full"
                disabled={busy}
                onClick={async () => {
                  if (
                    await run(
                      {
                        type: "drive",
                        status: modal === "cancel" ? "Cancelled" : "Closed",
                      },
                      modal === "cancel"
                        ? "Drive cancelled. Existing handovers remain recorded."
                        : "Drive closed. Uncollected items were preserved.",
                    )
                  )
                    setModal(null);
                }}
              >
                {modal === "cancel" ? "Cancel drive" : "Close drive"}
              </button>
            </>
          )}
        </Modal>
      )}
      {preview && (
        <Modal title={preview.name} close={() => setPreview(undefined)}>
          <p>
            The file is accessible to the authorised audience for this record.
          </p>
          <a
            className="primary full"
            href={preview.url}
            download={preview.name}
            target="_blank"
            rel="noreferrer"
          >
            <ArrowDownToLine size={17} />
            Open / download file
          </a>
        </Modal>
      )}
    </div>
  );
}
