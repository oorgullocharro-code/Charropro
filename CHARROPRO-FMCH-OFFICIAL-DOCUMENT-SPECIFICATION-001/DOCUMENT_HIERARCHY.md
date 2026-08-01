# Document Hierarchy

```text
DOCUMENT
  PAGE 1
    HEADER
    SECTION (CALA | PIALES | COLEADERO | TORO | TERNA | YEGUA | MANGANAS_PIE | MANGANAS_CABALLO | PASO)
      PARTICIPANT_ROW (one or repeated as visually printed)
        ATTEMPT / PASS / OPPORTUNITY (when printed)
          VALUE CELL
      SUBSTITUTE
      TIME / TIME OUT (when printed)
      TEAM INFRACTION
      AUXILIARY CONTROL CELL (when present)
    CLOSING_TOTALS
    SIGNATURES
    INSTITUTIONAL_FOOTER
```

## Repetition rules

- Piales, Manganas a Pie, and Manganas a Caballo print three attempts.
- Coleadero prints four participant rows and three passes per row.
- Terna prints three entry rows under the `5 OPORTUNIDADES` heading.
- Each score block prints a `SUPLENTE` line.
- Repeated labels never share a field ID: each physical instance has its own deterministic ID and source row/column reference.

## No inferred relationship

The hierarchy identifies page geometry only. It does not establish which person performs a Terna subcolumn, how a `T` is calculated, or how any control box should be evaluated.
