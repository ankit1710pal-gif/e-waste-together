import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  confirmResetPassword,
  confirmSignUp,
  fetchAuthSession,
  resendSignUpCode,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";

type Step = "signin" | "signup" | "confirm" | "reset" | "newPassword";

export default function CloudLogin({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<Step>("signin");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    fetchAuthSession()
      .then((session) => {
        if (active) setAuthenticated(Boolean(session.tokens));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  function changeStep(next: Step) {
    setStep(next);
    setError("");
    setNotice("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const password = String(fields.get("password") ?? "");
    const code = String(fields.get("code") ?? "").trim();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (step === "signin") {
        const result = await signIn({ username: email, password });
        if (result.isSignedIn) setAuthenticated(true);
        else if (result.nextStep.signInStep === "CONFIRM_SIGN_UP") {
          setStep("confirm");
          setNotice("Verify your campus email using its signup code.");
        } else
          throw new Error(
            "Additional sign-in verification is required. Contact the organiser for this account configuration.",
          );
      } else if (step === "signup") {
        await signUp({
          username: email,
          password,
          options: { userAttributes: { email } },
        });
        setStep("confirm");
        setNotice("Enter the verification code sent to your campus email.");
      } else if (step === "confirm") {
        await confirmSignUp({ username: email, confirmationCode: code });
        setStep("signin");
        setNotice(
          "Email verified. Sign in; campus admission is assigned separately by the organiser.",
        );
      } else if (step === "reset") {
        const result = await resetPassword({ username: email });
        if (
          result.nextStep.resetPasswordStep ===
          "CONFIRM_RESET_PASSWORD_WITH_CODE"
        ) {
          setStep("newPassword");
          setNotice(
            "Enter the reset code from your email and your new password.",
          );
        } else {
          setStep("signin");
          setNotice("Password reset completed. Sign in again.");
        }
      } else {
        await confirmResetPassword({
          username: email,
          confirmationCode: code,
          newPassword: password,
        });
        setStep("signin");
        setNotice("Password updated. Sign in with your new password.");
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Sign-in could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await signOut();
      setAuthenticated(false);
      setStep("signin");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Sign-out failed.");
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setError("");
    try {
      await resendSignUpCode({ username: email });
      setNotice("A new verification code has been sent.");
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Code could not be sent.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (checking)
    return (
      <main className="setup" aria-live="polite">
        Checking your sign-in…
      </main>
    );
  if (authenticated)
    return (
      <>
        <button className="cloud-signout" disabled={busy} onClick={logout}>
          Sign out
        </button>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {children}
      </>
    );
  const title = {
    signin: "Sign in to your campus",
    signup: "Create your campus account",
    confirm: "Verify your campus email",
    reset: "Reset your password",
    newPassword: "Choose your new password",
  }[step];
  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">E-WASTE TOGETHER · IIITM GWALIOR</p>
        <h1>{title}</h1>
        <p>
          Use your @iiitm.ac.in email. An organiser admits verified campus
          members before they can access the drive.
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        <form key={step} onSubmit={submit}>
          <label className="field">
            <span>Campus email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={busy || step === "confirm" || step === "newPassword"}
            />
          </label>
          {["signin", "signup", "newPassword"].includes(step) && (
            <label className="field">
              <span>
                {step === "newPassword" ? "New password" : "Password"}
              </span>
              <input
                name="password"
                type="password"
                autoComplete={
                  step === "signin" ? "current-password" : "new-password"
                }
                minLength={step === "signin" ? undefined : 8}
                required
              />
            </label>
          )}
          {step === "signup" && (
            <p className="quiet">
              Use at least 8 characters with uppercase, lowercase, a number and
              a symbol.
            </p>
          )}
          {["confirm", "newPassword"].includes(step) && (
            <label className="field">
              <span>Verification code</span>
              <input
                name="code"
                autoComplete="one-time-code"
                inputMode="numeric"
                required
              />
            </label>
          )}
          <button className="primary full" disabled={busy}>
            {busy
              ? "Please wait…"
              : {
                  signin: "Sign in",
                  signup: "Create account",
                  confirm: "Verify email",
                  reset: "Send reset code",
                  newPassword: "Update password",
                }[step]}
          </button>
        </form>
        <div className="login-actions">
          {step === "signin" ? (
            <>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => changeStep("signup")}
              >
                Create account
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => changeStep("reset")}
              >
                Forgot password?
              </button>
            </>
          ) : (
            <button
              className="text-button"
              disabled={busy}
              onClick={() => changeStep("signin")}
            >
              Back to sign in
            </button>
          )}
          {step === "confirm" && (
            <button className="text-button" disabled={busy} onClick={resend}>
              Resend code
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
