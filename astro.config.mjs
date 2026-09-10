import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
  security: {
    allowedDomains: [
      { hostname: '**.pages.dev', protocol: 'https' },
      { hostname: 'valmark.com.au', protocol: 'https' },
      { hostname: '**.valmark.com.au', protocol: 'https' },
    ],
  },
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
      },
    },
  },
});
