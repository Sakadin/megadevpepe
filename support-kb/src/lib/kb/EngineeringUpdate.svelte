<script lang="ts">
  import update from '#lib/data/engineering-update.json';
</script>

<h2>Engineering update: different outcomes</h2>
<p>The <a href={update.source}>course support desk's engineering update</a>, read on {update.observed},
  records #{update.incident} closed on {update.incidentClosed}. This is newer than the report export.</p>
<table>
  <thead><tr><th>problem</th><th>engineering outcome</th><th>desk's explanation</th><th>GitHub closure</th></tr></thead>
  <tbody>
    <tr><td>parser</td><td><strong>{update.parser.status}</strong></td><td>{update.parser.summary}</td><td><code>{update.parser.githubStateReason}</code></td></tr>
    <tr><td>hint</td><td><strong>{update.hint.status}</strong></td><td>{update.hint.summary}</td><td><code>{update.hint.githubStateReason}</code></td></tr>
  </tbody>
</table>
<p>The parser ticket is completed because engineering reports a fix. The hint ticket is not planned
  because the form was retired; retirement is not a hint-code fix. These are the desk's reported
  outcomes, not independent product tests performed in this repository.</p>
