# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # 開発サーバー起動 (localhost:3000)
npm run build    # 本番ビルド（TypeScript型チェック込み）
npm run lint     # ESLint
npx tsc --noEmit # 型チェックのみ
```

## Architecture

Next.js 16 App Router + TypeScript。テストなし。デプロイ先は Vercel（プロジェクト名: `insta-trend`）。

### ページ構成

| ルート | 役割 |
|--------|------|
| `/` (`page.tsx`) | ウォッチリスト（最大6アカウントの概要一覧） |
| `/trend` | ハッシュタグ検索 → トレンド投稿一覧 → AI企画案生成 |
| `/analysis` | アカウント比較分析 → Top3投稿 → AIインサイト |
| `/watchlist` | ウォッチリスト管理ページ |

### API ルート

| エンドポイント | 外部API | 役割 |
|----------------|---------|------|
| `GET /api/trend?tag=` | Meta Graph API v19.0 | ハッシュタグの人気・最新投稿を取得。急上昇スコア（velocity）を計算 |
| `GET /api/instagram?username=` | Meta Graph API v19.0 | business_discovery でアカウント情報・直近100件の投稿を取得 |
| `POST /api/generate-idea` | Gemini API | トレンド投稿データからAI企画案を生成 |
| `POST /api/analyze-account` | Gemini API | アカウントの高EG/低EG投稿を比較してAIインサイトを生成 |

### 重要な設計上の決定

**Meta API のレート制限対応**
- `/api/trend` のモジュールレベルに `hashtagIdCache`（Map）を持つ。ハッシュタグIDの週30件制限を節約するため7日間キャッシュ。サーバーレス環境ではインスタンス再起動でキャッシュが消えることに注意。

**画像プロキシ**
- `next.config.ts` の `remotePatterns` で `**.cdninstagram.com` と `**.fbcdn.net` を許可。
- サムネイルはすべて `<Image>` コンポーネント経由（`/_next/image?url=...`）でサーバーがプロキシするため、ブラウザは直接CDNに接続しない。企業ファイアウォール対策。

**Gemini モデルフォールバック**
- `generate-idea` と `analyze-account` 両APIとも同じ3段階フォールバック: `gemini-2.5-flash` → `gemini-3-flash-preview` → `gemini-2.5-flash-lite`
- 429はリトライしない、503のみリトライ（2回）。

**認証**
- `AuthProvider.tsx` でクライアントサイドのみのパスワード認証。`localStorage` に認証状態を保持。パスワードはコンポーネント内にハードコード。

### スタイリング方針

- **インラインスタイル優先**（ページ/コンポーネントのほぼすべて）
- `globals.css` にレイアウト用クラス（`.layout-container`, `.sidebar`, `.main-content` など）と CSS 変数（`--accent-pink: #ec4899`, `--accent-purple: #8b5cf6` など）
- Tailwind は一部の Sidebar と trend ページの `className` で使用
- `recharts` でグラフ、`lucide-react` でアイコン

### 環境変数

| 変数名 | 用途 |
|--------|------|
| `GEMINI_API_KEY` | Gemini API キー |
| `INSTAGRAM_ACCESS_TOKEN` | Meta Graph API アクセストークン |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Meta ビジネスアカウントID（`INSTAGRAM_BUSINESS_ID` も fallback として参照） |

Vercel の Production / Preview 両環境に設定が必要。`genAI` などAPIクライアントはモジュールレベルではなく**リクエストハンドラ内で初期化**すること（サーバーレス関数の環境変数キャプチャ問題を避けるため）。
