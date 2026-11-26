import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { loadAnalysis } from './load-analysis.mjs';

const { investigation: a, causes: c, locales: l, reports, cases, deskRef } = await loadAnalysis();
const group = (cause) => a.causeGroups.find((g) => g.cause === cause);

test('427 overlapping rows become exactly 412 report IDs in #4471', () => {
  assert.equal(reports.length, 427);
  assert.equal(a.reportCount, 412);
  assert.equal(a.repeatedRows, 15);
  assert.ok(a.mergedReports.every((r) => r.mergedInto === 4471));
  for (const r of reports) {
    assert.deepEqual(r, a.mergedReports.find((other) => other.id === r.id));
  }
});

test('execute the supplied Intl locale and cause rules, not intake guesses', () => {
  for (const handle of l.tenantHandles()) assert.equal(c.dayFirst(l.tenantOf({ tenant: handle }).locale), true);
  assert.equal(c.dayFirst('en-US'), false);
  assert.equal(a.causeGroups.length, 2);
  assert.equal(group('parser').reports.length, 379);
  assert.equal(group('hint').reports.length, 33);
  assert.equal(group('parser').tenants, 11);
  assert.equal(group('hint').tenants, 3);
  assert.equal(a.mislabeledReports, 38);
  assert.deepEqual(group('parser').taggedAs, { parser: 356, hint: 23 });
  assert.deepEqual(group('hint').taggedAs, { parser: 15, hint: 18 });
  assert.equal(a.causeGroups.reduce((n, g) => n + g.reports.length, 0), a.reportCount);
  assert.equal(new Set(a.causeGroups.flatMap((g) => g.reports.map((r) => r.id))).size, a.reportCount);
});

test('same tenant, different path: Alder form is hint; app/email are parser', () => {
  const tenant = l.tenantOf({ tenant: 'alder.physio' });
  assert.equal(c.causeOf({ channel: 'form' }, tenant), 'hint');
  assert.equal(c.causeOf({ channel: 'app' }, tenant), 'parser');
  assert.equal(c.causeOf({ channel: 'email' }, tenant), 'parser');
  assert.equal(c.causeOf({ channel: 'form' }, { ...tenant, locale: 'en-US' }), null);
  assert.equal(c.causeOf({ channel: 'email' }, undefined), null);
});

test('all five documented dedupe cases contradict subject-only reasoning where appropriate', () => {
  const actual = cases.DEDUPE_CASES.map(({ a, b }) => c.sameCause(a, l.tenantOf(a), b, l.tenantOf(b)));
  assert.deepEqual(actual, [true, false, false, true, false]);
});

test('five unusual bodies remain accounted for and visible, not promoted to a proven third cause', () => {
  assert.equal(a.oneDayReports.length, 5);
  for (const r of a.oneDayReports) assert.equal(c.causeOf(r, l.tenantOf(r)), 'parser');
  assert.equal(c.readAs(group('parser'), a.oneDayReports.map((r) => r.id)), 5);
  assert.equal(c.readAs(group('hint'), a.oneDayReports.map((r) => r.id)), 0);
});

test('the signed page follows export conventions and keeps historical decisions intact', async () => {
  const page = await readFile(new URL('../src/routes/kb/incidents/4471-review/+page.svx', import.meta.url), 'utf8');
  for (const key of ['title', 'owner', 'status', 'reviewed', 'signature']) assert.match(page, new RegExp(`^${key}:`, 'm'));
  assert.match(page, /<RenderStamp \{signature\} \/>/);
  assert.match(deskRef.deskRef('Sakadin'), /^DR-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
});

test('both independently actionable causes have their own filed GitHub issue', async () => {
  const links = JSON.parse(await readFile(new URL('../src/lib/data/issue-links.json', import.meta.url), 'utf8'));
  assert.deepEqual(links, {
    parser: 'https://github.com/Sakadin/megadevpepe/issues/1',
    hint: 'https://github.com/Sakadin/megadevpepe/issues/2'
  });
  assert.notEqual(links.parser, links.hint);
});
