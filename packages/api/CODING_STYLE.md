# API Module Coding Style Guide

## Architecture: Function-Based Modules

Each function is isolated in its own file for better modularity and testability. **No class-based services**.

### File Structure

```
module/
├── dbSchema.ts              # Database schema definitions
├── functionName.ts          # Individual function files
├── functionName.test.ts     # Tests co-located with functions
├── getEntity.ts            # Shared utilities
└── trpcRouter.ts           # tRPC router definitions
```

### Function File Pattern

```typescript
// functionName.ts
import { db } from '@/db/db';
import { z } from 'zod';

// 1. Schema definition
export const functionNameSchema = z.object({
  field: z.string()
});

/**
 * 2. JSDoc comment
 */
export async function functionName(
  userId: string,
  rawInput: z.input<typeof functionNameSchema> // follow strictley the naming convention
) {
  // 3. Parse input
  const input = functionNameSchema.parse(rawInput); // follow strictley the naming convention

  // 4. Implementation
  const result = await db.update(table).set(input).where(eq(table.id, userId));

  return result;
}
```

**Key Principles:**

- One function per file (file name = function name)
- Schema co-located with function
- Named exports only (no default exports)
- Use `z.input<typeof schema>` for parameters
- Parse with `schema.parse(rawInput)` as first step

---

## Testing Pattern

Use **real database connections** - no mocks (except external services like S3).

```typescript
// functionName.test.ts
import { describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { functionName } from './functionName';

describe('functionName', () => {
  it('should do something', async () => {
    // 1. Insert test data
    const [testUser] = await db.insert(user).values({
      id: 'test-id',
      email: 'test@example.com',
      role: 'patient'
    }).returning();

    // 2. Call function
    const result = await functionName(testUser.id, { /* input */ });

    // 3. Assert
    expect(result).toEqual({ /* expected */ });

    // 4. Verify database state
    const updated = await db.query.user.findFirst({
      where: eq(user.id, testUser.id)
    });
    expect(updated?.field).toBe('expected value');
  });
});
```

**Principles:**

- Real database with auto-cleanup (via Vitest)
- Verify both return values and database state
- Mock external services only (S3, Stripe, etc.)

---

## Database Patterns

### Schema with Indexes

Use **array syntax** for indexes:

```typescript
// ✅ CORRECT
export const doctorProfiles = pgTable('doctor_profiles', {
  userId: text('user_id').primaryKey(),
  crmNumber: text('crm_number').notNull(),
  status: doctorStatusEnum('status').notNull().default('onboarding'),
}, (table) => [
  index('doctor_profiles_crm_idx').on(table.crmNumber),
  index('doctor_profiles_status_idx').on(table.status),
  // Composite indexes
  index('doctor_profiles_matching_idx').on(
    table.status,
    table.availabilityStatus,
    table.avgRating.desc()
  )
]);
```

**Avoid:** Object syntax `(table) => ({ key: index(...) })`

### Partial Updates

Drizzle **ignores `undefined`** values but throws error if **all** values are undefined. Use guard:

```typescript
import { isEmptyUpdate } from '@/lib/helpers';

export async function updateProfile(userId: string, rawInput: z.input<typeof schema>) {
  const input = schema.parse(rawInput);

  const updates = {
    name: input.name,     // optional
    phone: input.phone,   // optional
    email: input.email    // optional
  };

  // Guard against empty updates
  if (isEmptyUpdate(updates)) {
    return { success: true }; // or throw TRPCError as appropriate
  }

  await db.update(users).set(updates).where(eq(users.id, userId));
  return { success: true };
}
```

**Key Points:**

- Drizzle automatically ignores `undefined` values
- `isEmptyUpdate()` prevents "No values to update" error
- `null` is valid (sets NULL), `undefined` is ignored
- Choose return vs throw based on function semantics

---

## Shared Utilities

Create reusable functions for common operations:

```typescript
// getUser.ts
import { db } from '@/db/db';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';

export async function getUser(userId: string): Promise<typeof user.$inferSelect>;
export async function getUser(
  userId: string,
  options: { includePatientProfile: true }
): Promise<typeof user.$inferSelect & { patientProfile: any }>;

export async function getUser(userId: string, options?: { includePatientProfile?: boolean }) {
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    ...(options?.includePatientProfile && {
      with: { patientProfile: true }
    })
  });

  if (!currentUser) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Usuário não encontrado'
    });
  }

  return currentUser;
}
```

**Benefits:** DRY, type-safe overloads, consistent error handling

---

## tRPC Router Pattern

```typescript
// trpcRouter.ts
import { router, trpcProtected } from '@/trpc';
import { functionName, functionNameSchema } from './functionName';

export const moduleRouter = router({
  functionName: trpcProtected
    .input(functionNameSchema)
    .mutation(async ({ ctx, input }) => {
      return functionName(ctx.user.id, input);
    })
});
```

---

## Error Handling

### Always Use TRPCError

```typescript
// ✅ CORRECT
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Usuário não encontrado'
});

// ❌ INCORRECT
throw new Error('User not found');
```

### Error Messages in Portuguese

All error messages must be in **Portuguese (pt-BR)** - the platform's primary language.

**Common Codes:**

| Code                    | Usage              | Example (pt-BR)                         |
|-------------------------|--------------------|-----------------------------------------|
| `BAD_REQUEST`           | Invalid input      | "Dados inválidos"                       |
| `UNAUTHORIZED`          | Auth required      | "Autenticação necessária"               |
| `FORBIDDEN`             | No permission      | "Você não tem permissão para esta ação" |
| `NOT_FOUND`             | Resource missing   | "Recurso não encontrado"                |
| `CONFLICT`              | Resource conflict  | "Conflito de dados"                     |
| `PRECONDITION_FAILED`   | Precondition unmet | "Operação não pode ser completada"      |
| `INTERNAL_SERVER_ERROR` | Server error       | "Erro interno do servidor"              |

