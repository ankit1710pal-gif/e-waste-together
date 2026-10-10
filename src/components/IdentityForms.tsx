import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
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
import { Skeleton } from "./ui";

type Step = "signin" | "signup" | "confirm" | "reset" | "newPassword";
type Field = "email" | "password" | "code";
export interface LoginSession {
  signOut: () => Promise<void>;
  busy: boolean;
  error: string;
}
export default function IdentityForms({
  children,
  initialStep = "signin",
  onBack,
}: {
  children: ReactNode | ((session: LoginSession) => ReactNode);
  initialStep?: "signin" | "signup";
  onBack?: () => void;
}) {
  const id = useId();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<Step>(initialStep);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [invalid, setInvalid] = useState<Partial<Record<Field, string>>>({});
  useEffect(() => {
    let active = true;
    fetchAuthSession()
      .then((session) => {
        if (active) setAuthenticated(Boolean(session.tokens));
      })
      .catch(() => {
        if (active) setNotice("Sign in to check your campus access.");
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const hasPassword = ["signin", "signup", "newPassword"].includes(step);
  const hasCode = ["confirm", "newPassword"].includes(step);
  const newPassword = step === "signup" || step === "newPassword";
  function validate(field: Field, value: string): string {
    if (field === "email") {
      const address = value.trim();
      if (!address) return "Enter your campus email.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
        return "Enter a valid email address.";
      if (step === "signup" && !/^[^\s@]+@iiitm\.ac\.in$/i.test(address))
        return "Create your account with an @iiitm.ac.in email.";
    }
    if (field === "password") {
      if (!value) return "Enter your password.";
      if (
        newPassword &&
        (value.length < 8 ||
          !/[A-Z]/.test(value) ||
          !/[a-z]/.test(value) ||
          !/[0-9]/.test(value) ||
          !/[^A-Za-z0-9\s]/.test(value))
      )
        return "Use at least 8 characters with uppercase, lowercase, a number and a symbol.";
    }
    if (field === "code" && !value.trim())
      return "Enter the verification code from your email.";
    return "";
  }
  function clearField(field: Field) {
    setInvalid((current) => ({ ...current, [field]: undefined }));
  }
  function blur(field: Field, value: string) {
    setInvalid((current) => ({ ...current, [field]: validate(field, value) }));
  }
  function changeStep(next: Step) {
    setStep(next);
    setPassword("");
    setCode("");
    setShowPassword(false);
    setInvalid({});
    setError("");
    setNotice("");
  }
  function message(failure: unknown, fallback: string) {
    return failure instanceof Error ? failure.message : fallback;
  }
  function verificationNotice(destination?: string) {
    return `A verification code was requested for ${destination || "your campus email"}. Check your inbox and spam/junk folder.`;
  }
  async function requestVerificationCode(address: string) {
    try {
      const delivery = await resendSignUpCode({ username: address });
      setNotice(verificationNotice(delivery.destination));
    } catch (failure) {
      setError(
        message(
          failure,
          "Code could not be sent. Use Resend code to try again.",
        ),
      );
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields: Field[] = [
      "email",
      ...(hasPassword ? ["password" as const] : []),
      ...(hasCode ? ["code" as const] : []),
    ];
    const values = { email, password, code };
    const errors = Object.fromEntries(
      fields.map((field) => [field, validate(field, values[field])]),
    );
    setInvalid(errors);
    setError("");
    setNotice("");
    const first = fields.find((field) => errors[field]);
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    const address = email.trim();
    setEmail(address);
    setBusy(true);
    try {
      if (step === "signin") {
        const result = await signIn({ username: address, password });
        if (result.isSignedIn) {
          setPassword("");
          setAuthenticated(true);
        } else if (result.nextStep.signInStep === "CONFIRM_SIGN_UP") {
          changeStep("confirm");
          await requestVerificationCode(address);
        } else
          throw new Error(
            "Additional sign-in verification is required. Contact the organiser for this account configuration.",
          );
      } else if (step === "signup") {
        await signUp({
          username: address,
          password,
          options: { userAttributes: { email: address } },
        });
        changeStep("confirm");
        setNotice(verificationNotice());
      } else if (step === "confirm") {
        await confirmSignUp({
          username: address,
          confirmationCode: code.trim(),
        });
        changeStep("signin");
        setNotice(
          "Email verified. Sign in; organiser admission is still required for drive access.",
        );
      } else if (step === "reset") {
        const result = await resetPassword({ username: address });
        if (
          result.nextStep.resetPasswordStep ===
          "CONFIRM_RESET_PASSWORD_WITH_CODE"
        ) {
          changeStep("newPassword");
          setNotice(
            "Enter the reset code from your email and your new password.",
          );
        } else {
          changeStep("signin");
          setNotice("Password reset completed. Sign in again.");
        }
      } else {
        await confirmResetPassword({
          username: address,
          confirmationCode: code.trim(),
          newPassword: password,
        });
        changeStep("signin");
        setNotice("Password updated. Sign in with your new password.");
      }
    } catch (failure) {
      setError(message(failure, "Sign-in could not be completed. Try again."));
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await signOut();
      setAuthenticated(false);
      setEmail("");
      changeStep("signin");
    } catch (failure) {
      setError(message(failure, "Sign-out failed. Try again."));
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (busy) return;
    const emailError = validate("email", email);
    if (emailError) {
      setInvalid({ email: emailError });
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await requestVerificationCode(email.trim());
    } finally {
      setBusy(false);
    }
  }
  if (checking)
    return (
      <main className="identity-page">
        <section className="login-card" aria-live="polite">
          Checking your sign-in…
          <Skeleton />
        </section>
      </main>
    );
  if (authenticated) {
    if (typeof children === "function")
      return children({ signOut: logout, busy, error });
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
  }
  const title = {
    signin: "Sign in to your campus",
    signup: "Create your campus account",
    confirm: "Verify your campus email",
    reset: "Reset your password",
    newPassword: "Choose your new password",
  }[step];
  const inputError = (field: Field) =>
    invalid[field] ? (
      <small className="field-error" id={`${id}-${field}-error`}>
        {invalid[field]}
      </small>
    ) : null;
  return (
    <main className="identity-page">
      <section className="login-card">
        <p className="eyebrow">E-WASTE TOGETHER · IIITM GWALIOR</p>
        <h1>{title}</h1>
        <p>
          Use your @iiitm.ac.in email. Drive access requires verified campus
          email + organiser admission.
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        <form noValidate onSubmit={submit} aria-busy={busy}>
          <div className="field">
            <label htmlFor={`${id}-email`}>Campus email</label>
            <input
              id={`${id}-email`}
              type="email"
              autoComplete="username"
              value={email}
              required
              disabled={busy || hasCode}
              aria-invalid={Boolean(invalid.email)}
              aria-describedby={invalid.email ? `${id}-email-error` : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                clearField("email");
              }}
              onBlur={() => blur("email", email)}
            />
            {inputError("email")}
          </div>
          {hasPassword && (
            <div className="field">
              <label htmlFor={`${id}-password`}>
                {step === "newPassword" ? "New password" : "Password"}
              </label>
              <div className="password-control">
                <input
                  id={`${id}-password`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  autoComplete={
                    step === "signin" ? "current-password" : "new-password"
                  }
                  required
                  disabled={busy}
                  aria-invalid={Boolean(invalid.password)}
                  aria-describedby={
                    [
                      newPassword ? `${id}-password-hint` : "",
                      invalid.password ? `${id}-password-error` : "",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearField("password");
                  }}
                  onBlur={() => blur("password", password)}
                />
                <button
                  type="button"
                  className="secondary-button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={busy}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {newPassword && (
                <small id={`${id}-password-hint`}>
                  Use at least 8 characters with uppercase, lowercase, a number
                  and a symbol.
                </small>
              )}
              {inputError("password")}
            </div>
          )}
          {hasCode && (
            <div className="field">
              <label htmlFor={`${id}-code`}>Verification code</label>
              <input
                id={`${id}-code`}
                value={code}
                autoComplete="one-time-code"
                inputMode="numeric"
                required
                disabled={busy}
                aria-invalid={Boolean(invalid.code)}
                aria-describedby={invalid.code ? `${id}-code-error` : undefined}
                onChange={(e) => {
                  setCode(e.target.value);
                  clearField("code");
                }}
                onBlur={() => blur("code", code)}
              />
              {inputError("code")}
            </div>
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
          {busy && (
            <p className="quiet" role="status">
              Please wait while your account request completes.
            </p>
          )}
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
          {onBack && (
            <button
              className="text-button muted"
              disabled={busy}
              onClick={onBack}
            >
              Back to welcome
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
