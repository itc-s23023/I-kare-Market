"use client"

import { use, useState, useRef, useEffect, Suspense } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Check } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useChat } from "@/hooks/useChat"
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, addDoc, deleteDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import Image from "next/image"
import { notFound, useRouter, useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'



function ChatPageContent({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const itemType = searchParams.get('type') || 'product' // 'product' or 'auction'
  const collectionName = itemType === 'auction' ? 'auctions' : 'products'
  
  const [product, setProduct] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [chatMeta, setChatMeta] = useState<any | null>(null)
  useEffect(() => {
    if (!productId) return
    const fetchProductAndMeta = async () => {
      try {
        const docRef = doc(db, collectionName, productId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setProduct({
            id: docSnap.id,
            title: data.productname || data.title || "商品名なし",
            // 価格: 通常商品のprice / オークションは finalPrice > currentBid > startingPrice の優先順
            price: (data.finalPrice || data.currentBid || data.startingPrice || data.price || 0),
            description: data.content || data.description || "",
            condition: data.condition || "",
            images: Array.isArray(data.image_urls) ? data.image_urls : Array.isArray(data.images) ? data.images : [data.image_url || "/placeholder.jpg"],
            sellerId: data.userid || data.sellerId || "",
            sellerName: data.sellerName || data.username || "匿名ユーザー",
            sellerImage: data.sellerImage || "/placeholder-user.jpg",
            sellerRating: data.sellerRating || 0,
            createdAt: data.createdAt || "",
            status: data.status || "active",
            is_trading: data.is_trading ?? false,
          })
          // chat/meta取得（初回）
          const metaRef = doc(db, collectionName, productId, "chat", "meta")
          const metaSnap = await getDoc(metaRef)
          if (metaSnap.exists()) {
            setChatMeta(metaSnap.data())
          } else {
            setChatMeta(null)
          }
        } else {
          setError("商品が見つかりません")
        }
      } catch (e: any) {
        setError("商品データ取得エラー: " + e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProductAndMeta()
  }, [productId, collectionName])

  // chat/meta を購読（同意状態のリアルタイム反映）
  useEffect(() => {
    if (!productId) return
    const metaRef = doc(db, collectionName, productId, "chat", "meta")
    const unsub = onSnapshot(metaRef, (snap) => {
      if (snap.exists()) setChatMeta(snap.data())
      else setChatMeta(null)
    })
    return () => unsub()
  }, [productId, collectionName])
  type Message = {
    id: string
    senderId: string
    senderName: string
    content: string
    timestamp: string
  }

  // auth
  const { user } = useAuth()

    // useChat: products/{productId}/chat または auctions/{auctionId}/chat サブコレクションを購読
    const { messages: chatMessages, loading: chatLoading, error: chatError, sendMessage, chatUsers } = useChat(
      itemType === 'auction' ? 'auctions' : 'products',
      productId
    )

  // chat meta(users) を作成：購入者がチャットを開いたときにbuyer情報を保存する
  useEffect(() => {
    if (!product || !user) return
    // 購入者が開いた場合のみ buyer 情報を書き込む（出品者が開いたときは書き込まない）
    if (user.uid === product.sellerId) return

    const writeMeta = async () => {
      try {
          const metaRef = doc(db, collectionName, productId, "chat", "meta")
        await setDoc(
          metaRef,
          {
            users: {
              seller: {
                id: product.sellerId,
                imageURL: product.sellerImage || "/placeholder-user.jpg",
              },
              buyer: {
                id: user.uid,
                imageURL: user.photoURL || "/placeholder-user.jpg",
              },
            },
          },
          { merge: true }
        )
      } catch (e) {
        console.error("chat meta set error", e)
      }
    }

    writeMeta()
    }, [product, user, productId, collectionName])
  // メッセージを日付ごとにグループ化する関数
  function groupMessagesByDate(messages: Message[]): { [date: string]: Message[] } {
    const groups: { [date: string]: Message[] } = {}
    messages.forEach((msg: Message) => {
      // timestampが"YYYY-MM-DD HH:mm"形式なので、日付部分だけ抽出
      const date = msg.timestamp.slice(0, 10)
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

  // 最新メッセージへの自動スクロール
  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])
  const [newMessage, setNewMessage] = useState("")
  const isSeller = user ? user.uid === (product?.sellerId ?? "") : false
  const buyerIdFromMeta = chatMeta?.users?.buyer?.id ?? null
  const hasAgreed = isSeller ? Boolean(chatMeta?.sellerAgreed) : Boolean(chatMeta?.buyerAgreed)
  const bothAgreed = Boolean(chatMeta?.sellerAgreed) && Boolean(chatMeta?.buyerAgreed)
  const isBuyer = user ? !isSeller && user.uid === (buyerIdFromMeta ?? "") : false
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState("")

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              商品データを読み込み中...
            </div>
          </div>
        </main>
      </div>
    )
  }
  // アクセス制御: is_tradingがtrueのとき、出品者・購入者以外はアクセス不可（chat/meta参照）
  if (
    error ||
    !product ||
    (product.is_trading === true && user && (
      !chatMeta ||
      (user.uid !== (chatMeta.users?.seller?.id ?? "") && user.uid !== (chatMeta.users?.buyer?.id ?? ""))
    ))
  ) {
    notFound()
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    if (!user) {
      // ログインしていない場合は送信を防ぐ（AuthProvider側でログイン導線を出す）
      return
    }
      // 商品のis_tradingをtrueに更新（購入者が最初のメッセージを送信したとき）※productsのみ
      if (itemType === 'product' && product && !product.is_trading && user.uid !== product.sellerId) {
      try {
        const productRef = doc(db, "products", productId)
        await updateDoc(productRef, {
          is_trading: true,
        })
        setProduct({ ...product, is_trading: true })
      } catch (e) {
        console.error("is_trading更新エラー", e)
      }
    }

    // Firestore に送信
    sendMessage({
      senderId: user.uid,
      senderName: (user.displayName as string) || user.email || "匿名",
      content: newMessage.trim(),
    })
      .then(() => {
        setNewMessage("")
      })
      .catch((e) => {
        console.error("メッセージ送信エラー", e)
      })
  }

  // 双方同意のボタン押下時（自分の同意のみを記録）
  const handleAgree = async () => {
    if (!user || !productId) return
    try {
      const metaRef = doc(db, collectionName, productId, "chat", "meta")
      if (isSeller) {
        await setDoc(metaRef, { sellerAgreed: true }, { merge: true })
      } else {
        await setDoc(metaRef, { buyerAgreed: true }, { merge: true })
      }

      // 同意した時に相手に通知を送信
      try {
        const recipientId = isSeller ? buyerIdFromMeta : product.sellerId
        const agreementType = isSeller ? "出品者" : "購入者"
        
        if (recipientId && recipientId !== user.uid) {
          // 通知データを準備
          const notificationData: any = {
            userId: recipientId,
            type: "transaction_agreed",
            title: "取引同意",
            message: `「${product.title}」について${agreementType}が取引に同意しました。`,
            read: false,
            createdAt: new Date().toISOString()
          }

          // アイテムタイプに応じて適切なIDフィールドを設定
          if (itemType === 'auction') {
            notificationData.auctionId = productId
          } else {
            notificationData.productId = productId
          }
          notificationData.senderId = user.uid

          // 通知をFirestoreに保存
          await addDoc(collection(db, "notifications"), notificationData)
          console.log("✅ 取引同意通知を送信しました:", { recipientId, agreementType })
        }
      } catch (notificationError) {
        console.error("❌ 取引同意通知の送信エラー:", notificationError)
        // 通知の失敗は同意処理を阻害しない
      }
    } catch (e) {
      console.error("同意の更新に失敗しました", e)
    }
  }

  // 購入者の評価送信で取引完了 -> 出品者評価保存後に purchases へ最小スキーマで購入履歴を保存し、その後商品を削除
  const handleSubmitEvaluation = async () => {
    if (!user || !product || !isBuyer) return
    if (!rating) return // スコア必須
    if (!product.sellerId) {
      console.error("sellerIdが取得できないため評価を保存できません")
      return
    }
    try {
      // 評価コレクション（ユーザーサブコレクション）
      const evalsCol = collection(db, "users", product.sellerId, "evaluations")
      await addDoc(evalsCol, {
        user: user.displayName || user.email || user.uid,
        userimageURL: user.photoURL || "/placeholder-user.jpg",
        content: comment || "",
        score: rating,
        createdAt: new Date().toISOString(),
        itemType,
        itemId: product.id
      })

      // この商品/オークションに関連する通知を削除
      try {
        const notificationsQuery = itemType === 'auction'
          ? query(collection(db, "notifications"), where("auctionId", "==", productId))
          : query(collection(db, "notifications"), where("productId", "==", productId))
        const notificationsSnap = await getDocs(notificationsQuery)
        await Promise.all(notificationsSnap.docs.map(doc => deleteDoc(doc.ref)))
        console.log(`🧹 関連通知を削除しました: ${notificationsSnap.size}件`)
      } catch (e) {
        console.error("❌ 関連通知の削除に失敗しました", e)
      }

      // users/{sellerId} の評価集約値(evalution)を再計算し反映
      try {
        const sellerRef = doc(db, "users", product.sellerId)
        const sellerSnap = await getDoc(sellerRef)
        if (sellerSnap.exists()) {
          const data = sellerSnap.data() as { evalution?: unknown }
          const prev = typeof data.evalution === "number" ? data.evalution : null
          const next = (prev == null || prev === 0) ? rating : (rating + prev) / 2
          await updateDoc(sellerRef, { evalution: next })
        }
      } catch (e) {
        console.error("ユーザー評価の再計算に失敗しました", e)
      }

      // 購入履歴保存（最終価格優先）
      try {
        const purchaseRef = doc(collection(db, "users", user.uid, "purchases"))
        await setDoc(purchaseRef, {
          productName: product.title || "商品名なし",
          purchaseDate: new Date().toISOString(),
          price: product.price || 0,
          sellerId: product.sellerId || "",
          sellerName: product.sellerName || "匿名ユーザー",
          sellerAvatar: product.sellerImage || "/seller-avatar.png",
          itemType,
          itemId: product.id
        })
        console.log("✅ users/" + user.uid + "/purchases へ購入履歴保存完了")
        router.push("/")
      } catch (e) {
        console.error("❌ purchases への購入履歴保存に失敗", e)
      }

      // サブコレクション(chat)削除
      try {
        const chatCol = collection(db, collectionName, productId, "chat")
        const chatSnap = await getDocs(chatCol)
        await Promise.all(chatSnap.docs.map((d) => deleteDoc(d.ref)))
        console.log("🧹 サブコレクション chat を削除しました", chatSnap.size)
      } catch (e) {
        console.error("❌ サブコレクション chat の削除に失敗しました", e)
      }

      // 商品/オークション削除
      const productRef = doc(db, collectionName, productId)
      await deleteDoc(productRef)

      // オークション: 入札履歴削除
      if (itemType === 'auction') {
        try {
          const biddingQuery = collection(db, "bidding_history")
          const biddingSnapshot = await getDocs(biddingQuery)
          const bidsToDelete = biddingSnapshot.docs.filter(doc => doc.data().auction_productid === productId)
          await Promise.all(bidsToDelete.map(doc => deleteDoc(doc.ref)))
          console.log(`🧹 入札履歴を削除しました: ${bidsToDelete.length}件`)
        } catch (e) {
          console.error("❌ 入札履歴の削除に失敗しました", e)
        }
      }

      router.push("/profile")
    } catch (e) {
      console.error("評価の送信または商品削除に失敗しました", e)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                  <Image
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg mb-1 truncate">{product.title}</h2>
                  <p className="text-2xl font-bold text-primary">¥{product.price.toLocaleString()}</p>
                </div>
                {bothAgreed && (
                  <Badge variant="secondary" className="shrink-0">
                    取引合意済み
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {/* チャット相手（自分が出品者なら購入者、それ以外は出品者）を表示 */}
                {(() => {
                  const isSeller = user ? user.uid === product.sellerId : false
                  const counterpartImage = isSeller
                    ? chatUsers?.buyerImage || "/placeholder-user.jpg"
                    : chatUsers?.sellerImage || product.sellerImage || "/placeholder-user.jpg"
                  const counterpartLabel = isSeller ? "購入者とのチャット" : `${product.sellerName}とのチャット`
                  return (
                    <>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={counterpartImage} />
                        <AvatarFallback>{(isSeller ? "相" : product.sellerName[0])}</AvatarFallback>
                      </Avatar>
                      {counterpartLabel}
                    </>
                  )
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto bg-white">
                {/* Firestore の messages を表示用に整形 */}
                {Object.entries(
                  groupMessagesByDate(
                    chatMessages.map((m) => ({
                      id: m.id,
                      senderId: m.senderId,
                      senderName: m.senderName,
                      content: m.content,
                      timestamp: m.createdAt
                        ? m.createdAt.toLocaleString("ja-JP", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "",
                    }))
                  )
                ).map(([date, msgs]) => (
                  <div key={date}>
                    {/* 日付区切り線（Slack風） */}
                    <div className="flex items-center my-6">
                      <div className="flex-grow border-t border-gray-300"></div>
                      <span className="mx-4 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm">{date}</span>
                      <div className="flex-grow border-t border-gray-300"></div>
                    </div>
                    {/* メッセージ本体 */}
                    {msgs.map((message: Message) => {
                      // 自分のIDをFirebase Authから取得
                      const isCurrentUser = user ? message.senderId === user.uid : false
                      // 時間だけ抽出
                      let time = ""
                      const match = message.timestamp.match(/\d{2}:\d{2}/)
                      if (match) time = match[0]
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 items-end ${isCurrentUser ? "justify-end flex-row-reverse" : "justify-start"}`}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            {/* メッセージ送信者の画像は chatUsers を優先して参照 */}
                            {(() => {
                              if (isCurrentUser) {
                                return <AvatarImage src={user?.photoURL || "/placeholder-user.jpg"} />
                              }
                              // 相手の画像を chatUsers から決定
                              let otherImage = product.sellerImage || "/placeholder-user.jpg"
                              if (chatUsers) {
                                if (chatUsers.sellerId === message.senderId) otherImage = chatUsers.sellerImage || otherImage
                                else if (chatUsers.buyerId === message.senderId) otherImage = chatUsers.buyerImage || otherImage
                              }
                              return <AvatarImage src={otherImage} />
                            })()}
                            <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}> 
                            <div
                              className={`rounded-lg px-4 py-2 max-w-[80%] shadow ${
                                isCurrentUser
                                  ? "bg-blue-500 text-white border border-blue-400"
                                  : "bg-gray-100 text-gray-900 border border-gray-300"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{message.content}</p>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">{time}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {!bothAgreed && (
                <div className="flex gap-2">
                  <Input
                    placeholder="メッセージを入力..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          {!bothAgreed && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">取引の進行</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  取引内容について双方が合意したら、「同意する」ボタンを押してください。双方の同意が確認されると評価ステップへ進みます。
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleAgree} disabled={hasAgreed} className="w-full">
                    <Check className="h-4 w-4 mr-2" />
                    {hasAgreed ? "同意済み（相手の同意待ち）" : "同意する"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {bothAgreed && (
            <Card>
              <CardContent className="p-6">
                {isBuyer ? (
                  <>
                    <h3 className="font-semibold mb-3">出品者を評価する</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      商品の受け取り後、取引相手（出品者）を評価してください。評価の送信をもって取引は完了します。
                    </p>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <Button
                          key={r}
                          type="button"
                          variant={rating === r ? "default" : "outline"}
                          size="lg"
                          className="flex-1"
                          onClick={() => setRating(r)}
                        >
                          {r}
                        </Button>
                      ))}
                    </div>
                    <Input
                      placeholder="コメントを入力（任意）"
                      className="mb-4"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <Button className="w-full" onClick={handleSubmitEvaluation} disabled={!rating}>
                      評価を送信して取引を完了
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold mb-3">評価待ち</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      双方の同意が完了しました。購入者の評価送信をお待ちください。
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      </div>
    </ProtectedRoute>
  )
}

  export default function ChatPage({ params }: { params: Promise<{ productId: string }> }) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                読み込み中...
              </div>
            </div>
          </main>
        </div>
      }>
        <ChatPageContent params={params} />
      </Suspense>
    )
  }
