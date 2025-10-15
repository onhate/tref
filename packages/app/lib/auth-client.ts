import {
  adminClient,
  deviceAuthorizationClient,
  lastLoginMethodClient,
  multiSessionClient,
  oneTapClient,
  organizationClient,
  passkeyClient,
  twoFactorClient
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    organizationClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = '/two-factor';
      }
    }),
    oneTapClient({
      clientId: 'asdfasdfasd'
    }),
    passkeyClient(),
    adminClient(),
    multiSessionClient(),
    deviceAuthorizationClient(),
    lastLoginMethodClient(),
    {
      id: 'next-cookies',
      fetchPlugins: [{
        id: 'next-cookies-request',
        name: 'next-cookies-request',
        hooks: {
          async onRequest(ctx) {
            if (typeof window === 'undefined') {
              const { cookies } = await import('next/headers');
              const headers = await cookies();
              ctx.headers.set('cookie', headers.toString());
            }
          }
        }
      }]
    }
  ]
});

export const {
  signUp,
  signIn,
  signOut,
  useSession,
  organization,
  useListOrganizations,
  useActiveOrganization,
  useActiveMember,
  useActiveMemberRole
} = authClient;
