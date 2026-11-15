# shogi-kifucho

棋譜をブラウザで記録し、一覧・閲覧できる。画面と API は Vercel、データは Neon（Postgres）に置く。
一覧と閲覧はログインなしで開ける。新規作成はログインしたユーザーだけ、更新と削除は作成者だけが可能。
ユーザー登録は、スクリプトで実施。

## 必要な環境

- Node.js 22 以上
- Neon のデータベース（Singapore / ap-southeast-1。接続は Pooled connection）
- 公開時は Vercelを想定。公開アドレスは `https://<プロジェクト名>.vercel.app`

## セットアップ

1. Neon でプロジェクトを Singapore に作り、SQL Editor で `db/schema.sql` を実行する。データベース名は初期値の `neondb` を使う。
2. Connect で Pooled connection（ホスト名に `-pooler` が含まれるもの）の接続文字列をコピーする。
3. `.env.example` をコピーして `.env` を作る。`DATABASE_URL` にその接続文字列を書く。`SESSION_SECRET` には32文字以上のランダムな文字列を書く。`.env.example` に書いてある例の値では起動しない。`.env` は Git に含めない。

   ```powershell
   copy .env.example .env
   node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('base64url'))"
   ```

4. 依存関係を入れて、棋譜を記録するユーザーを作る。パスワードは8文字以上にする。

   ```powershell
   npm install
   npm run create-user -- <email> <password>
   ```

## 起動

```powershell
npm run dev
```

- 画面: http://localhost:5173/
- API: http://127.0.0.1:3001/ （画面からは Vite が `/api` をここへ転送する）

## 開発

```powershell
npm run lint
npm run typecheck
npm run build
```

## デプロイ

このリポジトリ（`tishimaru-bit/shogi-kifucho`）を Vercel に接続し、デプロイする。データは Singapore の Neon を使用。
`DATABASE_URL` と `SESSION_SECRET` は、Vercel の環境変数で対象を Production だけにする。Preview と Development には設定しない。手元の `.env` は、その Production と同じ値でよい。
Vercel の Settings で Git Fork Protection を有効にする。有効にすると、fork からのプレビューデプロイには環境変数が渡されない。
ビルドは直下の `npm run build`、出力先は `web/dist`。プロジェクトのルートはリポジトリ直下。
既に `db/schema.sql` を実行済みのデータベースには、`login_attempts` と `sessions` の CREATE TABLE と CREATE INDEX を追加で実行する。セッションはデータベースに保存する。この変更のあと、公開中のログインは一度入り直す。

## ライセンス

Copyright (C) 2026 tishimaru-bit

[GNU General Public License v3.0 or later](LICENSE)（GPL-3.0-or-later）。
GPL-3.0-or-later の [shogiground](https://github.com/WandererXII/shogiground) と [shogiops](https://github.com/WandererXII/shogiops) を含めて配信するため、このリポジトリも同じライセンスで公開する。

駒画像は [sunfish-shogi/shogi-images](https://github.com/sunfish-shogi/shogi-images) の一字駒（[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)）。
