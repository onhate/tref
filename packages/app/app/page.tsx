import { SignInButton, SignInFallback } from '@/components/sign-in-btn';
import { trpc } from '@/lib/trpc';
import { Suspense } from 'react';

export default async function Home() {
  const profile = await trpc.users.getMe.query().catch(() => null);

  return (
    <div className="min-h-[80vh] flex items-center justify-center overflow-hidden no-visible-scrollbar px-6 md:px-0">
      <main className="flex flex-col gap-4 row-start-2 items-center justify-center">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-4xl text-black dark:text-white text-center">
            Hello!
          </h3>
        </div>
        <div className="md:w-10/12 w-full flex flex-col gap-4">
          {profile && <>
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-2xl text-black dark:text-white text-center">
                Welcome back, {profile.name}!
              </h3>
              <small className="text-sm text-gray-500 dark:text-gray-400 text-center">
                You are logged in as {profile.email}
              </small>
            </div>
          </>}

          {/* @ts-ignore */}
          <Suspense fallback={<SignInFallback />}>
            {/* @ts-ignore */}
            <SignInButton />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
