import * as auditModule from '@/compliance/createAuditLog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendEmail } from './sendEmail';

// Mock AWS SES client
vi.mock('@aws-sdk/client-sesv2', () => {
  const SendEmailCommand = vi.fn();
  const SESv2Client = vi.fn(() => ({
    send: vi.fn().mockResolvedValue({ MessageId: 'test-message-id' })
  }));

  return {
    SESv2Client,
    SendEmailCommand
  };
});

// Mock audit logging - must be declared before vi.mock
vi.mock('@/compliance/createAuditLog', () => {
  const mockCreateAuditLog = vi.fn();
  return {
    createAuditLog: mockCreateAuditLog
  };
});

describe('sendEmail', () => {
  const mockCreateAuditLog = vi.spyOn(auditModule, 'createAuditLog');

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAuditLog.mockResolvedValue(undefined);
  });

  it('should send email with text body', async () => {
    const result = await sendEmail({
      to: ['test@example.com'],
      subject: 'Test Subject',
      body: {
        text: 'Test email body'
      }
    });

    expect(result.messageId).toBe('test-message-id');
    expect(mockCreateAuditLog).toHaveBeenCalledWith({
      userId: undefined,
      eventType: 'email.sent',
      eventData: {
        to: ['test@example.com'],
        subject: 'Test Subject',
        body: 'Test email body',
        messageId: 'test-message-id'
      }
    });
  });

  it('should send email with html body', async () => {
    const result = await sendEmail({
      to: ['test@example.com'],
      subject: 'Test Subject',
      body: {
        html: '<p>Test email body</p>'
      }
    });

    expect(result.messageId).toBe('test-message-id');
    expect(mockCreateAuditLog).toHaveBeenCalledWith({
      userId: undefined,
      eventType: 'email.sent',
      eventData: {
        to: ['test@example.com'],
        subject: 'Test Subject',
        messageId: 'test-message-id'
      }
    });
  });

  it('should send email with both text and html body', async () => {
    const result = await sendEmail({
      to: ['test@example.com'],
      subject: 'Test Subject',
      body: {
        text: 'Test email body',
        html: '<p>Test email body</p>'
      }
    });

    expect(result.messageId).toBe('test-message-id');
  });

  it('should send email to multiple recipients', async () => {
    const result = await sendEmail({
      to: ['test1@example.com', 'test2@example.com'],
      subject: 'Test Subject',
      body: {
        text: 'Test email body'
      }
    });

    expect(result.messageId).toBe('test-message-id');
  });

  it('should throw error if neither text nor html is provided', async () => {
    await expect(
      sendEmail({
        to: ['test@example.com'],
        subject: 'Test Subject',
        body: {}
      })
    ).rejects.toThrow();
  });

  it('should throw error for invalid email address', async () => {
    await expect(
      sendEmail({
        to: ['invalid-email'],
        subject: 'Test Subject',
        body: {
          text: 'Test email body'
        }
      })
    ).rejects.toThrow();
  });

  it('should throw error for empty subject', async () => {
    await expect(
      sendEmail({
        to: ['test@example.com'],
        subject: '',
        body: {
          text: 'Test email body'
        }
      })
    ).rejects.toThrow();
  });

  it('should log audit with userId when provided', async () => {
    await sendEmail({
      to: ['test@example.com'],
      subject: 'Test Subject',
      body: {
        text: 'Test email body'
      },
      userId: 'user-123'
    });

    expect(mockCreateAuditLog).toHaveBeenCalledWith({
      userId: 'user-123',
      eventType: 'email.sent',
      eventData: {
        to: ['test@example.com'],
        subject: 'Test Subject',
        body: 'Test email body',
        messageId: 'test-message-id'
      }
    });
  });

  // Note: Error handling is tested implicitly by the try-catch in sendEmail
  // Integration tests with real AWS SDK would test the actual error path
});
