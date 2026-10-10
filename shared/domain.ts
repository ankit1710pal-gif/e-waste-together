export const COMMUNITY = 'iiitm-gwalior';
export const categories = ['Phones', 'Computers', 'Cables & chargers', 'Small electronics', 'Batteries'] as const;
export type Category = typeof categories[number];
export type Role = 'resident' | 'organiser';
export interface Actor { id: string; role: Role; community: string }
export type RequestStatus = 'Submitted' | 'Needs clarification' | 'Accepted' | 'Rejected' | 'Assigned' | 'Partial handover' | 'Handed over' | 'Withdrawn' | 'No show' | 'Uncollected';
export type DriveStatus = 'Draft' | 'Open' | 'Awaiting confirmation' | 'Confirmed' | 'Closed' | 'Cancelled';
export interface Attachment { key: string; type: string; name: string }
export interface RequestRecord {
  id: string; owner: string; category: Category; count: number; estimatedKg?: number;
  contact: string; note: string; status: RequestStatus; reviewNote: string; received: number;
  createdAt: string; photo?: Attachment;
}
export interface Confirmation {
  partner: string; source: string; confirmedAt: string; date: string; location: string;
  fees: string; instructions: string; accepted: Category[];
}
export interface Handover { id: string; requestId: string; count: number; kg: number; recipient: string; date: string; receipt?: Attachment }
export interface Evidence { id: string; kg: number; source: string; date: string; document: Attachment }
export interface Audit { at: string; actor: string; action: string }
export interface State {
  revision: number; demo: boolean; drive: { status: DriveStatus; proposedDate: string; confirmation?: Confirmation };
  requests: RequestRecord[]; handovers: Handover[]; evidence: Evidence[]; audit: Audit[];
  processed: Record<string, string>;
}
export interface Metrics { requests: number; participants: number; requestedItems: number; estimatedKg: number; confirmedItems: number; receivedItems: number; measuredKg: number; recycledKg: number }
export interface View { revision: number; demo: boolean; drive: State['drive']; requests: RequestRecord[]; handovers: Handover[]; evidence: Evidence[]; audit: Audit[]; metrics: Metrics }
export type Command =
  | { type: 'submit'; category: Category; count: number; estimatedKg?: number; contact: string; note: string }
  | { type: 'withdraw'; requestId: string }
  | { type: 'review'; requestId: string; status: 'Accepted' | 'Needs clarification' | 'Rejected'; note: string }
  | { type: 'assign'; requestId: string }
  | { type: 'drive'; status: 'Open' | 'Awaiting confirmation' | 'Closed' | 'Cancelled'; proposedDate?: string }
  | { type: 'confirm'; confirmation: Confirmation }
  | { type: 'handover'; requestId: string; count: number; kg: number; recipient: string; date: string }
  | { type: 'noShow'; requestId: string }
  | { type: 'attach'; target: 'photo' | 'receipt'; recordId: string; attachment: Attachment }
  | { type: 'evidence'; kg: number; source: string; date: string; document: Attachment };

