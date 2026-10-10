import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import type { ReactNode } from 'react';
export default function CloudLogin({ children }: { children: ReactNode }) {
  return <Authenticator>{({ signOut }) => <><button className="cloud-signout" onClick={signOut}>Sign out</button>{children}</>}</Authenticator>;
}
