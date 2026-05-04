# InstaTrend - Instagram 戦略分析ツール

Instagram のハッシュタグや競合アカウントを分析し、AI によって次回の投稿企画を提案する戦略支援ツールです。

## 主な機能

### 1. トレンドリサーチ (Home)
指定したハッシュタグから「今、伸びている」投稿を抽出・分析します。
- **急上昇スコア:** いいね数と経過時間から、現在進行形で伸びている投稿を特定。
- **AI市場分析:** 上位投稿の傾向、ユーザーの潜在需要、攻略コンセプト案を Gemini AI が自動生成。
- **フィルタリング:** 期間別（24時間、7日間、30日間）の絞り込み。

### 2. ウォッチリスト (`/watchlist`)
ベンチマークしている競合アカウントの「今」を定点観測します。
- **最新反応率:** フォロワー数に対する最新投稿のエンゲージメントを算出。
- **一括更新:** 登録した最大6アカウントの最新データをワンクリックで取得。

### 3. アカウント比較分析 (`/analysis`)
競合アカウントの投稿データや推移を詳細に可視化します。
- **Top 3 投稿:** アカウントの強みが一目でわかる反応数上位の投稿を表示。
- **日次・月次推移:** いいね数や投稿本数の推移をグラフで比較。

## 技術スタック
- **Frontend:** Next.js (App Router), Tailwind CSS, Lucide React, Recharts
- **Backend:** Next.js API Routes
- **AI:** Google Gemini API (Flash 1.5/2.0)
- **Data Source:** Instagram Graph API

## セットアップ

### 環境変数の設定
`.env.local` ファイルを作成し、以下の項目を設定してください。
```env
INSTAGRAM_ACCESS_TOKEN=your_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_id
GEMINI_API_KEY=your_gemini_api_key
```

### インストールと起動
```bash
npm install
npm run dev
```
