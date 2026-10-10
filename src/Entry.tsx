import { lazy, Suspense, useEffect, useState } from "react";
import App from "./App";
import { configureCloud, isAws } from "./api";
import CampusAccess from "./components/CampusAccess";
import {
  DemoChooser,
  Welcome,
  type DemoPersona,
} from "./components/EntryScreens";
import { Skeleton } from "./components/ui";
const CloudLogin = lazy(() => import("./CloudLogin"));
type Screen = "welcome" | "signin" | "signup" | "chooser" | "demo";

export default function Entry({
  awsEnabled = isAws,
}: {
  awsEnabled?: boolean;
}) {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [persona, setPersona] = useState<DemoPersona>("resident");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const cloudScreen = screen === "signin" || screen === "signup";
  useEffect(() => {
    if (!cloudScreen || !awsEnabled || ready) return;
    let active = true;
    setError("");
    configureCloud()
      .then(() => {
        if (active) setReady(true);
      })
      .catch((failure) => {
        if (active)
          setError(
            failure instanceof Error
              ? failure.message
              : "Campus sign-in could not be connected. Try again.",
          );
      });
    return () => {
      active = false;
    };
  }, [cloudScreen, awsEnabled, ready, retry]);
  const back = () => setScreen("welcome");
  if (screen === "welcome")
    return (
      <Welcome
        onSignIn={() => setScreen("signin")}
        onSignUp={() => setScreen("signup")}
        onDemo={() => setScreen("chooser")}
      />
    );
  if (screen === "chooser")
    return (
      <DemoChooser
        back={back}
        choose={(role) => {
          setPersona(role);
          setScreen("demo");
        }}
      />
    );
  if (screen === "demo")
    return <App initialDemoPersona={persona} onExitDemo={back} />;
  if (!awsEnabled || error)
    return (
      <main className="identity-page">
        <section className="login-card">
          <h1>
            {awsEnabled
              ? "Campus sign-in is unavailable"
              : "Campus sign-in needs AWS setup"}
          </h1>
          <p>
            {awsEnabled
              ? "Your AWS connection could not be completed. No demo data has been substituted."
              : "This build supports the simulated demo. Campus sign-in and account creation become available after AWS is configured."}
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="entry-actions">
            {awsEnabled && (
              <button
                className="primary"
                onClick={() => {
                  setError("");
                  setRetry((value) => value + 1);
                }}
              >
                Try again
              </button>
            )}
            <button className="secondary-button" onClick={back}>
              Back to welcome
            </button>
            <button
              className="text-button"
              onClick={() => setScreen("chooser")}
            >
              Try the demo
            </button>
          </div>
        </section>
      </main>
    );
  if (!ready)
    return (
      <main className="identity-page">
        <section className="login-card" role="status">
          Connecting campus sign-in…
          <Skeleton />
          <button className="text-button" onClick={back}>
            Back to welcome
          </button>
        </section>
      </main>
    );
  return (
    <Suspense
      fallback={
        <main className="identity-page">
          <section className="login-card" role="status">
            Loading sign-in…
            <Skeleton />
          </section>
        </main>
      }
    >
      <CloudLogin
        initialStep={screen === "signup" ? "signup" : "signin"}
        onBack={back}
      >
        {(session) => <CampusAccess {...session} />}
      </CloudLogin>
    </Suspense>
  );
}
