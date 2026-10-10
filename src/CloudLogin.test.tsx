// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const auth = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  fetchAuthSession: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  confirmResetPassword: vi.fn(),
  resendSignUpCode: vi.fn(),
}));
vi.mock("aws-amplify/auth", () => auth);
import CloudLogin from "./CloudLogin";

beforeEach(() => {
  vi.resetAllMocks();
  auth.fetchAuthSession.mockResolvedValue({});
  auth.signIn.mockResolvedValue({ isSignedIn: true });
  auth.signUp.mockResolvedValue({});
  auth.confirmSignUp.mockResolvedValue({});
  auth.signOut.mockResolvedValue(undefined);
  auth.resetPassword.mockResolvedValue({
    nextStep: { resetPasswordStep: "CONFIRM_RESET_PASSWORD_WITH_CODE" },
  });
  auth.confirmResetPassword.mockResolvedValue(undefined);
  auth.resendSignUpCode.mockResolvedValue({});
});
afterEach(cleanup);
async function open() {
  render(
    <CloudLogin>
      <p>Private workflow fixture</p>
    </CloudLogin>,
  );
  await screen.findByRole("heading", { name: "Sign in to your campus" });
}
function enter(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label, { exact: true }), {
    target: { value },
  });
}

describe("Lightweight Cognito forms (mocked SDK)", () => {
  it("signs in and signs out without exposing the workflow before authentication", async () => {
    await open();
    expect(screen.queryByText("Private workflow fixture")).toBeNull();
    enter("Campus email", "student@iiitm.ac.in");
    enter("Password", "SyntheticPassword1!");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByText("Private workflow fixture");
    expect(auth.signIn).toHaveBeenCalledWith({
      username: "student@iiitm.ac.in",
      password: "SyntheticPassword1!",
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByRole("heading", { name: "Sign in to your campus" });
    expect(screen.queryByText("Private workflow fixture")).toBeNull();
  });
  it("registers and verifies email without automatically admitting the user", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    enter("Campus email", "student@iiitm.ac.in");
    enter("Password", "SyntheticPassword1!");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await screen.findByRole("heading", { name: "Verify your campus email" });
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await screen.findByText("A new verification code has been sent.");
    enter("Verification code", "123456");
    fireEvent.click(screen.getByRole("button", { name: "Verify email" }));
    await screen.findByRole("heading", { name: "Sign in to your campus" });
    expect(auth.signUp).toHaveBeenCalledWith({
      username: "student@iiitm.ac.in",
      password: "SyntheticPassword1!",
      options: { userAttributes: { email: "student@iiitm.ac.in" } },
    });
    expect(auth.confirmSignUp).toHaveBeenCalledWith({
      username: "student@iiitm.ac.in",
      confirmationCode: "123456",
    });
    expect(screen.queryByText("Private workflow fixture")).toBeNull();
  });
  it("resets a forgotten password through the emailed code", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    enter("Campus email", "student@iiitm.ac.in");
    fireEvent.click(screen.getByRole("button", { name: "Send reset code" }));
    await screen.findByRole("heading", { name: "Choose your new password" });
    enter("New password", "NewSyntheticPassword2!");
    enter("Verification code", "654321");
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    await screen.findByRole("heading", { name: "Sign in to your campus" });
    expect(auth.confirmResetPassword).toHaveBeenCalledWith({
      username: "student@iiitm.ac.in",
      confirmationCode: "654321",
      newPassword: "NewSyntheticPassword2!",
    });
  });
  it("shows sign-in failures and keeps private content hidden", async () => {
    auth.signIn.mockRejectedValueOnce(new Error("Incorrect credentials"));
    await open();
    enter("Campus email", "student@iiitm.ac.in");
    enter("Password", "WrongSyntheticPassword1!");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Incorrect credentials",
    );
    expect(screen.queryByText("Private workflow fixture")).toBeNull();
  });
  it("restores an existing session without asking for another password", async () => {
    auth.fetchAuthSession.mockResolvedValueOnce({
      tokens: { idToken: "synthetic-token-fixture" },
    });
    render(
      <CloudLogin>
        <p>Private workflow fixture</p>
      </CloudLogin>,
    );
    await screen.findByText("Private workflow fixture");
    expect(auth.signIn).not.toHaveBeenCalled();
  });
});
