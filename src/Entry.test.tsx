// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
const setup = vi.hoisted(() => ({ configureCloud: vi.fn() }));
vi.mock("./api", () => ({
  isAws: false,
  configureCloud: setup.configureCloud,
}));
vi.mock("./App", () => ({
  default: ({
    initialDemoPersona,
    onExitDemo,
  }: {
    initialDemoPersona: string;
    onExitDemo: () => void;
  }) => (
    <div>
      Simulated workflow: {initialDemoPersona}
      <button onClick={onExitDemo}>Exit demo</button>
    </div>
  ),
}));
vi.mock("./components/CampusAccess", () => ({
  default: () => <div>Access fixture</div>,
}));
vi.mock("./CloudLogin", () => ({
  default: ({ initialStep }: { initialStep: string }) => (
    <div>Real account form: {initialStep}</div>
  ),
}));
import Entry from "./Entry";
beforeEach(() => {
  vi.resetAllMocks();
  setup.configureCloud.mockResolvedValue(undefined);
});
afterEach(cleanup);
describe("Explicit welcome and demo entry", () => {
  it("opens with Welcome and does not connect AWS or show workflow data", () => {
    render(<Entry awsEnabled />);
    expect(
      screen.getByRole("heading", {
        name: "A clearer path for campus e-waste.",
      }),
    ).toBeTruthy();
    expect(screen.queryByText(/Simulated workflow:/)).toBeNull();
    expect(setup.configureCloud).not.toHaveBeenCalled();
  });
  it.each([
    ["Asha", "resident"],
    ["Kabir", "neighbour"],
    ["Organiser", "organiser"],
  ])(
    "explicitly enters and exits the %s demo in an AWS build",
    (name, persona) => {
      render(<Entry awsEnabled />);
      fireEvent.click(screen.getByRole("button", { name: "Try the demo" }));
      expect(
        screen.getByText("Demo — simulated people and data, not real sign-in"),
      ).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp(`^${name}`) }),
      );
      expect(screen.getByText(`Simulated workflow: ${persona}`)).toBeTruthy();
      expect(setup.configureCloud).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Exit demo" }));
      expect(
        screen.getByRole("heading", {
          name: "A clearer path for campus e-waste.",
        }),
      ).toBeTruthy();
    },
  );
  it("explains unavailable real account creation in a demo-only build", () => {
    render(<Entry awsEnabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      screen.getByRole("heading", { name: "Campus sign-in needs AWS setup" }),
    ).toBeTruthy();
    expect(screen.queryByText(/Real account form:/)).toBeNull();
    expect(setup.configureCloud).not.toHaveBeenCalled();
  });
  it("surfaces an AWS connection failure without substituting demo data", async () => {
    setup.configureCloud.mockRejectedValueOnce(
      new Error("Synthetic connection failure"),
    );
    render(<Entry awsEnabled />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Synthetic connection failure",
    );
    expect(screen.queryByText(/Simulated workflow:/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Real account form: signin");
    expect(setup.configureCloud).toHaveBeenCalledTimes(2);
  });
  it("opens the requested signup form only after AWS setup succeeds", async () => {
    render(<Entry awsEnabled />);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await screen.findByText("Real account form: signup");
  });
});
