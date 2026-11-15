-- Neon（Postgres）に適用する。gen_random_uuid() は Neon では追加拡張なしで使える。

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kifus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  sente text NOT NULL DEFAULT '' CHECK (char_length(sente) <= 100),
  gote text NOT NULL DEFAULT '' CHECK (char_length(gote) <= 100),
  event text NOT NULL DEFAULT '' CHECK (char_length(event) <= 200),
  played_at timestamptz,
  move_count integer NOT NULL DEFAULT 0 CHECK (move_count >= 0),
  kif text NOT NULL CHECK (octet_length(kif) <= 1048576),
  owner uuid NOT NULL REFERENCES users (id),
  created timestamptz NOT NULL DEFAULT now(),
  updated timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_kifus_updated ON kifus (updated DESC);

-- ログイン失敗の記録。直近15分で、同じメールは8回、同じIPは30回まで。
CREATE TABLE login_attempts (
  email text NOT NULL,
  ip text NOT NULL,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_attempts_email ON login_attempts (email, created);
CREATE INDEX idx_login_attempts_ip ON login_attempts (ip, created);

-- ログアウトで削除する。行が無い Cookie は署名が正しくても無効。
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires timestamptz NOT NULL,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_expires ON sessions (expires);
