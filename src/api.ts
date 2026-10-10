import { applyCommand, viewFor, type Actor, type Attachment, type Command, type State, type View } from '../shared/domain';
import { seed } from '../shared/seed';
import type { Schema } from '../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
export const isAws = import.meta.env.VITE_DATA_MODE === 'aws';
const storageKey = 'e-waste-together:demo:v1';
let client: ReturnType<typeof generateClient<Schema>>;
export async function configureCloud() {
  const outputs = import.meta.glob<Record<string, unknown>>('../amplify_outputs.json', { eager: true, import: 'default' });
  if (!outputs['../amplify_outputs.json']) throw new Error('AWS mode needs amplify_outputs.json. Generate it through an Amplify sandbox or branch deployment.');
  const { Amplify } = await import('aws-amplify');
  Amplify.configure(outputs['../amplify_outputs.json']);
  client = generateClient<Schema>({ authMode: 'userPool' });
}
export async function cloudActor(): Promise<Actor> {
  const { fetchAuthSession } = await import('aws-amplify/auth');
  const claims = (await fetchAuthSession()).tokens?.idToken?.payload;
  if (!claims?.sub) throw new Error('Sign in to continue.');
  const groups = claims['cognito:groups'] as string[] | undefined;
  if (!groups?.some(g => ['IIITM_MEMBERS', 'IIITM_ORGANISERS'].includes(g))) throw new Error('Your account is awaiting campus admission. Ask the organiser to add you to IIITM_MEMBERS, then sign out and sign in again.');
  return { id: claims.sub, role: groups.includes('IIITM_ORGANISERS') ? 'organiser' : 'resident', community: 'iiitm-gwalior' };
}
function localState(): State {
  const raw = localStorage.getItem(storageKey);
  if (raw) {
    try { const s = JSON.parse(raw) as State; if (s.demo && Array.isArray(s.requests) && typeof s.revision === 'number') return s; } catch { /* Show a recoverable error, never silently lose saved work. */ }
    throw new Error('Saved demo data could not be read. Use Reset demo to start again.');
  }
  const s = seed(); localStorage.setItem(storageKey, JSON.stringify(s)); return s;
}
function unpack(data: string | null | undefined, errors?: readonly { message: string }[]) {
  if (errors?.length || !data) throw new Error(errors?.[0]?.message ?? 'The service returned no data. Refresh and try again.');
  const result = JSON.parse(data);
  if (!result.ok) throw new KnownActionError(result.error);
  return result;
}
class KnownActionError extends Error {}
export async function loadView(actor: Actor): Promise<View> {
  if (!isAws) return viewFor(localState(), actor);
  const { data, errors } = await client.queries.dashboard(); return unpack(data, errors).view;
}
const pending = new Map<string, { id: string; revision: number }>();
export async function execute(actor: Actor, command: Command, revision: number): Promise<View> {
  const fingerprint = `${actor.id}:${JSON.stringify(command)}`;
  const attempt = pending.get(fingerprint) ?? { id: crypto.randomUUID(), revision };
  pending.set(fingerprint, attempt);
  try {
    let view: View;
    if (!isAws) {
      const next = applyCommand(localState(), actor, command, attempt.id, attempt.revision);
      localStorage.setItem(storageKey, JSON.stringify(next)); view = viewFor(next, actor);
    } else {
      const { data, errors } = await client.mutations.act({ payload: JSON.stringify(command), actionId: attempt.id, revision: attempt.revision });
      view = unpack(data, errors).view;
    }
    pending.delete(fingerprint); return view;
  } catch (error) {
    if (!isAws || error instanceof KnownActionError) pending.delete(fingerprint);
    // Preserve action ID on uncertain network failures so retry does not double-count.
    throw error;
  }
}
export function resetDemo() {
  localStorage.removeItem(storageKey);
  Object.keys(localStorage).filter(key => key.startsWith('demo-file:')).forEach(key => localStorage.removeItem(key));
  pending.clear();
}
async function fileCall(payload: object) {
  const { data, errors } = await client.mutations.fileAccess({ payload: JSON.stringify(payload) }); return unpack(data, errors);
}
export async function uploadFile(target: 'photo' | 'receipt' | 'evidence', recordId: string, file: File): Promise<Attachment> {
  if (file.size <= 0 || file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) || (target === 'photo' && file.type === 'application/pdf')) throw new Error('Choose a JPEG or PNG photo, or a PDF receipt, up to 5 MB.');
  if (!isAws) {
    if (file.size > 500 * 1024) throw new Error('The local demo stores files in this browser. Choose a file smaller than 500 KB; AWS supports up to 5 MB.');
    const key = `private/${target}/${recordId}/${crypto.randomUUID()}`;
    const content = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = () => reject(new Error('File could not be read.')); r.readAsDataURL(file); });
    localStorage.setItem(`demo-file:${key}`, content); return { key, name: file.name, type: file.type };
  }
  const result = await fileCall({ operation: 'upload', target, recordId, name: file.name, contentType: file.type });
  const form = new FormData(); Object.entries(result.post.fields).forEach(([key, value]) => form.append(key, String(value))); form.append('file', file);
  const response = await fetch(result.post.url, { method: 'POST', body: form });
  if (!response.ok) throw new Error('Upload failed. Your other records are saved; try this upload again.');
  return result.attachment;
}
export async function fileUrl(target: 'photo' | 'receipt' | 'evidence', recordId: string, file: Attachment, evidenceId?: string): Promise<string> {
  if (!isAws) { const content = localStorage.getItem(`demo-file:${file.key}`); if (!content) throw new Error('This sample file is not stored in this browser.'); return content; }
  return (await fileCall({ operation: 'read', target, recordId, evidenceId })).url;
}
