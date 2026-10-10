// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
const api = vi.hoisted(() => ({ cloudActor: vi.fn() }));
vi.mock("../api", () => ({
  cloudActor: api.cloudActor,
  AdmissionPendingError: class AdmissionPendingError extends Error {
    constructor(public email: string) {
      super("Admission required");
    }
  },
}));
vi.mock("../App", () => ({ default: () => <p>Admitted workflow fixture</p> }));
import { AdmissionPendingError } from "../api";
import CampusAccess from "./CampusAccess";
const signOut = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  api.cloudActor.mockRejectedValue(
    new AdmissionPendingError("student@iiitm.ac.in"),
  );
});
afterEach(cleanup);
describe("Signed-in campus admission screen", () => {
  it("shows the email, keeps workflow hidden and rechecks refreshed access", async () => {
    render(<CampusAccess signOut={signOut} busy={false} error="" />);
    await screen.findByRole("heading", { name: "Waiting for admission" });
    expect(screen.getByText("student@iiitm.ac.in")).toBeTruthy();
    expect(screen.queryByText("Admitted workflow fixture")).toBeNull();
    api.cloudActor.mockResolvedValueOnce({
      id: "synthetic-member",
      role: "resident",
      community: "iiitm-gwalior",
    });
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    await screen.findByText("Admitted workflow fixture");
    expect(api.cloudActor).toHaveBeenLastCalledWith(true);
  });
  it("distinguishes a connection error from pending admission", async () => {
    api.cloudActor.mockRejectedValueOnce(
      new Error("Synthetic connection failure"),
    );
    render(<CampusAccess signOut={signOut} busy={false} error="" />);
    await screen.findByRole("heading", {
      name: "Could not check campus access",
    });
    expect(screen.queryByText("Waiting for admission")).toBeNull();
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Synthetic connection failure",
    );
    expect(screen.queryByText("Admitted workflow fixture")).toBeNull();
  });
  it("allows sign-out from pending admission", async () => {
    render(<CampusAccess signOut={signOut} busy={false} error="" />);
    await screen.findByRole("heading", { name: "Waiting for admission" });
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledOnce();
  });
  it("disables repeated access checks until the first finishes", async () => {
    render(<CampusAccess signOut={signOut} busy={false} error="" />);
    await screen.findByRole("heading", { name: "Waiting for admission" });
    let finish!: (value: {
      id: string;
      role: string;
      community: string;
    }) => void;
    api.cloudActor.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const button = screen.getByRole("button", { name: "Check again" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(api.cloudActor).toHaveBeenCalledTimes(2);
    finish({
      id: "synthetic-member",
      role: "resident",
      community: "iiitm-gwalior",
    });
    await screen.findByText("Admitted workflow fixture");
  });
});
