# Rollback

No existe deploy Hostinger, Firebase, Functions ni Rules asociado a este ticket.

Si el commit publicado requiere reversa:

```bash
git switch main
git pull --ff-only origin main
git revert <NEW_COMMIT>
git push origin main
```

No usar `git reset --hard`, force push ni reescritura de historial. El paquete inmutable generado debe conservarse como evidencia y no desplegarse tras un rollback.
