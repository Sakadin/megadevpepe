# [#4471 split] Booking-v3 date hint conflicts with day-first parsing — 33 reports

## Scope and count

**33 unique reports** merged into course ticket #4471, across **3 tenants**; received **2026-04-17 through 2026-09-22**. These are counts from the export through 2026-10-04, not today's live queue.

The full export has 427 rows but 412 unique report IDs. Count one report per ID; remove the 15 overlapping rows before grouping. The parser and hint counts partition all 412 reports.

## Distinct problem

Booking-v3 displays `MM/DD/YYYY` but parses form input using the tenant’s day-first locale. This is a distinct form-hint contract defect, not the shared-parser path. It affects form reports for Alder Physio, Copper Studio, and Pale Harbour.

## Proposed reproduction and expected result

1. Use Alder Physio (`de-DE`, booking-v3), via the booking form.
2. Follow the displayed `MM/DD/YYYY` hint and enter `08/06/2026`, intending 6 August.
3. Submit the form and inspect the resulting date.

Expected: 6 August, matching the displayed hint. The described form behavior reads 8 June. `R-41241` reports the 8 June / 6 August mismatch. These are proposed product-verification steps; the booking application itself is not included.

## Fix and acceptance checks

Make the date hint and input interpretation agree for the tenant. Test all three booking-v3 tenants, ambiguous values, and booking-v2 controls. Separately verify app/email for the same tenants, which remain in the parser issue. A parser-only fix does not establish that the hint is fixed.

- [ ] Reproduce the reported behavior against the product.
- [ ] Implement the independent fix and regression tests.
- [ ] Reclassify a fresh export before changing the current queue.
- [ ] Keep this issue separate from the other #4471 mechanism.

## Limits and ambiguous evidence

The count follows tenant locale, form version, and entry channel. It is not the count of reports tagged `hint`: intake guessed from the reporter’s browser and disagrees with this cause on some records.

## Evidence and counting method

- Source reports: [reports-4471.json](https://github.com/Sakadin/megadevpepe/blob/main/support-kb/src/lib/data/reports-4471.json).
- Tenant directory: [tenants](https://github.com/Sakadin/megadevpepe/tree/main/support-kb/src/lib/data/tenants).
- Executed classification: [causes.ts](https://github.com/Sakadin/megadevpepe/blob/main/support-kb/src/lib/kb/causes.ts), especially `uniqueById`, `dayFirst`, `causeOf`, and `groupByCause`.
- Intake tags within this group: `parser`: 15; `hint`: 18. Labels are comparison data, not the cause rule.
- [Machine-readable analysis and complete ID partition](https://github.com/Sakadin/megadevpepe/blob/main/evidence/analysis.json).
- [Signed KB investigation](https://github.com/Sakadin/megadevpepe/blob/main/support-kb/src/routes/kb/incidents/4471-review/+page.svx).

## Covered report IDs

`R-41230`, `R-41241`, `R-41251`, `R-41259`, `R-41262`, `R-41275`, `R-41294`, `R-41305`, `R-41308`, `R-41366`, `R-41372`, `R-41384`, `R-41387`, `R-41396`, `R-41400`, `R-41406`, `R-41415`, `R-41416`, `R-41418`, `R-41428`, `R-41439`, `R-41441`, `R-41449`, `R-41453`, `R-41456`, `R-41460`, `R-41472`, `R-41485`, `R-41493`, `R-41539`, `R-41572`, `R-41582`, `R-41584`
