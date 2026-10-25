export const userMigrations = [
	{
		id: "0001_accounts_media",
		sql: `
CREATE TABLE auth_user (id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
 email_verified boolean NOT NULL DEFAULT false, image text, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE TABLE auth_session (id text PRIMARY KEY, token text NOT NULL UNIQUE, expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, ip_address text, user_agent text,
 user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE);
CREATE INDEX auth_session_user_idx ON auth_session(user_id);
CREATE TABLE auth_account (id text PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL,
 user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE, access_token text, refresh_token text, id_token text,
 access_token_expires_at timestamptz, refresh_token_expires_at timestamptz, scope text, password text,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, UNIQUE(provider_id, account_id));
CREATE INDEX auth_account_user_idx ON auth_account(user_id);
CREATE TABLE auth_verification (id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
CREATE INDEX auth_verification_identifier_idx ON auth_verification(identifier);
CREATE TABLE user_preferences (user_id text PRIMARY KEY REFERENCES auth_user(id) ON DELETE CASCADE,
 theme text NOT NULL DEFAULT 'dark' CHECK(theme IN ('dark','light','system')),
 media_view text NOT NULL DEFAULT 'grid' CHECK(media_view IN ('grid','list')),
 media_sort text NOT NULL DEFAULT 'newest' CHECK(media_sort IN ('newest','oldest','name','size')),
 track_recent boolean NOT NULL DEFAULT true, favorites_imported boolean NOT NULL DEFAULT false);
CREATE TABLE favorite_tool (user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE, slug text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,slug));
CREATE TABLE recent_tool (user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE, slug text NOT NULL,
 used_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,slug));
CREATE INDEX recent_tool_user_time_idx ON recent_tool(user_id, used_at DESC);
CREATE TABLE storage_usage (user_id text PRIMARY KEY REFERENCES auth_user(id) ON DELETE CASCADE,
 used_bytes bigint NOT NULL DEFAULT 0, reserved_bytes bigint NOT NULL DEFAULT 0,
 CHECK(used_bytes >= 0 AND reserved_bytes >= 0 AND used_bytes + reserved_bytes <= 10000000000));
CREATE TABLE media_asset (id uuid PRIMARY KEY, user_id text NOT NULL REFERENCES auth_user(id),
 request_key uuid NOT NULL, name text NOT NULL, mime text NOT NULL, bytes bigint NOT NULL CHECK(bytes > 0 AND bytes <= 100000000),
 preview_bytes bigint NOT NULL DEFAULT 0 CHECK(preview_bytes >= 0 AND preview_bytes <= 256000),
 source_tool text, object_key text NOT NULL UNIQUE, state text NOT NULL DEFAULT 'reserved'
 CHECK(state IN ('reserved','uploading','uploaded','ready','deleting','cleanup','cancelled')),
 content_uploaded boolean NOT NULL DEFAULT false, preview_uploaded boolean NOT NULL DEFAULT false,
 charged boolean NOT NULL DEFAULT false, sha256 text, created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes', cleanup_error boolean NOT NULL DEFAULT false,
 UNIQUE(user_id,request_key));
CREATE INDEX media_asset_owner_idx ON media_asset(user_id,state,created_at DESC,id);
CREATE INDEX media_asset_cleanup_idx ON media_asset(state,expires_at);
`,
	},
	{
		id: "0002_user_username_phone",
		sql: `
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS display_username text;
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS phone text;
`,
	},
];
