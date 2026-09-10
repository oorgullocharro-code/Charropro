# Deployment Decision

Deploy only the immutable client package after the final build, full regression, package verification, Hostinger backup, HTTP/browser smoke, cache-bypass verification, and rollback dry-run.

The Hostinger smoke contract checks both `portal-v2.html` as a versioned client entrypoint and `torneo-publico.html` as a non-bootstrap compatibility redirect.

No Functions or RTDB Rules deployment is permitted or needed. The post-deploy physical target is the public Portal V2 URL for `torneo_mtvjrydx_26jzkk`; the former legacy URL is checked only for its one-way compatibility redirect.
