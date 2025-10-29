# Firebase: チャット構造（products / auctions 配下）

このプロジェクトでは、各商品（またはオークション）ドキュメントの下に `chat` サブコレクションを作成し、メッセージを保存します。

デザイン方針
- リアルタイム更新のためにサブコレクション（`products/{productId}/chat/{messageId}`）を使用
- メッセージは個別ドキュメントとして追加する（配列フィールドではなく）
- メッセージドキュメントは作成時に `createdAt` を serverTimestamp() で保存

コレクション構造例

products (collection)
  └─ {productId} (document)
       ├─ productname: string
       ├─ ...
       └─ chat (subcollection)
           └─ {messageId} (document)
               ├─ senderId: string    // Firebase Auth の uid
               ├─ senderName: string  // 表示名（またはメール等）
               ├─ content: string     // メッセージ本文
               └─ createdAt: Timestamp // serverTimestamp()

同様に auctions/{auctionId}/chat/{messageId} としても使えます。

ドキュメント例 (JSON 表示)

{
  "senderId": "abc123",
  "senderName": "山田太郎",
  "content": "こんにちは、こちらはまだ購入可能ですか？",
  "createdAt": {"_seconds": 169... , "_nanoseconds": ...}
}

セキュリティルール（例）
※以下は一例です。プロジェクトの方針に合わせて調整してください。

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証ユーザーのみ読み書き可能
    match /products/{productId}/chat/{msgId} {
      allow read: if request.auth != null && isParticipant(productId, request.auth.uid);
      allow create: if request.auth != null && request.resource.data.senderId == request.auth.uid
                    && request.resource.data.content is string
                    && request.resource.data.content.size() > 0;
      allow update, delete: if false; // メッセージ編集/削除は基本禁止（要要件）
    }

    // helper function: product の出品者や購入候補者だけ閲覧可能にするなどの実装を入れる
    function isParticipant(productId, uid) {
      // シンプルな例: ログイン済みユーザーは誰でも閲覧可
      return uid != null;
    }
  }
}

運用上の注意
- チャット数・メッセージ量に応じて料金（reads/writes）に注意
- 画像送信を実装する場合は Storage を使い、メッセージには画像URLを入れる

以上を基に、アプリ側では `hooks/useChat.ts` を使ってリアルタイム購読・送信を行います。
