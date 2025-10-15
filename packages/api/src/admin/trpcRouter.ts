import { router } from '@/trpc';
import { adminProcedure } from './adminMiddleware';
import { deletePlatformSetting, deletePlatformSettingSchema } from './settings/deletePlatformSetting';
import { listPlatformSettings, listPlatformSettingsSchema } from './settings/listPlatformSettings';
import { updatePlatformSetting, updatePlatformSettingSchema } from './settings/updatePlatformSetting';
import { listUsers, listUsersSchema } from './users/listUsers';

export const adminRouter = router({
  // Platform settings management routes
  listPlatformSettings: adminProcedure
    .input(listPlatformSettingsSchema)
    .query(async ({ input }) => {
      return listPlatformSettings(input);
    }),

  updatePlatformSetting: adminProcedure
    .input(updatePlatformSettingSchema)
    .mutation(async ({ input }) => {
      return updatePlatformSetting(input);
    }),

  deletePlatformSetting: adminProcedure
    .input(deletePlatformSettingSchema)
    .mutation(async ({ input }) => {
      return deletePlatformSetting(input);
    }),

  // User management routes
  listUsers: adminProcedure
    .input(listUsersSchema)
    .query(async ({ input }) => {
      return listUsers(input);
    })
});
