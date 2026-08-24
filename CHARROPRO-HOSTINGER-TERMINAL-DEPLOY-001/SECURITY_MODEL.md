# Security Model

- SSH uses a dedicated key with `IdentitiesOnly` and `BatchMode`.
- Host key checking is strict.
- Passwords are never accepted as script arguments or files.
- The real environment file is ignored by Git.
- Package traversal, absolute paths, private keys, `.env`, `.git`, tests, Firebase configuration and logs are rejected.
- Remote commands receive values as positional arguments.
- Concurrent deploys are blocked locally and remotely.
- Firebase is outside the deployment surface.
