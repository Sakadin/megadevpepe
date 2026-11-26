import reports from '#lib/data/reports-4471.json';
import notes from '#lib/data/desk-notes.json';
import { groupByCause, ticketCause, uniqueById, type Report } from '#lib/kb/causes';
import { tenantOf } from '#lib/kb/locales';

const rows = reports as Report[];
export const mergedReports = uniqueById(rows).filter((r) => r.mergedInto === 4471);
export const causeGroups = groupByCause(mergedReports, tenantOf);
export const majorityCause = ticketCause(causeGroups, 4471);
export const reportCount = mergedReports.length;
export const repeatedRows = rows.length - uniqueById(rows).length;
export const mislabeledReports = causeGroups.reduce(
  (total, g) => total + g.reports.filter((r) => r.meta.intakeTag !== g.cause).length,
  0
);
export const oneDayReports = mergedReports.filter((r) => notes.oneDayMove.includes(r.id));
export const observedThrough = mergedReports.map((r) => r.receivedAt.slice(0, 10)).sort().at(-1);
export const afterIncidentReview = mergedReports.filter((r) => r.receivedAt.slice(0, 10) > '2026-09-30').length;
export const oldestReceived = mergedReports.map((r) => r.receivedAt.slice(0, 10)).sort()[0];
export const firstMerged = mergedReports.flatMap((r) => r.mergedAt ? [r.mergedAt.slice(0, 10)] : []).sort()[0];
export const beforeFirstMerge = mergedReports.filter((r) => r.receivedAt.slice(0, 10) < firstMerged).length;
