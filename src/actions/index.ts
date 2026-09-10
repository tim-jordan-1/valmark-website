import { defineAction, type ActionAPIContext } from 'astro:actions';
import { z } from 'astro/zod';
import { Resend } from 'resend';
import {
  inquiryNotificationHtml,
  inquiryNotificationText,
  type InquiryData,
} from '../lib/emails/inquiry-notification';
import {
  confirmationHtml,
  confirmationText,
} from '../lib/emails/inquiry-confirmation';
import { SERVICE_NAMES } from '../data/services';
import { adminEmail } from '../lib/admin-email';

// ponytail: in-memory rate limiter, resets on cold start — fine for low traffic
const submissions = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const history = (submissions.get(ip) || []).filter((t) => now - t < RATE_WINDOW);
  if (history.length >= RATE_LIMIT) return false;
  history.push(now);
  submissions.set(ip, history);
  return true;
}

// ponytail: dev mode uses Resend's test domain, prod uses verified domain
const SENDER_DOMAIN = process.env.RESEND_DOMAIN_VERIFIED === 'true'
  ? 'valmark.com.au'
  : 'resend.dev';
const NOTIFICATION_FROM = `Valmark Website <noreply@${SENDER_DOMAIN}>`;
const CONFIRMATION_FROM = `Valmark Waterproofing <noreply@${SENDER_DOMAIN}>`;

const inquirySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(6, 'Phone number is required').max(20),
  service: z.enum(SERVICE_NAMES, {
    error: 'Please select a service',
  }),
  // ponytail: .nullish(), not .optional().default(''). Astro maps a present-but-empty
  // form field to null unless the OUTERMOST validator is ZodOptional (see
  // astro/dist/actions/runtime/server.js handleFormDataGet). .default() wraps it in
  // ZodDefault, so blank fields arrived as null and failed validation.
  message: z.string().max(5000).nullish(),
  source: z.enum(['lead-form', 'contact-form']).nullish(),
  honeypot: z.string().max(0, 'Bot detected').nullish(),
});

export const server = {
  inquiry: defineAction({
    accept: 'form',
    input: inquirySchema,
    handler: async (input, context: ActionAPIContext) => {
      if (input.honeypot) {
        return { success: true };
      }

      const ip = context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      if (!checkRateLimit(ip)) {
        throw new Error('Too many submissions. Please try again later or call us on 0422 878 034.');
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      const now = new Date();
      const timestamp = now.toLocaleString('en-AU', {
        timeZone: 'Australia/Melbourne',
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      const inquiryData: InquiryData = {
        name: input.name,
        email: input.email,
        phone: input.phone,
        service: input.service,
        message: input.message ?? '',
        source: input.source ?? 'contact-form',
        timestamp,
      };

      const [notification, confirmation] = await Promise.allSettled([
        resend.emails.send({
          from: NOTIFICATION_FROM,
          replyTo: input.email,
          to: [adminEmail()],
          subject: `New inquiry: ${input.service} — ${input.name}`,
          html: inquiryNotificationHtml(inquiryData),
          text: inquiryNotificationText(inquiryData),
        }),
        resend.emails.send({
          from: CONFIRMATION_FROM,
          to: [input.email],
          subject: "We've received your inquiry — Valmark Waterproofing",
          html: confirmationHtml(input.name),
          text: confirmationText(input.name),
        }),
      ]);

      if (notification.status === 'rejected') {
        console.error('Failed to send admin notification:', notification.reason);
        throw new Error('Failed to send inquiry. Please try calling us on 0422 878 034.');
      }

      if (confirmation.status === 'rejected') {
        console.warn('Auto-reply failed (non-critical):', confirmation.reason);
      }

      // Store inquiry in Cloudflare KV (best-effort, non-blocking)
      try {
        const { env } = await import("cloudflare:workers") as { env: Record<string, any> };
        const inquiriesKv = env.INQUIRIES;
        if (inquiriesKv) {
          const key = `inquiry:${crypto.randomUUID()}`;
          await inquiriesKv.put(key, JSON.stringify({
            ...inquiryData,
            id: key,
            createdAt: now.toISOString(),
          }));
        }
      } catch (e) {
        console.warn('KV storage failed (non-critical):', e);
      }

      return { success: true };
    },
  }),
};
