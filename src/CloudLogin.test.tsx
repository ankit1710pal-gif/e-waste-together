// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

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
  it("rejects a non-campus signup before calling Cognito", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    enter("Campus email", "student@example.com");
    enter("Password", "SyntheticPassword1!");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      screen.getByText("Create your account with an @iiitm.ac.in email."),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Campus email").getAttribute("aria-invalid"),
    ).toBe("true");
    expect(auth.signUp).not.toHaveBeenCalled();
  });
  it("provides inline password validation and focuses the invalid field", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    enter("Campus email", "student@iiitm.ac.in");
    enter("Password", "short");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    const input = screen.getByLabelText("Password", { exact: true });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(input);
    expect(auth.signUp).not.toHaveBeenCalled();
  });
  it("shows and hides the password without changing its value", async () => {
    await open();
    enter("Password", "SyntheticPassword1!");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(
      screen.getByLabelText("Password", { exact: true }).getAttribute("type"),
    ).toBe("text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(
      screen.getByLabelText("Password", { exact: true }).getAttribute("type"),
    ).toBe("password");
    expect(
      (screen.getByLabelText("Password", { exact: true }) as HTMLInputElement)
        .value,
    ).toBe("SyntheticPassword1!");
  });
  it("blocks empty fields and does not send a sign-in request", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Enter your campus email.")).toBeTruthy();
    expect(screen.getByText("Enter your password.")).toBeTruthy();
    expect(auth.signIn).not.toHaveBeenCalled();
  });
  it("disables account controls and prevents repeated submission while busy", async () => {
    let finish!: (value: { isSignedIn: boolean }) => void;
    auth.signIn.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await open();
    enter("Campus email", "student@iiitm.ac.in");
    enter("Password", "SyntheticPassword1!");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("status");
    expect(
      (
        screen.getByRole("button", {
          name: "Please wait…",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Forgot password?",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.submit(screen.getByLabelText("Campus email").closest("form")!);
    expect(auth.signIn).toHaveBeenCalledTimes(1);
    finish({ isSignedIn: true });
    await screen.findByText("Private workflow fixture");
  });
  it("requires verification for an unconfirmed account instead of showing private content", async () => {
    auth.signIn.mockResolvedValueOnce({
      isSignedIn: false,
      nextStep: { signInStep: "CONFIRM_SIGN_UP" },
    });
    await open();
    enter("Campus email", "student@iiitm.ac.in");
    enter("Password", "SyntheticPassword1!");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("heading", { name: "Verify your campus email" });
    expect(screen.queryByText("Private workflow fixture")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Verify email" }));
    expect(auth.confirmSignUp).not.toHaveBeenCalled();
    expect(
      screen.getByText("Enter the verification code from your email."),
    ).toBeTruthy();
  });
  it("keeps extra Cognito verification requirements visible without granting access", async () => {
    auth.signIn.mockResolvedValueOnce({
      isSignedIn: false,
      nextStep: { signInStep: "CONFIRM_SIGN_IN_WITH_TOTP_CODE" },
    });
    await open();
    enter("Campus email", "student@iiitm.ac.in");
    enter("Password", "SyntheticPassword1!");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Additional sign-in verification",
    );
    expect(screen.queryByText("Private workflow fixture")).toBeNull();
  });
  it("reports a resend failure and allows another attempt", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    enter("Campus email", "student@iiitm.ac.in");
    enter("Password", "SyntheticPassword1!");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await screen.findByRole("heading", { name: "Verify your campus email" });
    auth.resendSignUpCode.mockRejectedValueOnce(
      new Error("Please wait before requesting another code"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await screen.findByRole("alert");
    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Resend code",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await screen.findByText("A new verification code has been sent.");
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("does not claim sign-out succeeded when Cognito rejects it", async () => {
    auth.fetchAuthSession.mockResolvedValueOnce({
      tokens: { idToken: "synthetic-token" },
    });
    auth.signOut.mockRejectedValueOnce(new Error("Connection interrupted"));
    render(
      <CloudLogin>
        <p>Private workflow fixture</p>
      </CloudLogin>,
    );
    await screen.findByText("Private workflow fixture");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Connection interrupted",
    );
    expect(screen.getByText("Private workflow fixture")).toBeTruthy();
  });
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
