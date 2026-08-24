# Risks

- Physical iPad/Safari tactile perception must still be confirmed after deployment. Browser-real desktop measurements meet the target but do not replace device validation.
- The existing local seed contains dotted FMCH FieldID keys that Firebase RTDB rejects. Local browser validation used an isolated `/tmp` copy omitting that incompatible fixture field; repository seed behavior was not changed because it is outside this ticket.
- The scorer retains a full-surface render. The measured hot path is now below target, but a future component-level renderer could further reduce work if later evidence warrants it.
- Deferred local persistence is flushed on `pagehide`; abrupt process termination remains subject to normal browser persistence limits.
