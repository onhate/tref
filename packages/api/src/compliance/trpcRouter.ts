import { router, trpcProtected } from '@/trpc';
import { recordConsent, recordConsentSchema } from './recordConsent';

export const complianceRouter = router({
  recordConsent: trpcProtected
    .input(recordConsentSchema.omit({ userId: true }))
    .mutation(async ({ input, ctx }) => {
      await recordConsent({
        ...input,
        userId: ctx.user.id
      });
    })
});
