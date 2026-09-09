# Canonical Public Tournament Data V2

The version 3 contract is a public, sanitized materialization. It accepts only
resolved sporting values and does not accept `publishedScores`, ledger records,
Attempt V2, actor data, CAS data, requests, recovery data, or credentials.

`results.teams`, `standings.items`, and `sheet.competitions[].rows` reference
the same `resultId`. Their totals must agree. A consumer may filter and present
these records, but may not select attempts, aggregate columns, calculate totals,
or calculate positions.

The deterministic content hash excludes `generatedAt`, `projectionRevision`, and
the hash itself. This lets a later publisher distinguish meaningful content from
publication metadata. The future builder is the sole producer of this contract.
