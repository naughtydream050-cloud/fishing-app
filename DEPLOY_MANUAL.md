# Deploy Manual — fishing-app → Vercel

> **残り1アクション**: PowerShellで以下を順番に実行するだけ。

## 前提確認

```powershell
node -v    # v18以上であること
npm -v
vercel -v  # インストール済みか確認
```

Vercel CLI が入っていない場合:
```powershell
npm install -g vercel
```

---

## デプロイ手順（コピペ実行）

```powershell
# 1. プロジェクトディレクトリへ移動
cd D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app

# 2. 依存パッケージインストール（初回のみ）
npm install

# 3. Vercel にデプロイ（初回はブラウザでログイン → 自動でリンク）
vercel deploy --prod
```

初回実行時のプロンプト（EnterでOK）:
- `Set up and deploy?` → **Y**
- `Which scope?` → 自分のアカウントを選択
- `Link to existing project?` → **N**（新規）または **Y**（既存プロジェクトがある場合）
- `What's your project's name?` → `fishing-app`（そのままEnter）
- `In which directory is your code located?` → `./`（そのままEnter）

---

## 環境変数の設定（Vercel Dashboard）

デプロイ後、以下の環境変数を Vercel Dashboard → Settings → Environment Variables に追加:

| 変数名 | 値の場所 |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` から |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` から |
| `USE_MOCK_DATA` | `false` |

設定後、**Redeploy** ボタンを押すこと。

---

## Git 連携（推奨・次回から自動化）

```powershell
cd D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app
git init
git add .
git commit -m "chore: initial commit"
# GitHub で fishing-app リポジトリを作成後:
git remote add origin https://github.com/YOUR_USERNAME/fishing-app.git
git push -u origin main
```

その後 Vercel Dashboard → Project → Settings → Git → Connect Git Repository でリポジトリを連携。
以降は `git push` だけで自動デプロイ。

---

## ブロッカーだった理由（参考）

Claude のサンドボックスから外部DNS（`vercel.com`, `registry.npmjs.org`）への解決がブロックされているため、
CLI 経由のデプロイはサンドボックス内からは実行不可。  
ユーザーのローカル環境からは問題なく動作する。
