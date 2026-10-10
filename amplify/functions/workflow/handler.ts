import type { AppSyncResolverEvent, AppSyncIdentityCognito } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { reserveUploadSlot } from "./upload-quota";
import {
  applyCommand,
  attachmentTarget,
  attachmentUploadTarget,
  checkActor,
  COMMUNITY,
  DomainError,
  initialState,
  textField,
  validateAttachment,
  viewFor,
  type Actor,
  type Attachment,
  type Command,
  type State,
} from "../../../shared/domain";
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({});
const maxBytes = 5 * 1024 * 1024;
interface Args {
  payload?: string;
  actionId?: string;
  revision?: number;
}
export function actorFromIdentity(
  identity: AppSyncResolverEvent<Args>["identity"],
): Actor {
  const who = identity as AppSyncIdentityCognito | undefined;
  if (!who?.sub || !who.claims) throw new DomainError("Sign in to continue.");
  const rawGroups: unknown = who.claims["cognito:groups"];
  const groups = Array.isArray(rawGroups) ? rawGroups : [];
  if (!groups.includes("IIITM_MEMBERS") && !groups.includes("IIITM_ORGANISERS"))
    throw new DomainError("You are not an admitted member of this community.");
  const actor: Actor = {
    id: who.sub,
    role: groups.includes("IIITM_ORGANISERS") ? "organiser" : "resident",
    community: COMMUNITY,
  };
  checkActor(actor);
  return actor;
}
function parsePayload(value: string | undefined) {
  if (!value || Buffer.byteLength(value) > 12000)
    throw new DomainError("Invalid or oversized action.");
  try {
    return JSON.parse(value);
  } catch {
    throw new DomainError("Invalid action format.");
  }
}
async function verifyStoredFile(attachment: Attachment) {
  validateAttachment(attachment);
  const pendingKey = attachment.key.replace(/^private\//, "pending/");
  let head;
  try {
    head = await s3.send(
      new HeadObjectCommand({
        Bucket: process.env.FILES_BUCKET!,
        Key: pendingKey,
      }),
    );
  } catch {
    throw new DomainError("The uploaded file is unavailable. Upload it again.");
  }
  if (
    !head.ContentLength ||
    head.ContentLength > maxBytes ||
    head.ContentType !== attachment.type
  )
    throw new DomainError(
      "The uploaded file does not match the allowed size or type.",
    );
  // Signed POSTs can only write pending/. Promote a validated upload before
  // publishing its reference, so replaying the POST cannot replace a saved file.
  // An uncertain database write may leave a private copy for manual reconciliation.
  await s3.send(
    new CopyObjectCommand({
      Bucket: process.env.FILES_BUCKET!,
      Key: attachment.key,
      CopySource: `${process.env.FILES_BUCKET!}/${pendingKey}`,
    }),
  );
}
export const handler = async (
  event: AppSyncResolverEvent<Args>,
): Promise<string> => {
  try {
    const actor = actorFromIdentity(event.identity);
    const response = await db.send(
      new GetCommand({
        TableName: process.env.STATE_TABLE!,
        Key: { id: COMMUNITY },
        ConsistentRead: true,
      }),
    );
    const state = (response.Item?.state ?? initialState(false)) as State;
    if (event.info.fieldName === "dashboard")
      return JSON.stringify({ ok: true, view: viewFor(state, actor) });
    if (event.info.fieldName === "fileAccess") {
      const payload = parsePayload(event.arguments.payload);
      if (!payload || typeof payload !== "object")
        throw new DomainError("Invalid file request.");
      attachmentTarget(state, actor, payload.target, payload.recordId);
      if (payload.operation === "upload") {
        attachmentUploadTarget(state, actor, payload.target, payload.recordId);
        const type = payload.contentType;
        if (
          !["image/jpeg", "image/png", "application/pdf"].includes(type) ||
          (payload.target === "photo" && type === "application/pdf")
        )
          throw new DomainError("Choose a JPEG, PNG or PDF file.");
        const name = textField(payload.name, "File name", 120);
        // Authorise and validate before consuming quota; reserve before signing.
        // A signing failure consumes its slot conservatively (no unsafe refund).
        await reserveUploadSlot(db, actor.id);
        const key = `private/${payload.target}/${payload.recordId}/${randomUUID()}`;
        const post = await createPresignedPost(s3, {
          Bucket: process.env.FILES_BUCKET!,
          Key: key.replace(/^private\//, "pending/"),
          Expires: 120,
          Fields: { "Content-Type": type },
          Conditions: [
            ["content-length-range", 1, maxBytes],
            ["eq", "$Content-Type", type],
          ],
        });
        return JSON.stringify({
          ok: true,
          post,
          attachment: {
            key,
            type,
            name,
          },
        });
      }
      if (payload.operation === "read") {
        const file =
          payload.target === "photo"
            ? state.requests.find((r) => r.id === payload.recordId)?.photo
            : payload.target === "receipt"
              ? state.handovers.find((h) => h.id === payload.recordId)?.receipt
              : state.evidence.find((e) => e.id === payload.evidenceId)
                  ?.document;
        if (!file) throw new DomainError("No file attached to this record.");
        return JSON.stringify({
          ok: true,
          url: await getSignedUrl(
            s3,
            new GetObjectCommand({
              Bucket: process.env.FILES_BUCKET!,
              Key: file.key,
              ResponseContentDisposition: "attachment",
            }),
            { expiresIn: 120 },
          ),
        });
      }
      throw new DomainError("Invalid file operation.");
    }
    if (event.info.fieldName !== "act")
      throw new DomainError("Unsupported operation.");
    const command = parsePayload(event.arguments.payload) as Command;
    // Authorise the full command before querying S3 or persisting anything.
    const next = applyCommand(
      state,
      actor,
      command,
      event.arguments.actionId!,
      event.arguments.revision!,
    );
    if (next !== state) {
      if (Buffer.byteLength(JSON.stringify(next)) > 340000)
        throw new DomainError(
          "Pilot storage limit reached. Ask the administrator to export records.",
        );
      if (command.type === "attach") await verifyStoredFile(command.attachment);
      if (command.type === "evidence") await verifyStoredFile(command.document);
      await db.send(
        new PutCommand({
          TableName: process.env.STATE_TABLE!,
          Item: { id: COMMUNITY, revision: next.revision, state: next },
          ConditionExpression: response.Item
            ? "revision = :revision"
            : "attribute_not_exists(id)",
          ...(response.Item
            ? { ExpressionAttributeValues: { ":revision": state.revision } }
            : {}),
        }),
      );
    }
    return JSON.stringify({ ok: true, view: viewFor(next, actor) });
  } catch (error) {
    if (error instanceof DomainError)
      return JSON.stringify({ ok: false, error: error.message });
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    )
      return JSON.stringify({
        ok: false,
        error: "This drive changed. Refresh and try again.",
      });
    // Never log input payloads, Cognito claims, private records or signed URLs.
    console.error(
      "Workflow error",
      error instanceof Error ? error.name : "UnknownError",
    );
    return JSON.stringify({
      ok: false,
      error:
        "The service could not complete this action. Refresh and try again.",
    });
  }
};
