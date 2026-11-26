import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadAnalysis } from './load-analysis.mjs';
import { pageSignature } from './page-signature.mjs';

const { investigation: a, deskRef } = await loadAnalysis();
const output = new URL('../../evidence/', import.meta.url);
await mkdir(output, { recursive: true });
const input = await readFile(new URL('../src/lib/data/reports-4471.json', import.meta.url));
const result = {
  input: 'support-kb/src/lib/data/reports-4471.json',
  inputSha256: createHash('sha256').update(input).digest('hex'),
  observedThrough: a.observedThrough,
  originalRows: JSON.parse(input).length,
  uniqueReports: a.reportCount,
  overlappingRows: a.repeatedRows,
  intakeDisagreements: a.mislabeledReports,
  deskRef: deskRef.deskRef(await pageSignature()),
  firstReceived: a.oldestReceived,
  firstMerged: a.firstMerged,
  reportsBeforeFirstMergeDay: a.beforeFirstMerge,
  reportsAfterIncidentReview: a.afterIncidentReview,
  ambiguousReportIds: a.oneDayReports.map((r) => r.id),
  groups: a.causeGroups.map((g) => ({
    cause: g.cause,
    reports: g.reports.length,
    tenants: g.tenants,
    firstReceived: g.firstSeen,
    lastReceived: g.lastSeen,
    intakeTags: g.taggedAs,
    reportIds: g.reports.map((r) => r.id)
  }))
};
await writeFile(new URL('analysis.json', output), JSON.stringify(result, null, 2) + '\n');

const descriptions = {
  parser: {
    title: '[#4471 split] Shared date parser ignores day-first tenant locale — 379 reports',
    mechanism: 'The shared parser reads every date month-first for tenants that write day-first. App/email reports and non-conflicting form paths belong here. Browser locale and intake tags are not the source of truth.',
    reproduction: '1. Use Harbour Dental (`en-GB`, booking-v2) through the app.\n2. Enter `07/04/2026`, intending 7 April.\n3. Generate the invite and inspect its calendar date.\n\nExpected: 7 April. Reported failure: 4 July. `R-41200` describes that swap. These are proposed product-verification steps based on the export; the booking application itself is not included.',
    fix: 'Make the shared parser honor the tenant date convention. Add regression tests for ambiguous day-first values, unambiguous day-first values, invalid values, and month-first control tenants. Check app, email, and relevant form paths. Do not close the booking-v3 hint issue as a side effect.',
    uncertainty: 'The five reports in `desk-notes.json` describe unusual symptoms, including one-day moves. All five are included here by the supplied tenant-based rule, not proven to have this mechanism. Obtain the entered value, stored date/time, timezones, and invite payload before reclassifying; no third root cause is established.'
  },
  hint: {
    title: '[#4471 split] Booking-v3 date hint conflicts with day-first parsing — 33 reports',
    mechanism: 'Booking-v3 displays `MM/DD/YYYY` but parses form input using the tenant’s day-first locale. This is a distinct form-hint contract defect, not the shared-parser path. It affects form reports for Alder Physio, Copper Studio, and Pale Harbour.',
    reproduction: '1. Use Alder Physio (`de-DE`, booking-v3), via the booking form.\n2. Follow the displayed `MM/DD/YYYY` hint and enter `08/06/2026`, intending 6 August.\n3. Submit the form and inspect the resulting date.\n\nExpected: 6 August, matching the displayed hint. The described form behavior reads 8 June. `R-41241` reports the 8 June / 6 August mismatch. These are proposed product-verification steps; the booking application itself is not included.',
    fix: 'Make the date hint and input interpretation agree for the tenant. Test all three booking-v3 tenants, ambiguous values, and booking-v2 controls. Separately verify app/email for the same tenants, which remain in the parser issue. A parser-only fix does not establish that the hint is fixed.',
    uncertainty: 'The count follows tenant locale, form version, and entry channel. It is not the count of reports tagged `hint`: intake guessed from the reporter’s browser and disagrees with this cause on some records.'
  }
};
await mkdir(new URL('../../issues/', import.meta.url), { recursive: true });
for (const group of result.groups) {
  const d = descriptions[group.cause];
  const text = `# ${d.title}\n\n## Scope and count\n\n**${group.reports} unique reports** merged into course ticket #4471, across **${group.tenants} tenants**; received **${group.firstReceived} through ${group.lastReceived}**. These are counts from the export through ${result.observedThrough}, not today's live queue.\n\nThe full export has ${result.originalRows} rows but ${result.uniqueReports} unique report IDs. Count one report per ID; remove the ${result.overlappingRows} overlapping rows before grouping. The parser and hint counts partition all ${result.uniqueReports} reports.\n\n## Distinct problem\n\n${d.mechanism}\n\n## Proposed reproduction and expected result\n\n${d.reproduction}\n\n## Fix and acceptance checks\n\n${d.fix}\n\n- [ ] Reproduce the reported behavior against the product.\n- [ ] Implement the independent fix and regression tests.\n- [ ] Reclassify a fresh export before changing the current queue.\n- [ ] Keep this issue separate from the other #4471 mechanism.\n\n## Limits and ambiguous evidence\n\n${d.uncertainty}\n\n## Evidence and counting method\n\n- Source reports: [reports-4471.json](../blob/main/support-kb/src/lib/data/reports-4471.json).\n- Tenant directory: [tenants](../tree/main/support-kb/src/lib/data/tenants).\n- Executed classification: [causes.ts](../blob/main/support-kb/src/lib/kb/causes.ts), especially \`uniqueById\`, \`dayFirst\`, \`causeOf\`, and \`groupByCause\`.\n- Intake tags within this group: ${Object.entries(group.intakeTags).map(([tag, n]) => `\`${tag}\`: ${n}`).join('; ')}. Labels are comparison data, not the cause rule.\n- [Machine-readable analysis and complete ID partition](../blob/main/evidence/analysis.json).\n- [Signed KB investigation](../blob/main/support-kb/src/routes/kb/incidents/4471-review/+page.svx).\n\n## Covered report IDs\n\n${group.reportIds.map((id) => `\`${id}\``).join(', ')}\n`;
  // Absolute links also work when this Markdown is submitted as a GitHub issue body.
  const body = text.replaceAll('(../blob/', '(https://github.com/Sakadin/megadevpepe/blob/').replaceAll('(../tree/', '(https://github.com/Sakadin/megadevpepe/tree/');
  await writeFile(new URL(`../../issues/${group.cause}.md`, import.meta.url), body);
}
console.log(`Executed original tenant-aware rules: ${result.uniqueReports} reports, ${result.groups.map((g) => `${g.cause}=${g.reports}`).join(', ')}.`);
console.log(`Removed ${result.overlappingRows} overlapping rows; ${result.intakeDisagreements} intake disagreements; ${result.ambiguousReportIds.length} ambiguous reports retained.`);
console.log(`Desk reference: ${result.deskRef}`);
console.log('Wrote evidence/analysis.json and two issue bodies.');
