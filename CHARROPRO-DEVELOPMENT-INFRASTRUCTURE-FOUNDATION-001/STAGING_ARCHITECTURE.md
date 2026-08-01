# Staging Architecture

## Principle

Staging is an independently billed and administered Firebase and Google Cloud project. It must not reuse the production Firebase project, Realtime Database instance, Storage bucket, Authentication users, service accounts, secrets, or deployment history.

## Recommended naming

| Resource | Recommended convention |
| --- | --- |
| Firebase/GCP project | `charropro-stg-<organization-or-account>` |
| Realtime Database | `<project-id>-default-rtdb` |
| Storage bucket | `<project-id>.appspot.com` or an explicitly named staging bucket |
| Functions region | `us-central1` unless the approved data-residency decision changes it |
| Release labels | `staging-<release-id>` |

The actual project ID, billing account, region exception, organization policy, and authorized administrators require a manual governance decision. They are intentionally not invented by this repository.

## Required staging resources

1. Firebase project linked to its own Google Cloud project.
2. Realtime Database instance with staging-only data and rules deployment pipeline.
3. Firebase Authentication configured with staging-only providers and test accounts.
4. Cloud Storage bucket restricted to staging use.
5. Functions deployment target in the approved region.
6. Hosting target if and when the current delivery architecture moves to Firebase Hosting.
7. Separate service accounts and least-privilege IAM groups for developers, release managers, and CI.

## IAM validation gate

Before staging is used, install `gcloud`, authenticate only through an approved identity, and verify project, billing, Organization Policy, service accounts, and IAM bindings. That validation is intentionally pending because no staging project has been provisioned in this ticket.

## Promotion path

`LOCAL -> STAGING -> PRODUCTION`

- Local validates with emulators and isolated fixture data.
- Staging validates deployable artifacts against an independent cloud project.
- Production receives only a separately approved release after staging evidence and release-management checks.

No command should infer the next environment. Every target must be explicit in its profile and in the authorized release procedure.
