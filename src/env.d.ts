// The Workers runtime provides `cloudflare:workers`, but @astrojs/cloudflare
// ships no types for it. Declares only the bindings this project touches, so a
// typo in a binding name is a compile error rather than a production surprise.
declare module 'cloudflare:workers' {
  export const env: {
    INQUIRIES?: {
      put(key: string, value: string): Promise<void>;
    };
  };
}
