// Bundles server.ts into server-dist/server.js for production (Hostinger Node.js hosting).
import { build } from 'esbuild';

await build({
  entryPoints: ['server.ts'],
  outfile: 'server-dist/server.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  packages: 'external',
  sourcemap: false,
  logLevel: 'info',
  // Default to production when running the bundled server (can still be overridden)
  banner: {
    js: "process.env.NODE_ENV = process.env.NODE_ENV || 'production';",
  },
});
