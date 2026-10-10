import { useEffect, useRef, useState } from "react";
import App from "../App";
import { AdmissionPendingError, cloudActor } from "../api";
import type { Actor } from "../../shared/domain";
import type { LoginSession } from "./IdentityForms";
import { Skeleton } from "./ui";

export default function CampusAccess({
  signOut,
  busy,
  error: signOutError,
}: LoginSession) {
  const [actor, setActor] = useState<Actor>();
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const request = useRef(0);
  async function check(forceRefresh: boolean) {
    const current = ++request.current;
    setChecking(true);
    setError("");
    try {
      const identity = await cloudActor(forceRefresh);
      if (request.current === current) {
        setActor(identity);
        setPending(false);
      }
    } catch (failure) {
      if (request.current !== current) return;
      setActor(undefined);
      if (failure instanceof AdmissionPendingError) {
        setPending(true);
        setEmail(failure.email);
      } else {
        setPending(false);
        setError(
          failure instanceof Error
            ? failure.message
            : "Campus access could not be checked. Try again.",
        );
      }
    } finally {
      if (request.current === current) setChecking(false);
    }
  }
  useEffect(() => {
    void check(false);
    return () => {
      request.current++;
    };
  }, []);
  if (actor)
    return (
      <>
        <button className="cloud-signout" disabled={busy} onClick={signOut}>
          {busy ? "Signing out…" : "Sign out"}
        </button>
        {signOutError && (
          <p className="error" role="alert">
            {signOutError}
          </p>
        )}
        <App cloudIdentity={actor} />
      </>
    );
  return (
    <main className="identity-page">
      <section className="login-card" aria-busy={checking || busy}>
        <p className="eyebrow">E-WASTE TOGETHER · CAMPUS ACCESS</p>
        <h1>
          {checking
            ? "Checking campus access"
            : pending
              ? "Waiting for admission"
              : "Could not check campus access"}
        </h1>
        {email && (
          <p className="signed-in-email">
            Signed in as <strong>{email}</strong>
          </p>
        )}
        {pending && (
          <>
            <p>
              Your campus account is signed in. An organiser must admit you
              before you can access the drive.
            </p>
            <p className="quiet">
              After the organiser confirms admission, select Check again. If
              access still has not updated, sign out and sign in again.
            </p>
          </>
        )}
        {checking && (
          <div role="status">
            Refreshing your campus access…
            <Skeleton />
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {signOutError && (
          <p className="error" role="alert">
            {signOutError}
          </p>
        )}
        <div className="entry-actions">
          <button
            className="primary"
            disabled={checking || busy}
            onClick={() => void check(true)}
          >
            Check again
          </button>
          <button
            className="secondary-button"
            disabled={busy}
            onClick={signOut}
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </section>
    </main>
  );
}
