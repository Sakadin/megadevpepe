<script lang="ts">
  import links from '#lib/data/issue-links.json';
  import {
    causeGroups, reportCount, repeatedRows, mislabeledReports, oneDayReports,
    observedThrough, afterIncidentReview, oldestReceived, firstMerged, beforeFirstMerge
  } from '#lib/kb/investigation';

  const labels: Record<string, string> = {
    parser: 'Month-first shared parser for day-first tenants',
    hint: 'Booking-v3 date hint conflicts with tenant parsing'
  };
</script>

<p><strong>{reportCount} unique reports · {causeGroups.length} independently actionable problems.</strong>
  Evidence ends on {observedThrough}; this is an export, not the current support queue.</p>

<table>
  <thead><tr><th>problem</th><th>reports</th><th>tenants</th><th>first → last received</th><th>ticket</th></tr></thead>
  <tbody>
    {#each causeGroups as g (g.cause)}
      <tr>
        <td>{labels[g.cause] ?? g.cause}</td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if links[g.cause as keyof typeof links]}
            <a href={links[g.cause as keyof typeof links] ?? ''}>{g.cause} issue</a>
          {:else}
            not yet filed
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<p>Count once per report ID: exclude {repeatedRows} overlapping export rows.
  Intake tags disagree with tenant-based classification on {mislabeledReports} reports.
  Neither browser locale nor matching subjects determines the cause.</p>

<p>The export records reports from {oldestReceived}, but the first merges are on {firstMerged}:
  {beforeFirstMerge} reports arrived before that merge day.
  Another {afterIncidentReview} arrived after the incident page's 2026-09-30 review.
  “Known” is not evidence of a fix.</p>

<h3>Keep the ambiguous reports visible</h3>
<p>{oneDayReports.length} reports describe a one-day move or another unusual symptom.
  The supplied rules place them in <code>parser</code>; keep that accounting, but do not treat it as proof of their mechanism.</p>
<ul>
  {#each oneDayReports as r (r.id)}
    <li><code>{r.id}</code> ({r.tenant}): “{r.body}”</li>
  {/each}
</ul>
<p>Request the original entered value, stored date/time, tenant timezone, recipient timezone,
  and invite payload before moving these to another issue. The export does not establish a third cause.</p>
