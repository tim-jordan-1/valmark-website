import { defineAction, type ActionAPIContext } from 'astro:actions';
import { z } from 'astro/zod';
import { Resend } from 'resend';
import { kv } from '@vercel/kv';
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

const inquirySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(6, 'Phone number is required').max(20),
  service: z.enum(SERVICE_NAMES, {
    errorMap: () => ({ message: 'Please select a service' }),
  }),
  message: z.string().max(5000).optional().default(''),
  source: z.enum(['lead-form', 'contact-form']).optional().default('contact-form'),
  honeypot: z.string().max(0, 'Bot detected').optional().default(''),
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
        message: input.message,
        source: input.source,
        timestamp,
      };

      const [notification, confirmation] = await Promise.allSettled([
        resend.emails.send({
          from: 'Valmark Website <noreply@valmark.com.au>',
          replyTo: input.email,
          to: ['admin@valmark.com.au'],
          subject: `New inquiry: ${input.service} — ${input.name}`,
          html: inquiryNotificationHtml(inquiryData),
          text: inquiryNotificationText(inquiryData),
        }),
        resend.emails.send({
          from: 'Valmark Waterproofing <noreply@valmark.com.au>',
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

      // Store inquiry in Vercel KV (best-effort, non-blocking)
      try {
        if (process.env.KV_REST_API_URL) {
          await kv.lpush('inquiries', JSON.stringify({
            ...inquiryData,
            id: crypto.randomUUID(),
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
