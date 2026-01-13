# アイカレマーケット (I-kare-Market)

学生向けマーケットプレイス（Webフリマ/オークション）アプリのリポジトリです。

簡潔な説明:
- 学生同士で商品の出品・購入ができるWebアプリケーション
- チャットで取引相手と連絡可能
- Firebase (Auth / Firestore / Storage) をバックエンドに使用

## 主な特徴
- 商品の出品・編集・削除
- 商品画像の複数アップロード
- 商品検索・フィルタリング
- 取引チャット（商品ごと）
- プロフィール・取引履歴管理
- Google/Firebase 認証によるログイン
- レスポンシブ（PC / スマホ対応）

## 技術スタック
- 言語: TypeScript
- フレームワーク: Next.js (App Router)
- UI: React + Tailwind CSS + Radix UI
- バックエンド: Firebase (Authentication, Firestore, Storage)
- ビルド・デプロイ: Vercel（想定）

（詳細はリポジトリ内の `app/`, `components/`, `hooks/`, `lib/` を参照してください）

## クイックスタート（ローカル開発）

前提:
- Node.js (推奨: 18.x 以上)
- npm

1. 依存関係をインストール

```bash
npm install
```

2. 環境変数を設定

- Firebase の設定は環境変数で管理してください。例: `.env.local` に下記を追加

```text
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. 開発サーバ起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いて動作を確認します。

## ディレクトリの概要
- `app/` - Next.js のページ・APIルート
- `components/` - 再利用可能な UI コンポーネント
- `hooks/` - カスタムフック（データ取得やロジック）
- `lib/` - Firebase 設定やユーティリティ
- `public/` - 画像・静的ファイル

詳しいファイル構成はリポジトリルートの `app/` と `components/` を参照してください。


## 貢献
- Issue や Pull Request を歓迎します。小さな修正でもお気軽に送ってください。
