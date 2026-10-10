import {
  TransactWriteCommand,
  type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { createHash, randomUUID } from "node:crypto";
import { COMMUNITY, DomainError } from "../../../shared/domain";

export const MEMBER_UPLOAD_LIMIT = 10;
export const MEMBER_WINDOW_SECONDS = 15 * 60;
export const COMMUNITY_UPLOAD_LIMIT = 200;
const DAY_SECONDS = 24 * 60 * 60;
const RETENTION_SECONDS = 2 * DAY_SECONDS;

// Fixed server-clock windows do not depend on DynamoDB's asynchronous TTL deletion.
// These small quota rows are separate from the single workflow-state item.
export async function reserveUploadSlot(
  db: DynamoDBDocumentClient,
  actorId: string,
  now = Date.now(),
) {
  const seconds = Math.floor(now / 1000);
  const memberWindow = Math.floor(seconds / MEMBER_WINDOW_SECONDS);
  const communityWindow = Math.floor(seconds / DAY_SECONDS);
  const actorHash = createHash("sha256").update(actorId).digest("hex");
  const counters = [
    {
      id: `upload-quota/${COMMUNITY}/member/${actorHash}/${memberWindow}`,
      limit: MEMBER_UPLOAD_LIMIT,
      end: (memberWindow + 1) * MEMBER_WINDOW_SECONDS,
    },
    {
      id: `upload-quota/${COMMUNITY}/day/${communityWindow}`,
      limit: COMMUNITY_UPLOAD_LIMIT,
      end: (communityWindow + 1) * DAY_SECONDS,
    },
  ];
  try {
    await db.send(
      new TransactWriteCommand({
        // SDK retries of this transaction reserve the same slot, not another one.
        ClientRequestToken: randomUUID(),
        TransactItems: counters.map((counter) => ({
          Update: {
            TableName: process.env.STATE_TABLE!,
            Key: { id: counter.id },
            UpdateExpression:
              "SET #used = if_not_exists(#used, :zero) + :one, #expires = :expires",
            ConditionExpression:
              "attribute_not_exists(#used) OR #used < :limit",
            ExpressionAttributeNames: {
              "#used": "used",
              "#expires": "expiresAt",
            },
            ExpressionAttributeValues: {
              ":zero": 0,
              ":one": 1,
              ":limit": counter.limit,
              ":expires": counter.end + RETENTION_SECONDS,
            },
          },
        })),
      }),
    );
  } catch (error) {
    const reasons = (
      error as {
        CancellationReasons?: { Code?: string }[];
      } | null
    )?.CancellationReasons;
    if (
      error instanceof Error &&
      error.name === "TransactionCanceledException" &&
      Array.isArray(reasons) &&
      reasons.some((reason) => reason.Code === "ConditionalCheckFailed")
    ) {
      throw new DomainError(
        "Upload-link limit reached: 10 per account per 15-minute window and 200 per community per UTC day. Wait for the next window or contact the organiser.",
      );
    }
    // Fail closed on outages/conflicts; no signed link is issued without a slot.
    throw error;
  }
}
