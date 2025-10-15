import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authHandler } from './auth/authHandler';
import { HonoEnv } from './hono';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { sessionMiddleware } from './middleware/sessionMiddleware';
import { fileAccessHandler } from './storage/fileAccessHandler';
import { createTrpcHandler } from './trpc/trpcHandler';

const app = new Hono<HonoEnv>();

// CORS configuration
app.use(cors({
  origin(origin) {
    return origin;
  },
  credentials: true
}));

// Request logging middleware and Global session middleware
app.use('*',
  loggerMiddleware, //
  sessionMiddleware
);

// Health check endpoint
app.get('/api/health', (ctx) => {
  return ctx.json({ status: 'ok' });
});

// Authentication routes (Better Auth)
app.on(['POST', 'GET'], '/api/auth/**', authHandler);

// File access endpoint (presigned URL generation with access validation)
app.get('/api/files/*', fileAccessHandler);

// tRPC API routes
app.use('/api/trpc/*', createTrpcHandler());

export default app;
