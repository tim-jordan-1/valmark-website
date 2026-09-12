import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
  security: {
    allowedDomains: [
      { hostname: '**.pages.dev', protocol: 'https' },
      { hostname: '**.workers.dev', protocol: 'https' },
      { hostname: 'valmark.com.au', protocol: 'https' },
      { hostname: '**.valmark.com.au', protocol: 'https' },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  env: {
    schema: {
      // All three are optional so a missing secret fails the inquiry request
      // with an actionable message, rather than throwing EnvInvalidVariables at
      // module load and taking every static page down with it.
      RESEND_API_KEY: {
        context: 'server',
        access: 'secret',
        type: 'string',
        optional: true,
      },
      // Must be 'secret', not 'public': public vars are inlined as string
      // literals at build time, so the domain could never be flipped by setting
      // the var at runtime. Secrets are live bindings re-read per request.
      RESEND_DOMAIN_VERIFIED: {
        context: 'server',
        access: 'secret',
        type: 'string',
        optional: true,
      },
      ADMIN_EMAIL: {
        context: 'server',
        access: 'secret',
        type: 'string',
        optional: true,
      },
    },
  },
});
