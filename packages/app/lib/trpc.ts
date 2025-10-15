import { authClient } from '@/lib/auth-client';
import type { AppRouter } from '@app/api/exports';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_API_URL}/api/trpc`,
      transformer: superjson,
      // You can pass any HTTP headers you wish here
      async headers() {
        const session = await authClient.getSession();
        return {
          Authorization: session?.data?.session?.token
        };
      }
    })
  ]
});
