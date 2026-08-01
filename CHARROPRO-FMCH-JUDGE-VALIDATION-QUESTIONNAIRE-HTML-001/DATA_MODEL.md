# Modelo de datos local

Cada entrevista usa `schemaVersion: 1.0.0` y contiene:

```text
interviewId, interviewStatus, createdAt, updatedAt,
profile, consent, answers, questionnaireVersion, demo, importedFrom
```

Cada respuesta conserva internamente `questionId`, `sectionId`, `sourceQuestionIds`, `relatedFieldIds`, `relatedGapIds`, selección, explicación, ejemplo, fuentes declaradas, nivel de certeza, notas, estado y fecha de actualización. La relación técnica vive en `questionnaire-data.js` y solo se muestra al activar Modo técnico.

Estados de entrevista: `DRAFT`, `COMPLETED`, `EXPORTED`, `REVIEWED`.

Estados de respuesta: `PENDING_REVIEW`, `NEEDS_CONFIRMATION`, `CONFLICTING`, `APPROVED_DECISION`, `REJECTED`. Toda respuesta nueva empieza en `PENDING_REVIEW`; ninguna interacción de la interfaz la promueve automáticamente.