export class DomainError extends Error { constructor(message: string) { super(message); this.name = 'DomainError'; } }
function requireThat(ok: unknown, message: string): asserts ok { if (!ok) throw new DomainError(message); }
export function textField(value: unknown, label: string, max = 500, optional = false): string {
  requireThat(typeof value === 'string' && value.length <= max && (optional || value.trim().length > 0), `${label} is required and must be at most ${max} characters.`);
  return value.trim();
}
function numeric(value: unknown, label: string, max: number, integer = false): number {
  requireThat(typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max && (!integer || Number.isInteger(value)), `${label} must be a valid ${integer ? 'whole ' : ''}number between 0 and ${max}.`);
  return value;
}
function dateField(value: unknown, label: string): string {
  const date = textField(value, label, 40);
  requireThat(Number.isFinite(Date.parse(date)), `${label} must be a valid date.`);
  return date;
}
export function checkActor(actor: Actor) {
  requireThat(actor && actor.community === COMMUNITY && typeof actor.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(actor.id) && ['resident', 'organiser'].includes(actor.role), 'You are not an admitted member of this community.');
}
export function initialState(demo = false): State {
  return { revision: 0, demo, drive: { status: 'Open', proposedDate: '' }, requests: [], handovers: [], evidence: [], audit: [], processed: {} };
}
export function metrics(state: State): Metrics {
  const active = state.requests.filter(r => !['Withdrawn', 'Rejected'].includes(r.status));
  return {
    requests: active.length, participants: new Set(active.map(r => r.owner)).size,
    requestedItems: active.reduce((n, r) => n + r.count, 0), estimatedKg: active.reduce((n, r) => n + (r.estimatedKg ?? 0), 0),
    confirmedItems: state.drive.confirmation ? state.requests.filter(r => ['Assigned', 'Partial handover', 'Handed over', 'No show', 'Uncollected'].includes(r.status)).reduce((n, r) => n + r.count, 0) : 0,
    receivedItems: state.handovers.reduce((n, h) => n + h.count, 0), measuredKg: state.handovers.reduce((n, h) => n + h.kg, 0), recycledKg: state.evidence.reduce((n, e) => n + e.kg, 0),
  };
}
export function viewFor(state: State, actor: Actor): View {
  checkActor(actor);
  const requests = state.requests.filter(r => actor.role === 'organiser' || r.owner === actor.id);
  const ids = new Set(requests.map(r => r.id));
  const handovers = state.handovers.filter(h => ids.has(h.requestId)).map(h => actor.role === 'organiser' ? h : { ...h, receipt: undefined });
  return structuredClone({ revision: state.revision, demo: state.demo, drive: state.drive, requests, handovers,
    evidence: actor.role === 'organiser' ? state.evidence : [], audit: actor.role === 'organiser' ? state.audit : [], metrics: metrics(state) });
}
export function attachmentTarget(state: State, actor: Actor, target: string, recordId: string) {
  checkActor(actor);
  if (target === 'photo') {
    const r = state.requests.find(r => r.id === recordId);
    requireThat(r && (actor.role === 'organiser' || r.owner === actor.id), 'Request unavailable.');
  } else if (target === 'receipt') {
    requireThat(actor.role === 'organiser' && state.handovers.some(h => h.id === recordId), 'Handover unavailable.');
  } else if (target === 'evidence') { requireThat(actor.role === 'organiser' && recordId === 'drive', 'Organiser access required.'); }
  else throw new DomainError('Invalid file target.');
}
export function validateAttachment(value: Attachment) {
  requireThat(value && /^private\/(photo|receipt|evidence)\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+$/.test(value.key), 'Invalid file reference.');
  requireThat(['image/jpeg', 'image/png', 'application/pdf'].includes(value.type), 'Only JPEG, PNG and PDF files are allowed.');
  textField(value.name, 'File name', 120);
}
export function applyCommand(original: State, actor: Actor, command: Command, id: string, expectedRevision: number, now = new Date().toISOString()): State {
  checkActor(actor);
  requireThat(typeof id === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(id), 'Invalid action identifier.');
  // Idempotency is retained for this bounded pilot; old IDs are never evicted.
  const actionKey = `${actor.id}:${id}`;
  if (original.processed[actionKey]) { requireThat(original.processed[actionKey] === JSON.stringify(command), 'Action identifier already used for a different action.'); return original; }
  requireThat(Object.keys(original.processed).length < 1000, 'Pilot action limit reached. Export records and start a new drive with an administrator.');
  requireThat(expectedRevision === original.revision, 'This drive changed. Refresh and try again.');
  requireThat(command && typeof command.type === 'string', 'Invalid action.');
  const state = structuredClone(original);
  const recordId = `${actor.id}-${id}`;
  const admin = () => requireThat(actor.role === 'organiser', 'Organiser access required.');
  const getRequest = (requestId: string) => {
    const r = state.requests.find(r => r.id === requestId);
    requireThat(r && (actor.role === 'organiser' || r.owner === actor.id), 'Request unavailable.');
    return r;
  };
  switch (command.type) {
    case 'submit': {
      requireThat(state.drive.status === 'Open', 'Requests are accepted only while the drive is open.');
      requireThat(state.requests.length < 100, 'This pilot is limited to 100 requests.');
      requireThat(categories.includes(command.category), 'Choose a supported category.');
      const count = numeric(command.count, 'Item count', 100, true); requireThat(count > 0, 'Item count must be at least 1.');
      const estimatedKg = command.estimatedKg === undefined ? undefined : numeric(command.estimatedKg, 'Estimated weight', 1000);
      state.requests.unshift({ id: recordId, owner: actor.id, category: command.category, count, estimatedKg,
        contact: textField(command.contact, 'Contact preference', 200), note: textField(command.note, 'Item notes', 500, true),
        status: 'Submitted', reviewNote: '', received: 0, createdAt: now }); break;
    }
    case 'withdraw': {
      const r = getRequest(command.requestId);
      requireThat(r.owner === actor.id, 'Only the resident can withdraw their request.');
      requireThat(['Submitted', 'Accepted', 'Needs clarification', 'Assigned'].includes(r.status) && !['Confirmed', 'Closed', 'Cancelled'].includes(state.drive.status), 'This request can no longer be withdrawn. Contact the organiser.');
      r.status = 'Withdrawn'; break;
    }
    case 'review': {
      admin(); const r = getRequest(command.requestId);
      requireThat(['Open', 'Awaiting confirmation'].includes(state.drive.status) && ['Submitted', 'Accepted', 'Needs clarification'].includes(r.status), 'This request cannot be reviewed at this stage.');
      requireThat(['Accepted', 'Needs clarification', 'Rejected'].includes(command.status), 'Invalid review result.');
      r.reviewNote = textField(command.note, 'Review note', 500, command.status === 'Accepted'); r.status = command.status; break;
    }
    case 'assign': {
      admin(); const r = getRequest(command.requestId);
      requireThat(['Open', 'Awaiting confirmation'].includes(state.drive.status) && r.status === 'Accepted', 'Accept this request before assigning it to the batch.');
      r.status = 'Assigned'; break;
    }
    case 'drive': {
      admin(); const transitions: Record<DriveStatus, string[]> = { Draft: ['Open', 'Cancelled'], Open: ['Awaiting confirmation', 'Cancelled'], 'Awaiting confirmation': ['Open', 'Cancelled'], Confirmed: ['Closed', 'Cancelled'], Closed: [], Cancelled: [] };
      requireThat(transitions[state.drive.status].includes(command.status), 'Invalid drive transition.');
      if (command.status === 'Awaiting confirmation') requireThat(state.requests.some(r => r.status === 'Assigned'), 'Assign at least one accepted request first.');
      if (command.proposedDate !== undefined) state.drive.proposedDate = command.proposedDate ? dateField(command.proposedDate, 'Proposed date') : '';
      if (['Cancelled', 'Closed'].includes(command.status)) state.requests.forEach(r => { if (r.status === 'Assigned') r.status = command.status === 'Closed' ? 'Uncollected' : 'Accepted'; });
      state.drive.status = command.status; break;
    }
    case 'confirm': {
      admin(); requireThat(state.drive.status === 'Awaiting confirmation', 'Request partner confirmation after preparing the batch.');
      const c = command.confirmation; requireThat(c && Array.isArray(c.accepted) && c.accepted.length > 0 && c.accepted.every(x => categories.includes(x)), 'Select the partner’s accepted categories.');
      requireThat(state.requests.filter(r => r.status === 'Assigned').every(r => c.accepted.includes(r.category)), 'The partner must accept every assigned category.');
      state.drive.confirmation = { partner: textField(c.partner, 'Partner', 120), source: textField(c.source, 'Confirmation source', 300), confirmedAt: dateField(c.confirmedAt, 'Confirmation timestamp'),
        date: dateField(c.date, 'Collection date'), location: textField(c.location, 'Collection location', 200), fees: textField(c.fees, 'Fees / terms', 200), instructions: textField(c.instructions, 'Instructions', 500), accepted: [...new Set(c.accepted)] };
      state.drive.status = 'Confirmed'; break;
    }
    case 'handover': {
      admin(); const r = getRequest(command.requestId);
      requireThat(state.drive.status === 'Confirmed' && ['Assigned', 'Partial handover'].includes(r.status), 'Handover requires a confirmed drive and assigned items.');
      const count = numeric(command.count, 'Received count', 100, true); requireThat(count > 0 && count <= r.count - r.received, 'Received count exceeds the remaining items.');
      const kg = numeric(command.kg, 'Measured kilograms', 1000);
      state.handovers.push({ id: recordId, requestId: r.id, count, kg, recipient: textField(command.recipient, 'Recipient', 120), date: dateField(command.date, 'Handover date') });
      r.received += count; r.status = r.received === r.count ? 'Handed over' : 'Partial handover'; break;
    }
    case 'noShow': {
      admin(); const r = getRequest(command.requestId);
      requireThat(state.drive.status === 'Confirmed' && r.status === 'Assigned' && r.received === 0, 'Only an uncollected assigned request can be marked no-show.'); r.status = 'No show'; break;
    }
    case 'attach': {
      requireThat(['photo', 'receipt'].includes(command.target), 'Invalid attachment target.');
      attachmentTarget(state, actor, command.target, command.recordId); validateAttachment(command.attachment);
      requireThat(command.attachment.key.startsWith(`private/${command.target}/${command.recordId}/`), 'File does not belong to this record.');
      if (command.target === 'photo') { requireThat(command.attachment.type !== 'application/pdf', 'Item photos must be JPEG or PNG.'); getRequest(command.recordId).photo = command.attachment; }
      else state.handovers.find(h => h.id === command.recordId)!.receipt = command.attachment;
      break;
    }
    case 'evidence': {
      admin(); requireThat(state.handovers.length > 0, 'Record a handover before downstream recycling evidence.');
      validateAttachment(command.document); requireThat(command.document.key.startsWith('private/evidence/drive/'), 'Invalid recycling evidence file.');
      const kg = numeric(command.kg, 'Evidenced kilograms', 1000); const totals = metrics(state);
      requireThat(kg > 0 && totals.recycledKg + kg <= totals.measuredKg + 1e-8, 'Evidenced kilograms must not exceed measured handover weight.');
      state.evidence.push({ id: recordId, kg, source: textField(command.source, 'Recycling evidence source', 300), date: dateField(command.date, 'Evidence date'), document: command.document }); break;
    }
    default: throw new DomainError('Unsupported action.');
  }
  state.revision++;
  state.processed[actionKey] = JSON.stringify(command);
  state.audit.push({ at: now, actor: actor.id, action: command.type });
  return state;
}
