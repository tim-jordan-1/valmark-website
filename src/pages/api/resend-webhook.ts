import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('svix-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 401 });
  }

  try {
    const payload = await request.json();
    const { type, data } = payload;

    switch (type) {
      case 'email.sent':
        console.log(`[resend] Email sent: ${data.email_id} to ${data.to}`);
        break;
      case 'email.delivered':
        console.log(`[resend] Email delivered: ${data.email_id} to ${data.to}`);
        break;
      case 'email.bounced':
        console.error(`[resend] Email bounced: ${data.email_id} to ${data.to} — ${data.bounce?.description}`);
        break;
      case 'email.complained':
        console.error(`[resend] Spam complaint: ${data.email_id} from ${data.to}`);
        break;
      default:
        console.log(`[resend] Webhook event: ${type}`);
    }

    return new Response('OK', { status: 200 });
  } catch {
    return new Response('Invalid payload', { status: 400 });
  }
};
