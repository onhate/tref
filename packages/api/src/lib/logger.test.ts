import { beforeEach, describe, expect, it } from 'vitest';
import { logger } from './logger';

describe('logger with AsyncLocalStorage', () => {
  beforeEach(() => {
    // Clear metadata before each test
    logger.clearMeta();
  });

  describe('basic logger functionality', () => {
    it('should have all log methods', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeTypeOf('function');
      expect(logger.error).toBeTypeOf('function');
      expect(logger.warn).toBeTypeOf('function');
      expect(logger.debug).toBeTypeOf('function');
      expect(logger.fatal).toBeTypeOf('function');
      expect(logger.trace).toBeTypeOf('function');
    });

    it('should allow logging without throwing', () => {
      expect(() => {
        logger.info({ userId: '123' }, 'Test message');
      }).not.toThrow();

      expect(() => {
        logger.error({ error: new Error('test') }, 'Error occurred');
      }).not.toThrow();
    });
  });

  describe('initContext', () => {
    it('should initialize context with metadata', () => {
      logger.initContext({ requestId: 'req-123' });

      const meta = logger.getMeta();
      expect(meta).toEqual({ requestId: 'req-123' });
    });

    it('should replace existing context when called again', () => {
      logger.initContext({ requestId: 'req-123' });
      logger.initContext({ requestId: 'req-456' });

      const meta = logger.getMeta();
      expect(meta).toEqual({ requestId: 'req-456' });
    });

    it('should accept multiple properties', () => {
      logger.initContext({
        requestId: 'req-123',
        environment: 'test',
        version: '1.0.0'
      });

      const meta = logger.getMeta();
      expect(meta).toEqual({
        requestId: 'req-123',
        environment: 'test',
        version: '1.0.0'
      });
    });
  });

  describe('addMeta', () => {
    it('should accumulate metadata', () => {
      logger.initContext({ requestId: 'req-123' });
      logger.addMeta({ userId: 'user-456' });
      logger.addMeta({ functionName: 'testFunction' });

      const meta = logger.getMeta();
      expect(meta).toEqual({
        requestId: 'req-123',
        userId: 'user-456',
        functionName: 'testFunction'
      });
    });

    it('should overwrite existing keys', () => {
      logger.initContext({ requestId: 'req-123', level: 1 });
      logger.addMeta({ requestId: 'req-456', level: 2 });

      const meta = logger.getMeta();
      expect(meta).toEqual({ requestId: 'req-456', level: 2 });
    });

    it('should work without prior initContext', () => {
      logger.addMeta({ userId: 'user-123' });

      const meta = logger.getMeta();
      expect(meta).toEqual({ userId: 'user-123' });
    });

    it('should handle multiple calls in sequence', () => {
      logger.addMeta({ a: 1 });
      logger.addMeta({ b: 2 });
      logger.addMeta({ c: 3 });

      const meta = logger.getMeta();
      expect(meta).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe('getMeta', () => {
    it('should return empty object when no context', () => {
      const meta = logger.getMeta();
      expect(meta).toEqual({});
    });

    it('should return current accumulated metadata', () => {
      logger.initContext({ requestId: 'req-123' });
      logger.addMeta({ userId: 'user-456' });

      const meta = logger.getMeta();
      expect(meta).toEqual({
        requestId: 'req-123',
        userId: 'user-456'
      });
    });
  });

  describe('clearMeta', () => {
    it('should clear all metadata', () => {
      logger.initContext({ requestId: 'req-123' });
      logger.addMeta({ userId: 'user-456' });
      logger.clearMeta();

      const meta = logger.getMeta();
      expect(meta).toEqual({});
    });
  });

  describe('metadata accumulation in call chain', () => {
    function level1() {
      logger.addMeta({ level: 'level1' });
      return logger.getMeta();
    }

    function level2() {
      logger.addMeta({ level: 'level2', functionName: 'level2' });
      return level1();
    }

    function level3() {
      logger.addMeta({ level: 'level3', functionName: 'level3' });
      return level2();
    }

    it('should accumulate metadata through nested function calls', () => {
      logger.initContext({ requestId: 'req-123' });

      const meta = level3();

      // level3 sets level and functionName
      // level2 overwrites both
      // level1 overwrites level again
      expect(meta).toEqual({
        requestId: 'req-123',
        level: 'level1',
        functionName: 'level2'
      });
    });
  });

  describe('AsyncLocalStorage isolation', () => {
    it('should isolate contexts in async operations', async () => {
      // Simulate two concurrent requests
      const request1 = async () => {
        logger.initContext({ requestId: 'req-1' });
        await new Promise(resolve => setTimeout(resolve, 10));
        logger.addMeta({ userId: 'user-1' });
        return logger.getMeta();
      };

      const request2 = async () => {
        logger.initContext({ requestId: 'req-2' });
        await new Promise(resolve => setTimeout(resolve, 5));
        logger.addMeta({ userId: 'user-2' });
        return logger.getMeta();
      };

      const [meta1, meta2] = await Promise.all([request1(), request2()]);

      expect(meta1).toEqual({ requestId: 'req-1', userId: 'user-1' });
      expect(meta2).toEqual({ requestId: 'req-2', userId: 'user-2' });
    });
  });

  describe('real-world usage patterns', () => {
    it('should support middleware → handler → function pattern', () => {
      // Simulate middleware
      function middleware() {
        logger.initContext({ requestId: 'req-123' });
      }

      // Simulate session middleware
      function sessionMiddleware() {
        logger.addMeta({ userId: 'user-456' });
      }

      // Simulate business function
      function updateProfile() {
        logger.addMeta({ functionName: 'updateProfile' });
        return logger.getMeta();
      }

      middleware();
      sessionMiddleware();
      const meta = updateProfile();

      expect(meta).toEqual({
        requestId: 'req-123',
        userId: 'user-456',
        functionName: 'updateProfile'
      });
    });

    it('should support webhook handler pattern', () => {
      // Webhook middleware
      logger.initContext({ requestId: 'webhook-req-123' });

      // Webhook handler
      logger.addMeta({
        functionName: 'stripeWebhookHandler',
        eventType: 'payment_intent.succeeded'
      });

      // Specific event handler
      logger.addMeta({
        functionName: 'handlePaymentIntentSucceeded',
        paymentIntentId: 'pi_123'
      });

      // After finding case
      logger.addMeta({
        caseId: 'case-456',
        patientId: 'patient-789'
      });

      const meta = logger.getMeta();

      expect(meta).toEqual({
        requestId: 'webhook-req-123',
        functionName: 'handlePaymentIntentSucceeded', // Overwritten
        eventType: 'payment_intent.succeeded',
        paymentIntentId: 'pi_123',
        caseId: 'case-456',
        patientId: 'patient-789'
      });
    });
  });

  describe('backwards compatibility', () => {
    it('should support child method on logger', () => {
      const child = logger.child({ userId: 'user-456' });

      expect(child).toBeDefined();
      expect(child.info).toBeTypeOf('function');
    });
  });
});