**Guidelines:**

- Be specific and helpful
- Use Portuguese
- Avoid technical jargon
- Consider how users see the error

---

## Logging

### Overview

Uses **Pino** for structured JSON logging:

- JSON in production (for log aggregation)
- Pretty-printed in development
- AWS Lambda compatible
- Automatic error serialization

### Basic Usage

```typescript
import { logger } from '@/lib/logger';

// Info (general operations)
logger.info('User logged in', { userId: '123' });

// Error (with automatic serialization)
logger.error({ error }, 'Failed to process payment');

// Warning (non-critical)
logger.warn('Payment intent expired, creating new one');

// Debug (detailed info)
logger.debug({ data }, 'Intermediate calculation');
```

### Contextual Logging (Recommended)

Use `logger.addMeta()` to add context that persists in all subsequent logs:

```typescript
export async function updateProfile(userId: string, rawInput: z.input<typeof schema>) {
  // Add metadata at function start
  logger.addMeta({
    functionName: 'updateProfile',
    userId,
  });

  const input = schema.parse(rawInput);
  logger.info('Starting profile update', { fields: Object.keys(input) });

  try {
    const result = await db.update(users).set(input).where(eq(users.id, userId));
    logger.info('Profile updated successfully');
    return result;
  } catch (error) {
    logger.error({ error }, 'Failed to update profile');
    throw error;
  }
}
```

### Standard Context Fields

```typescript
interface LogContext {
  userId?: string;
  requestId?: string;        // Auto-added by middleware
  caseId?: string;
  doctorId?: string;
  patientId?: string;
  functionName?: string;
  paymentIntentId?: string;
  stripeAccountId?: string;

  [key: string]: unknown;    // Custom fields supported
}
```

### Log Levels

| Level   | Use Case                 | Example                                |
|---------|--------------------------|----------------------------------------|
| `info`  | Normal operations        | "Payment confirmed", "User registered" |
| `error` | Errors needing attention | "Payment failed", "DB error"           |
| `warn`  | Non-critical issues      | "No push token", "Intent expired"      |
| `debug` | Detailed diagnostics     | "Cache hit", "Intermediate value"      |

**Default:** Production shows `info+`, Dev/Test shows all levels.

### Best Practices

**✅ DO:**

```typescript
// Use contextual logging
logger.addMeta({ functionName: 'handlePayment', caseId });
logger.info('Payment processing started');

// Structured data
logger.info({ amount, currency }, 'Payment intent created');

// Log errors with object for stack traces
logger.error({ error }, 'Failed to send notification');

// Build context progressively
logger.addMeta({ paymentIntentId: pi.id });
logger.info('Payment confirmed');
```

**❌ DON'T:**

```typescript
// Don't use console.log
console.log('User logged in'); // ❌

// Don't log sensitive data
logger.info({ password, creditCard }, 'User data'); // ❌

// Don't use string concatenation (use structured data)
logger.info(`Payment ${id} failed`); // ❌
logger.info({ paymentId: id }, 'Payment failed'); // ✅

// Don't create new error after logging
logger.error({ error }, 'Failed');
throw new Error('Failed'); // ❌
```

### Examples

**Webhook with Context:**

```typescript
export async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  logger.addMeta({
    functionName: 'handlePaymentIntentSucceeded',
    paymentIntentId: paymentIntent.id,
  });

  const caseRecord = await findCase(paymentIntent.id);

  if (!caseRecord) {
    logger.error('Case not found for Payment Intent');
    return;
  }

  logger.addMeta({
    caseId: caseRecord.id,
    patientId: caseRecord.patientId,
    doctorId: caseRecord.doctorId,
  });

  if (caseRecord.status === 'submitted') {
    logger.info('Case already submitted, skipping');
    return;
  }

  await updateCase(caseRecord.id);
  logger.info('Payment confirmed for case');
}
```

**Non-Throwing Error:**

```typescript
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  logger.addMeta({ functionName: 'createAuditLog' });

  try {
    await db.insert(auditLogs).values(input);
  } catch (error) {
    // Log but don't throw - audit logging shouldn't break main flow
    logger.error({ error }, 'Failed to log audit event');
  }
}
```

### When NOT to Log

- **Test files** - Use `console.log` for debugging tests
- **Seed scripts** - Scripts can use `console.log`
- **Sensitive data** - No passwords, tokens, credit cards, PHI
- **Tight loops** - Avoid high-frequency logging
- **Request/response cycles** - Handled by middleware

---

## Complete Example

```
users/
├── dbSchema.ts
├── getUser.ts                      # Shared utility
├── getUser.test.ts
├── getProfile.ts
├── getProfile.test.ts
├── updateProfile.ts
├── updateProfile.test.ts
├── updatePatientProfile.ts
├── updatePatientProfile.test.ts
├── createPhotoUploadUrl.ts
├── createPhotoUploadUrl.test.ts
├── confirmPhotoUpload.ts
├── confirmPhotoUpload.test.ts
└── trpcRouter.ts
```

---

## Benefits

- ✅ Better modularity - independently testable
- ✅ Clearer dependencies - explicit imports
- ✅ Easier navigation - file names match functions
- ✅ Better testing - real DB integration catches bugs
- ✅ No DI complexity - direct function calls
- ✅ Tree-shaking friendly - import only what you need
