import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

export async function loadAnalysis() {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../', import.meta.url)),
    resolve: { alias: { '#lib': fileURLToPath(new URL('../src/lib', import.meta.url)) } },
    server: { middlewareMode: true, watch: null },
    optimizeDeps: { noDiscovery: true }
  });
  try {
    const [investigation, causes, locales, reports, tenants, cases, deskRef] = await Promise.all([
      server.ssrLoadModule('/src/lib/kb/investigation.ts'),
      server.ssrLoadModule('/src/lib/kb/causes.ts'),
      server.ssrLoadModule('/src/lib/kb/locales.ts'),
      server.ssrLoadModule('/src/lib/data/reports-4471.json'),
      server.ssrLoadModule('/src/lib/data/tenants/alder.physio.json'),
      server.ssrLoadModule('/src/lib/kb/dedupe-cases.ts'),
      server.ssrLoadModule('/src/lib/kb/desk-ref.ts')
    ]);
    return { investigation, causes, locales, reports: reports.default, alder: tenants.default, cases, deskRef };
  } finally {
    await server.close();
  }
}
