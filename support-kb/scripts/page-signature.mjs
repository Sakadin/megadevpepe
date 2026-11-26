import { readFile } from 'node:fs/promises';

export async function pageSignature() {
  const page = await readFile(new URL('../src/routes/kb/incidents/4471-review/+page.svx', import.meta.url), 'utf8');
  const signature = /^signature: (\S+)$/m.exec(page)?.[1];
  if (!signature) throw new Error('The investigation page needs its course-issued signature');
  return signature;
}
