# Accounts and private Media Storage

QBTools uses Better Auth (GitHub only), a server-side PGlite database, and private RustFS objects through Bun's native S3 API. Public tools remain anonymous and process inputs locally. Only Upload, Save to Media, or selecting a stored file transfers file contents.

## Configure

Set all four authentication variables together: `BETTER_AUTH_SECRET` (32+ random characters), `BETTER_AUTH_URL` (canonical public origin), `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET`. Leaving all four empty disables sign-in while public tools stay available. Partial configuration is an error. Register separate GitHub OAuth applications for development and production with callback `<BETTER_AUTH_URL>/api/auth/callback/github`; development defaults to port 8310. Request `read:user` and `user:email`, with no repository permissions.

Set `PGLITE_DATA_DIR` to a persistent, writable directory, separate from `DATABASE_PATH` (SQLite). Run exactly one application process per PGlite directory. SQLite continues to own contacts, leads, the waitlist, and historical suggestion records. Suggestions have no public submission or admin interface.

Configure `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` for your RustFS instance. Use a dedicated **private, unversioned** bucket without Object Lock and an application service account with object read/write/delete, multipart, and list permissions on the application prefix. Do not provide root credentials to the application. Bun uses path-style addressing. RustFS can stay on an internal network: browsers access authenticated application endpoints, not RustFS URLs, so bucket CORS is unnecessary.

For optional local RustFS, set unique `RUSTFS_ACCESS_KEY` and `RUSTFS_SECRET_KEY`, then use `docker compose --profile storage up -d rustfs`. Create the bucket through your RustFS administration tools. Ports 9000/9001 bind to localhost. Configure a bucket lifecycle rule to abort incomplete multipart uploads after one day. The application never makes a bucket public or changes an existing production bucket policy.

## Storage semantics

Limits are decimal: 10,000,000,000 bytes per user and 100,000,000 bytes per file. Uploaded previews count too (PNG, up to 256 KB and 256 pixels). Accepted extensions are defined in `media-contract.ts`; encrypted files must use the existing QBEN header. Documents, SVGs, archives and encrypted content download as attachments. Image, audio and video previews pass ownership checks and support single byte ranges.

An upload reserves space transactionally, streams through a bounded native multipart writer, and becomes visible only after stored-size verification. Used plus reserved bytes cannot exceed the allowance. Two unfinished reservations are allowed per user; actual writers are limited to two per user and four per process. Uploads time out after 30 minutes. Idle reservations expire after ten minutes; active uploads renew their lease. Duplicate completion and cancellation are idempotent.

Failed deletion retains quota until objects are confirmed absent. A durable cleanup state retries every minute and on startup. Recovery removes abandoned uploads; it does not publish incomplete files. Infrastructure replication, backups and multipart fragments are outside the logical user quota. Apply the lifecycle rule and monitor RustFS capacity independently.

Favorites, the latest 50 tool slugs/timestamps, theme and media-view preferences sync while signed in. No passwords, hashes, source contents or tool parameters enter recent history. Guest favorites require an explicit one-time import. Signed-in pages omit advertising and analytics scripts, are excluded from indexing, and use private/no-store responses.

## Backup and restore

SQLite keeps its existing backup command. **Stop the app before opening the PGlite directory from maintenance tooling.** Run `bun run --cwd packages/db users:backup <output.tar.gz>` or, inside the image, `bun dist/server/user-backup.js backup <output.tar.gz>`. Restore into a new directory with `PGLITE_DATA_DIR=<new-path> bun run --cwd packages/db users:restore <backup.tar.gz>`. The compiled image command is `bun dist/server/user-backup.js restore <backup.tar.gz>`. Existing restore destinations are rejected.

Back up RustFS separately; a database backup does not include objects. Pin PGlite versions, retain the auth secret needed to decrypt OAuth tokens, coordinate database/object restores, and run cleanup reconciliation after restoring. Datadir snapshots are PGlite-version-specific. There is no SQLite data migration in this release.

## Validation

`bun test`, `bun run typecheck`, `bun run lint`, and `bun run build` cover the normal checks. Storage integration tests additionally require the disposable RustFS instance provisioned by `scripts/rustfs-test-setup.ts`; run `QBTOOLS_RUSTFS_TEST=1 bun test apps/web/src/server/rustfs.test.ts`.

`scripts/seed-auth-test.ts` creates signed test sessions through real Better Auth callbacks with mocked GitHub responses. It only accepts a disposable `qbtools-auth-test-` directory and is not shipped in the application. Browser tests use `QBTOOLS_AUTH_FIXTURE` plus `QBTOOLS_TEST_URL`; no production auth bypass exists. A live GitHub authorization smoke test still requires deployment OAuth credentials.
