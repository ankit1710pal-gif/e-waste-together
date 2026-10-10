// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoActors } from "../shared/seed";
const sdk = vi.hoisted(() => ({
  generateClient: vi.fn(),
  fetchAuthSession: vi.fn(),
}));
vi.mock("aws-amplify/data", () => ({ generateClient: sdk.generateClient }));
vi.mock("aws-amplify/auth", () => ({ fetchAuthSession: sdk.fetchAuthSession }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.resetModules();
  vi.stubEnv("VITE_DATA_MODE", "aws");
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllEnvs();
});
describe("Explicit demo boundary and refreshed Cognito admission", () => {
  it("uses only browser-local data for an explicit demo in an AWS build", async () => {
    const api = await import("./api");
    expect(api.isAws).toBe(true);
    const first = await api.loadView(demoActors.resident, "demo");
    const next = await api.execute(
      demoActors.resident,
      {
        type: "submit",
        category: "Phones",
        count: 1,
        contact: "Synthetic contact",
        note: "Explicit demo test",
      },
      first.revision,
      "demo",
    );
    expect(next.demo).toBe(true);
    expect(
      next.requests.some((request) => request.note === "Explicit demo test"),
    ).toBe(true);
    expect(sdk.generateClient).not.toHaveBeenCalled();
    expect(sdk.fetchAuthSession).not.toHaveBeenCalled();
  });
  it("keeps explicit demo uploads and reads local in an AWS build", async () => {
    const api = await import("./api");
    const attachment = await api.uploadFile(
      "photo",
      "sample-request-01",
      new File(["synthetic"], "fixture.png", { type: "image/png" }),
      "demo",
    );
    expect(
      await api.fileUrl(
        "photo",
        "sample-request-01",
        attachment,
        undefined,
        "demo",
      ),
    ).toMatch(/^data:image\/png;base64,/);
    api.resetDemo();
    expect(localStorage.length).toBe(0);
    expect(sdk.generateClient).not.toHaveBeenCalled();
  });
  it("does not return saved demo data when real AWS access fails", async () => {
    const api = await import("./api");
    await api.loadView(demoActors.resident, "demo");
    const before = localStorage.getItem("e-waste-together:demo:v1");
    await expect(api.loadView(demoActors.resident, "aws")).rejects.toThrow();
    expect(localStorage.getItem("e-waste-together:demo:v1")).toBe(before);
  });
  it("reports signed-in email and pending admission without an allowed group", async () => {
    const api = await import("./api");
    sdk.fetchAuthSession.mockResolvedValue({
      tokens: {
        idToken: {
          payload: {
            sub: "synthetic-member",
            email: "student@iiitm.ac.in",
            "cognito:groups": ["OTHER_GROUP"],
          },
        },
      },
    });
    const error = await api.cloudActor().catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(api.AdmissionPendingError);
    expect(
      (error as InstanceType<typeof api.AdmissionPendingError>).email,
    ).toBe("student@iiitm.ac.in");
  });
  it.each([
    ["IIITM_MEMBERS", "resident"],
    ["IIITM_ORGANISERS", "organiser"],
  ])(
    "refreshes the session before reading %s membership",
    async (group, role) => {
      const api = await import("./api");
      sdk.fetchAuthSession.mockResolvedValue({
        tokens: {
          idToken: {
            payload: { sub: "synthetic-member", "cognito:groups": [group] },
          },
        },
      });
      expect(await api.cloudActor(true)).toEqual({
        id: "synthetic-member",
        role,
        community: "iiitm-gwalior",
      });
      expect(sdk.fetchAuthSession).toHaveBeenCalledWith({ forceRefresh: true });
    },
  );
  it("does not create an actor for a missing signed-in session", async () => {
    const api = await import("./api");
    sdk.fetchAuthSession.mockResolvedValue({});
    await expect(api.cloudActor()).rejects.toThrow("Sign in to continue.");
  });
});
