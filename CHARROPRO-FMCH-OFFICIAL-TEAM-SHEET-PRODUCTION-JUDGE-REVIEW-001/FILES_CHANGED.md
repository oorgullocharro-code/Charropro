# Files Changed

## Controlled inventory

The pre-staging audit contains `134` files:

| Class | Files | Scope |
| --- | ---: | --- |
| Product | 61 | Official Format Snapshot/exporter/XLSX and the release cache-buster; includes only the derived bootstrap checksum update in Functions configuration. |
| Tests | 21 | Golden, semantic certification, module-identity/cache coherence and existing regression expectations. |
| Documentation | 39 | Mapping, reconciliation, semantic matrices and judge-review handoff. |
| Official assets | 3 | FMCH and CONADE PNG assets plus their source-authority manifest. |
| Permanent fixtures | 10 | Certified one-page Letter XLSX/PDF evidence. |

Tracked modifications: `86`. New files: `48`. Deletions: `0`.

## Exclusions

`/tmp`, logs, Emulator artifacts, caches, ZIPs, `.env`, credentials and keys are excluded. The temporary generators remain under `/tmp` and are not part of the repository. No Firebase Rules, sporting Rule Profile values or production data are changed.
