import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  env: {
    schema: {
      RESEND_API_KEY: {
        context: 'server',
        access: 'secret',
        type: 'string',
      },
      RESEND_DOMAIN_VERIFIED: {
        context: 'server',
        access: 'public',
        type: 'string',
        optional: true,
        default: 'false',
      },
      ADMIN_EMAIL: {
        context: 'server',
        access: 'public',
        type: 'string',
        optional: true,
        default: 'admin@valmark.com.au',
      },
      KV_REST_API_URL: {
        context: 'server',
        access: 'secret',
        type: 'string',
        optional: true,
      },
      KV_REST_API_TOKEN: {
        context: 'server',
        access: 'secret',
        type: 'string',
        optional: true,
      },
    },
  },
});
