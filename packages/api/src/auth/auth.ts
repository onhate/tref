import { user } from '@/auth/dbSchema';
import { db } from '@/db/db';
import { sendEmail } from '@/email/sendEmail';
import { emailVerificationTemplate, passwordResetEmailTemplate } from '@/email/templates';
import { Auth, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
  admin,
  anonymous,
  bearer,
  deviceAuthorization,
  haveIBeenPwned,
  lastLoginMethod,
  multiSession,
  organization
} from 'better-auth/plugins';
import { Resource } from 'sst';
import { auditLoggingMiddleware } from './auditLoggingMiddleware';

export type User = typeof user.$inferSelect;

export const auth: Auth = betterAuth({
  appName: 'app',
  secret: Resource.AuthSecret.value, // comment this line when running db:auth:generate
  database: drizzleAdapter(db, {
    provider: 'pg'
  }),
  user: {
    changeEmail: {
      enabled: false
    },
    deleteUser: {
      enabled: true
    },
    additionalFields: {
      // sample: {
      //   type: 'string',
      //   required: false,
      //   input: true
      // }
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    sendVerificationOnSignUp: true,
    async sendResetPassword(data) {
      const template = passwordResetEmailTemplate({
        userName: data.user.name,
        resetUrl: data.url,
        expiryMinutes: 60 // 1-hour expiry
      });

      await sendEmail({
        to: [data.user.email],
        subject: template.subject,
        body: template.body,
        userId: data.user.id
      });
    }
  },
  emailVerification: {
    async sendVerificationEmail(data) {
      const template = emailVerificationTemplate({
        userName: data.user.name,
        verificationUrl: data.url
      });

      await sendEmail({
        to: [data.user.email],
        subject: template.subject,
        body: template.body,
        userId: data.user.id
      });
    },
    autoSignInAfterVerification: true,
    sendOnSignIn: true,
    sendOnSignUp: true
  },
  account: {
    accountLinking: {
      enabled: true
    },
    updateAccountOnSignIn: true,
    encryptOAuthTokens: true
  },
  useSecureCookies: true,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // Update session every 24 hours (sliding window)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // Cache duration in seconds
    }
  },
  plugins: [
    admin(),
    bearer(),
    haveIBeenPwned(),
    anonymous(),
    organization(),
    multiSession(),
    deviceAuthorization({
      expiresIn: '3min',
      interval: '5s'
    }),
    lastLoginMethod()
  ],
  advanced: {
    cookiePrefix: '__',
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
      httpOnly: true
    }
  },
  trustedOrigins: [
    // Mobile app schemes (Expo deep linking)
    // 'myapp://',
    // 'myapp://*',
    // Production API domain (configure before deployment)
    // 'https://api.app.noop',
    // Development
    'http://localhost:3000'
  ],
  hooks: {
    after: auditLoggingMiddleware
  }
});
