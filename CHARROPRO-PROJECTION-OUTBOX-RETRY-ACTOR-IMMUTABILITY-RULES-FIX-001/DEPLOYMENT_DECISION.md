# Deployment Decision

Deploy only Firebase Realtime Database Rules after the approved commit is
pushed and the staged diff remains limited to this contract, its Emulator
coverage, and this evidence.

Do not deploy Functions, Hosting, client code, or Firebase data. Do not retry
the existing production projection jobs as part of this deployment.

The post-deploy gate is Rules artifact parity only. Controlled Recovery Center
retries require separate authorization.
