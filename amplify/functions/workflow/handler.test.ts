import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppSyncResolverEvent } from "aws-lambda";
import { initialState, type State } from "../../../shared/domain";
const { dbSend, s3Send, post, signed } = vi.hoisted(() => ({
  dbSend: vi.fn(),
  s3Send: vi.fn(),
  post: vi.fn(),
  signed: vi.fn(),
}));
vi.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: { from: () => ({ send: dbSend }) },
  GetCommand: class {
    kind = "get";
    constructor(public input: unknown) {}
  },
  PutCommand: class {
    kind = "put";
    constructor(public input: unknown) {}
  },
  TransactWriteCommand: class {
    kind = "transact";
    constructor(public input: unknown) {}
  },
}));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = s3Send;
  },
  HeadObjectCommand: class {
    constructor(public input: unknown) {}
  },
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
  CopyObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));
vi.mock("@aws-sdk/s3-presigned-post", () => ({ createPresignedPost: post }));
vi.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl: signed }));
import { actorFromIdentity, handler } from "./handler";
import { MEMBER_UPLOAD_LIMIT, COMMUNITY_UPLOAD_LIMIT } from "./upload-quota";
let saved: State | undefined;
let uploadCounts: Map<string, number>;
interface TestCounter {
  Key: { id: string };
  ExpressionAttributeValues: Record<string, number>;
}
const residentIdentity = {
  sub: "sample-resident",
  claims: { "cognito:groups": ["IIITM_MEMBERS"] },
} as AppSyncResolverEvent<unknown>["identity"];
const organiserIdentity = {
  sub: "sample-organiser",
  claims: { "cognito:groups": ["IIITM_ORGANISERS"] },
} as AppSyncResolverEvent<unknown>["identity"];
function event(fieldName: string, args = {}, identity = residentIdentity) {
  return {
    identity,
    arguments: args,
    info: { fieldName },
  } as AppSyncResolverEvent<{
    payload?: string;
    actionId?: string;
    revision?: number;
  }>;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-10T12:01:00Z"));
  process.env.STATE_TABLE = "test-state-table";
  saved = undefined;
  uploadCounts = new Map();
  dbSend.mockImplementation(async (command) => {
    if (command.kind === "get")
      return {
        Item: saved ? { state: saved, revision: saved.revision } : undefined,
      };
    if (command.kind === "transact") {
      // Model DynamoDB's all-or-nothing conditional updates, including races.
      const counters: TestCounter[] = command.input.TransactItems.map(
        (item: { Update: TestCounter }) => item.Update,
      );
      const reasons = counters.map((counter) => ({
        Code:
          (uploadCounts.get(counter.Key.id) ?? 0) >=
          counter.ExpressionAttributeValues[":limit"]
            ? "ConditionalCheckFailed"
            : "None",
      }));
      if (reasons.some((reason: { Code: string }) => reason.Code !== "None"))
        throw Object.assign(new Error("Quota rejected"), {
          name: "TransactionCanceledException",
          CancellationReasons: reasons,
        });
      for (const counter of counters)
        uploadCounts.set(
          counter.Key.id,
          (uploadCounts.get(counter.Key.id) ?? 0) + 1,
        );
      return {};
    }
    saved = command.input.Item.state;
    return {};
  });
  post.mockResolvedValue({ url: "https://example.invalid", fields: {} });
  signed.mockResolvedValue("https://example.invalid/private");
  s3Send.mockResolvedValue({ ContentLength: 100, ContentType: "image/png" });
});
afterEach(() => vi.restoreAllMocks());
async function preparePhotoRequest() {
  await handler(
    event("act", {
      payload: JSON.stringify(submit),
      actionId: "submit-action-001",
      revision: 0,
    }),
  );
  return saved!.requests[0].id;
}
function uploadEvent(
  identity = residentIdentity,
  recordId = saved!.requests[0].id,
) {
  return event(
    "fileAccess",
    {
      payload: JSON.stringify({
        operation: "upload",
        target: "photo",
        recordId,
        contentType: "image/png",
        name: "sample.png",
      }),
    },
    identity,
  );
}
describe("Upload quotas and uncertain attachment writes", () => {
  it("bounds simultaneous upload-link requests per account before signing", async () => {
    await preparePhotoRequest();
    const results = await Promise.all(
      Array.from({ length: MEMBER_UPLOAD_LIMIT + 5 }, () =>
        handler(uploadEvent()).then(JSON.parse),
      ),
    );
    expect(results.filter((result) => result.ok)).toHaveLength(
      MEMBER_UPLOAD_LIMIT,
    );
    expect(
      results
        .filter((result) => !result.ok)
        .every((result) => result.error.includes("limit reached")),
    ).toBe(true);
    expect(post).toHaveBeenCalledTimes(MEMBER_UPLOAD_LIMIT);
    expect(saved!.revision).toBe(1);
    const transaction = dbSend.mock.calls.find(
      ([command]) => command.kind === "transact",
    )![0].input;
    expect(transaction.ClientRequestToken).toMatch(/^[a-f0-9-]{36}$/);
    expect(transaction.TransactItems).toHaveLength(2);
    expect(transaction.TransactItems[0].Update.Key.id).toMatch(
      /^upload-quota\/iiitm-gwalior\/member\/[a-f0-9]{64}\/\d+$/,
    );
    expect(JSON.stringify(transaction)).not.toContain("sample-resident");
    for (const item of transaction.TransactItems) {
      expect(item.Update).toMatchObject({
        TableName: "test-state-table",
        ConditionExpression: "attribute_not_exists(#used) OR #used < :limit",
        ExpressionAttributeNames: { "#used": "used", "#expires": "expiresAt" },
      });
      expect(item.Update.ExpressionAttributeValues[":expires"]).toBeGreaterThan(
        Date.now() / 1000,
      );
    }
  });
  it("keeps an account quota across different requests", async () => {
    const firstId = await preparePhotoRequest();
    await handler(
      event("act", {
        payload: JSON.stringify(submit),
        actionId: "submit-action-002",
        revision: 1,
      }),
    );
    const secondId = saved!.requests.find(
      (request) => request.id !== firstId,
    )!.id;
    await Promise.all(
      Array.from({ length: MEMBER_UPLOAD_LIMIT }, () =>
        handler(uploadEvent(residentIdentity, firstId)),
      ),
    );
    expect(
      JSON.parse(await handler(uploadEvent(residentIdentity, secondId))).ok,
    ).toBe(false);
    expect(post).toHaveBeenCalledTimes(MEMBER_UPLOAD_LIMIT);
  });
  it("opens a fresh member window without relying on TTL deletion", async () => {
    await preparePhotoRequest();
    await Promise.all(
      Array.from({ length: MEMBER_UPLOAD_LIMIT }, () => handler(uploadEvent())),
    );
    expect(JSON.parse(await handler(uploadEvent())).ok).toBe(false);
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-10T12:15:00Z"));
    expect(JSON.parse(await handler(uploadEvent())).ok).toBe(true);
    expect(
      [...uploadCounts.keys()].filter((key) => key.includes("/member/")),
    ).toHaveLength(2);
    expect([...uploadCounts.values()]).toContain(MEMBER_UPLOAD_LIMIT + 1);
  });
  it("shares a daily community cap across accounts and resets at UTC midnight", async () => {
    await preparePhotoRequest();
    const identities = Array.from(
      { length: COMMUNITY_UPLOAD_LIMIT + 1 },
      (_, i) =>
        ({
          sub: `sample-organiser-${i}`,
          claims: { "cognito:groups": ["IIITM_ORGANISERS"] },
        }) as typeof organiserIdentity,
    );
    const results = await Promise.all(
      identities.map((identity) =>
        handler(uploadEvent(identity)).then(JSON.parse),
      ),
    );
    expect(results.filter((result) => result.ok)).toHaveLength(
      COMMUNITY_UPLOAD_LIMIT,
    );
    expect(results[COMMUNITY_UPLOAD_LIMIT].error).toContain("limit reached");
    expect(post).toHaveBeenCalledTimes(COMMUNITY_UPLOAD_LIMIT);
    // The rejected reservation increments neither counter.
    expect(uploadCounts.size).toBe(COMMUNITY_UPLOAD_LIMIT + 1);
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-11T00:00:00Z"));
    expect(
      JSON.parse(await handler(uploadEvent(identities[COMMUNITY_UPLOAD_LIMIT])))
        .ok,
    ).toBe(true);
    expect(
      [...uploadCounts.keys()].filter((key) => key.includes("/day/")),
    ).toHaveLength(2);
  });
  it("does not consume quota for an invalid filename", async () => {
    await preparePhotoRequest();
    const result = JSON.parse(
      await handler(
        event("fileAccess", {
          payload: JSON.stringify({
            operation: "upload",
            target: "photo",
            recordId: saved!.requests[0].id,
            contentType: "image/png",
            name: "",
          }),
        }),
      ),
    );
    expect(result.ok).toBe(false);
    expect(uploadCounts.size).toBe(0);
    expect(post).not.toHaveBeenCalled();
  });
  it("fails closed when quota storage is unavailable", async () => {
    await preparePhotoRequest();
    const previous = dbSend.getMockImplementation()!;
    dbSend.mockImplementation((command) =>
      command.kind === "transact"
        ? Promise.reject(new Error("Database unavailable"))
        : previous(command),
    );
    expect(JSON.parse(await handler(uploadEvent())).ok).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });
  it("keeps a consumed slot after signing fails", async () => {
    await preparePhotoRequest();
    post.mockRejectedValueOnce(new Error("Signing failed"));
    expect(JSON.parse(await handler(uploadEvent())).ok).toBe(false);
    expect([...uploadCounts.values()]).toEqual([1, 1]);
  });
  it("does not apply upload quotas to authorised file reads", async () => {
    const recordId = await preparePhotoRequest();
    saved!.requests[0].photo = {
      key: `private/photo/${recordId}/saved-file-01`,
      name: "sample.png",
      type: "image/png",
    };
    expect(
      JSON.parse(
        await handler(
          event("fileAccess", {
            payload: JSON.stringify({
              operation: "read",
              target: "photo",
              recordId,
            }),
          }),
        ),
      ).ok,
    ).toBe(true);
    expect(uploadCounts.size).toBe(0);
    expect(signed).toHaveBeenCalledTimes(1);
  });
  it("preserves the old state and possible private copy on a conditional-write loss", async () => {
    const recordId = await preparePhotoRequest();
    const command = {
      type: "attach",
      target: "photo",
      recordId,
      attachment: {
        key: `private/photo/${recordId}/orphan-file-01`,
        type: "image/png",
        name: "sample.png",
      },
    };
    dbSend.mockImplementation(async (request) => {
      if (request.kind === "get")
        return { Item: { state: saved, revision: saved!.revision } };
      throw Object.assign(new Error("Concurrent write won"), {
        name: "ConditionalCheckFailedException",
      });
    });
    const result = JSON.parse(
      await handler(
        event("act", {
          payload: JSON.stringify(command),
          actionId: "photo-action-001",
          revision: 1,
        }),
      ),
    );
    expect(result.error).toContain("Refresh");
    expect(saved!.revision).toBe(1);
    expect(saved!.requests[0].photo).toBeUndefined();
    expect(s3Send).toHaveBeenCalledTimes(2); // HEAD and COPY; no unsafe delete.
    expect(s3Send.mock.calls[1][0].input.Key).toBe(command.attachment.key);
  });
  it("replays a committed attachment after a lost database response without recopying or deleting it", async () => {
    const recordId = await preparePhotoRequest();
    const previous = dbSend.getMockImplementation()!;
    dbSend.mockImplementation(async (request) => {
      const result = await previous(request);
      if (request.kind === "put") throw new Error("Response lost after commit");
      return result;
    });
    const attachment = {
      key: `private/photo/${recordId}/saved-file-01`,
      type: "image/png",
      name: "sample.png",
    };
    const request = event("act", {
      payload: JSON.stringify({
        type: "attach",
        target: "photo",
        recordId,
        attachment,
      }),
      actionId: "photo-action-001",
      revision: 1,
    });
    expect(JSON.parse(await handler(request)).ok).toBe(false);
    expect(saved!.requests[0].photo).toEqual(attachment);
    expect(JSON.parse(await handler(request)).ok).toBe(true);
    expect(s3Send).toHaveBeenCalledTimes(2);
  });
});
const submit = {
  type: "submit",
  category: "Phones",
  count: 2,
  contact: "Private sample contact",
  note: "",
};
describe("Lambda boundary", () => {
  it("promotes pending uploads before linking and never signs the private destination for upload", async () => {
    process.env.FILES_BUCKET = "test-bucket";
    await handler(
      event("act", {
        payload: JSON.stringify(submit),
        actionId: "submit-action-001",
        revision: 0,
      }),
    );
    const recordId = saved!.requests[0].id;
    const upload = JSON.parse(
      await handler(
        event("fileAccess", {
          payload: JSON.stringify({
            operation: "upload",
            target: "photo",
            recordId,
            contentType: "image/png",
            name: "sample.png",
          }),
        }),
      ),
    );
    expect(upload.ok).toBe(true);
    expect(post.mock.calls[0][1].Key).toMatch(/^pending\/photo\//);
    expect(upload.attachment.key).toMatch(/^private\/photo\//);
    const command = {
      type: "attach",
      target: "photo",
      recordId,
      attachment: upload.attachment,
    };
    expect(
      JSON.parse(
        await handler(
          event("act", {
            payload: JSON.stringify(command),
            actionId: "photo-action-001",
            revision: 1,
          }),
        ),
      ).ok,
    ).toBe(true);
    expect(s3Send.mock.calls[0][0].input.Key).toMatch(/^pending\//);
    expect(s3Send.mock.calls[1][0].input).toMatchObject({
      Key: upload.attachment.key,
      CopySource: `test-bucket/${upload.attachment.key.replace("private/", "pending/")}`,
    });
    const repeated = JSON.parse(
      await handler(
        event("fileAccess", {
          payload: JSON.stringify({
            operation: "upload",
            target: "photo",
            recordId,
            contentType: "image/png",
            name: "replacement.png",
          }),
        }),
      ),
    );
    expect(repeated.ok).toBe(false);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it("blocks photo upload URLs on withdrawn requests", async () => {
    await handler(
      event("act", {
        payload: JSON.stringify(submit),
        actionId: "submit-action-001",
        revision: 0,
      }),
    );
    saved!.requests[0].status = "Withdrawn";
    const result = JSON.parse(
      await handler(
        event("fileAccess", {
          payload: JSON.stringify({
            operation: "upload",
            target: "photo",
            recordId: saved!.requests[0].id,
            contentType: "image/png",
            name: "sample.png",
          }),
        }),
      ),
    );
    expect(result.ok).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });
  it("does not publish a file reference if promotion fails", async () => {
    await handler(
      event("act", {
        payload: JSON.stringify(submit),
        actionId: "submit-action-001",
        revision: 0,
      }),
    );
    const recordId = saved!.requests[0].id;
    s3Send
      .mockResolvedValueOnce({ ContentLength: 100, ContentType: "image/png" })
      .mockRejectedValueOnce(new Error("Copy failed"));
    const result = JSON.parse(
      await handler(
        event("act", {
          payload: JSON.stringify({
            type: "attach",
            target: "photo",
            recordId,
            attachment: {
              key: `private/photo/${recordId}/sample-file-01`,
              name: "sample.png",
              type: "image/png",
            },
          }),
          actionId: "photo-action-001",
          revision: 1,
        }),
      ),
    );
    expect(result.ok).toBe(false);
    expect(saved!.requests[0].photo).toBeUndefined();
  });
  it("denies missing identity before database access", async () => {
    expect(
      JSON.parse(await handler(event("dashboard", {}, null))),
    ).toMatchObject({ ok: false });
    expect(dbSend).not.toHaveBeenCalled();
  });
  it("denies signup without administrator admission", () =>
    expect(() =>
      actorFromIdentity({
        sub: "u",
        claims: { "cognito:groups": [] },
      } as never),
    ).toThrow("admitted"));
  it("rejects claimed community/role fields in the payload", async () => {
    const result = JSON.parse(
      await handler(
        event("act", {
          payload: JSON.stringify({
            type: "drive",
            status: "Cancelled",
            role: "organiser",
            community: "iiitm-gwalior",
          }),
          actionId: "fake-role-action-01",
          revision: 0,
        }),
      ),
    );
    expect(result.error).toContain("Organiser");
    expect(saved).toBeUndefined();
  });
  it("persists a new request with conditional creation", async () => {
    const result = JSON.parse(
      await handler(
        event("act", {
          payload: JSON.stringify(submit),
          actionId: "submit-action-001",
          revision: 0,
        }),
      ),
    );
    expect(result.ok).toBe(true);
    expect(saved?.requests).toHaveLength(1);
    expect(dbSend.mock.calls[1][0].input.ConditionExpression).toBe(
      "attribute_not_exists(id)",
    );
  });
  it("returns no other resident contact information", async () => {
    await handler(
      event("act", {
        payload: JSON.stringify(submit),
        actionId: "submit-action-001",
        revision: 0,
      }),
    );
    const result = await handler(
      event("dashboard", {}, {
        sub: "someone-else",
        claims: { "cognito:groups": ["IIITM_MEMBERS"] },
      } as never),
    );
    expect(result).not.toContain("Private sample contact");
    expect(JSON.parse(result).view.requests).toEqual([]);
  });
  it("conditionally updates revision on subsequent actions", async () => {
    saved = initialState();
    await handler(
      event("act", {
        payload: JSON.stringify(submit),
        actionId: "submit-action-001",
        revision: 0,
      }),
    );
    expect(dbSend.mock.calls[1][0].input).toMatchObject({
      ConditionExpression: "revision = :revision",
      ExpressionAttributeValues: { ":revision": 0 },
    });
  });
  it("returns a retryable conflict on a competing write", async () => {
    dbSend.mockImplementation(async (command) => {
      if (command.kind === "get") return {};
      throw Object.assign(new Error(), {
        name: "ConditionalCheckFailedException",
      });
    });
    const result = JSON.parse(
      await handler(
        event("act", {
          payload: JSON.stringify(submit),
          actionId: "submit-action-001",
          revision: 0,
        }),
      ),
    );
    expect(result).toMatchObject({ ok: false });
    expect(result.error).toContain("Refresh");
  });
  it("does not write the same action twice", async () => {
    const e = event("act", {
      payload: JSON.stringify(submit),
      actionId: "submit-action-001",
      revision: 0,
    });
    await handler(e);
    await handler(e);
    expect(
      dbSend.mock.calls.filter(([command]) => command.kind === "put"),
    ).toHaveLength(1);
  });
  it("does not grant a resident receipt file access", async () => {
    const result = JSON.parse(
      await handler(
        event("fileAccess", {
          payload: JSON.stringify({
            operation: "read",
            target: "receipt",
            recordId: "other-record",
          }),
        }),
      ),
    );
    expect(result.ok).toBe(false);
    expect(signed).not.toHaveBeenCalled();
  });
  it("denies arbitrary file keys and unowned photo requests", async () => {
    await handler(
      event("act", {
        payload: JSON.stringify(submit),
        actionId: "submit-action-001",
        revision: 0,
      }),
    );
    const result = JSON.parse(
      await handler(
        event("fileAccess", {
          payload: JSON.stringify({
            operation: "upload",
            target: "photo",
            recordId: "other-record",
            contentType: "image/png",
            name: "x.png",
          }),
        }),
      ),
    );
    expect(result.ok).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });
  it("issues an expiring size-restricted photo upload for the owner", async () => {
    await handler(
      event("act", {
        payload: JSON.stringify(submit),
        actionId: "submit-action-001",
        revision: 0,
      }),
    );
    const result = JSON.parse(
      await handler(
        event("fileAccess", {
          payload: JSON.stringify({
            operation: "upload",
            target: "photo",
            recordId: "sample-resident-submit-action-001",
            contentType: "image/png",
            name: "sample.png",
          }),
        }),
      ),
    );
    expect(result.ok).toBe(true);
    expect(post.mock.calls[0][1]).toMatchObject({
      Expires: 120,
      Conditions: [
        ["content-length-range", 1, 5242880],
        ["eq", "$Content-Type", "image/png"],
      ],
    });
  });
  it("rejects unsupported file types and invalid JSON", async () => {
    saved = {
      ...initialState(),
      requests: [
        {
          id: "sample-request-01",
          owner: "sample-resident",
          category: "Phones",
          count: 1,
          contact: "Sample",
          note: "",
          reviewNote: "",
          status: "Submitted",
          received: 0,
          createdAt: "2026-10-10",
        },
      ],
    };
    const result = JSON.parse(
      await handler(
        event("fileAccess", {
          payload: JSON.stringify({
            operation: "upload",
            target: "photo",
            recordId: "sample-request-01",
            contentType: "text/html",
            name: "x.html",
          }),
        }),
      ),
    );
    expect(result.ok).toBe(false);
    expect(
      JSON.parse(await handler(event("act", { payload: "broken" }))).ok,
    ).toBe(false);
  });
  it("verifies uploaded object metadata before attaching it", async () => {
    await handler(
      event("act", {
        payload: JSON.stringify(submit),
        actionId: "submit-action-001",
        revision: 0,
      }),
    );
    s3Send.mockResolvedValue({
      ContentLength: 6000000,
      ContentType: "image/png",
    });
    const command = {
      type: "attach",
      target: "photo",
      recordId: "sample-resident-submit-action-001",
      attachment: {
        key: "private/photo/sample-resident-submit-action-001/sample-object-01",
        type: "image/png",
        name: "sample.png",
      },
    };
    const result = JSON.parse(
      await handler(
        event("act", {
          payload: JSON.stringify(command),
          actionId: "file-action-001",
          revision: 1,
        }),
      ),
    );
    expect(result.ok).toBe(false);
    expect(saved!.requests[0].photo).toBeUndefined();
  });
  it("allows an organiser to read all requests but not bypass transitions", async () => {
    await handler(
      event("act", {
        payload: JSON.stringify(submit),
        actionId: "submit-action-001",
        revision: 0,
      }),
    );
    expect(
      JSON.parse(await handler(event("dashboard", {}, organiserIdentity))).view
        .requests,
    ).toHaveLength(1);
    const result = JSON.parse(
      await handler(
        event(
          "act",
          {
            payload: JSON.stringify({ type: "drive", status: "Closed" }),
            actionId: "close-action-001",
            revision: 1,
          },
          organiserIdentity,
        ),
      ),
    );
    expect(result.ok).toBe(false);
  });
});
