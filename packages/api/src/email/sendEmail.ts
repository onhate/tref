import { createAuditLog } from '@/compliance/createAuditLog';
import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { z } from 'zod';

const client = new SESv2Client();

export const sendEmailSchema = z.object({
  to: z.array(z.email()),
  subject: z.string().min(1),
  body: z.object({
    text: z.string().optional(),
    html: z.string().optional()
  }).refine(
    (data) => data.text || data.html,
    { message: 'Either text or html body must be provided' }
  ),
  userId: z.string().optional()
});

/**
 * Sends an email using AWS SES v2 and logs to audit trail
 * @param rawInput - Email configuration with recipients, subject, body, and optional userId
 * @returns Promise with the message ID from SES
 */
export async function sendEmail(rawInput: z.input<typeof sendEmailSchema>) {
  const input = sendEmailSchema.parse(rawInput);

  if (process.env.seeding) {
    return {
      messageId: 'SKIPPED'
    };
  }

  const senderDomain = 'noop.noop'; // Resource.Email.sender;
  try {
    const command = new SendEmailCommand({
      FromEmailAddress: `no-reply@${senderDomain}`,
      Destination: {
        ToAddresses: input.to
      },
      Content: {
        Simple: {
          Subject: { Data: input.subject },
          Body: {
            ...(input.body.text && { Text: { Data: input.body.text } }),
            ...(input.body.html && { Html: { Data: input.body.html } })
          }
        }
      }
    });

    const response = await client.send(command);

    // Log successful email send to audit trail
    await createAuditLog({
      userId: input.userId,
      eventType: 'email.sent',
      eventData: {
        to: input.to,
        subject: input.subject,
        body: input.body.text,
        messageId: response.MessageId
      }
    });

    return {
      messageId: response.MessageId
    };
  } catch (error) {
    // Log failed email send to audit trail
    await createAuditLog({
      userId: input.userId,
      eventType: 'email.failed',
      eventData: {
        to: input.to,
        subject: input.subject,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    throw error;
  }
}
