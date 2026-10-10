import React, { Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { cloudActor, configureCloud, isAws } from './api';
import type { Actor } from '../shared/domain';
import './styles.css';
const CloudLogin = React.lazy(() => import('./CloudLogin'));
function Root() {
  const [ready, setReady] = useState(!isAws); const [error, setError] = useState('');
  useEffect(() => { if (isAws) configureCloud().then(() => setReady(true)).catch(e => setError(e.message)); }, []);
  if (error) return <main className="setup"><h1>AWS connection needs setup</h1><p role="alert">{error}</p><p>See README.md and docs/deployment.md for the exact steps. This app will not fall back to demo data in AWS mode.</p></main>;
  if (!ready) return <main className="setup" aria-live="polite">Connecting to your campus…</main>;
  return isAws ? <Suspense fallback={<main className="setup">Loading sign-in…</main>}><CloudLogin><SignedInApp /></CloudLogin></Suspense> : <App />;
}
function SignedInApp() {
  const [actor, setActor] = useState<Actor>(); const [error, setError] = useState('');
  useEffect(() => { cloudActor().then(setActor).catch(e => setError(e.message)); }, []);
  if (error) return <main className="setup"><h1>Campus admission pending</h1><p role="alert">{error}</p></main>;
  return actor ? <App cloudIdentity={actor}/> : <main className="setup">Checking community access…</main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Root/></React.StrictMode>);
