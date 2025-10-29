"use client"

import { use, useState, useRef, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Check } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useChat } from "@/hooks/useChat"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/components/firebaseConfig"
import Image from "next/image"
import { notFound } from "next/navigation"




export default function ChatPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params)
  const [product, setProduct] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) return
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", productId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setProduct({
            id: docSnap.id,
            title: data.productname || "商品名なし",
            price: data.price || 0,
            description: data.content || "",
            condition: data.condition || "",
            images: Array.isArray(data.image_urls) ? data.image_urls : [data.image_url || "/placeholder.jpg"],
            sellerId: data.userid || "",
            sellerName: data.sellerName || "匿名ユーザー",
            sellerRating: data.sellerRating || 0,
            createdAt: data.createdAt || "",
            status: data.status || "active",
          })
        } else {
          setError("商品が見つかりません")
        }
      } catch (e: any) {
        setError("商品データ取得エラー: " + e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId])
  type Message = {
    id: string
    senderId: string
    senderName: string
    content: string
    timestamp: string
  }

  // auth
  const { user } = useAuth()

  // useChat: products/{productId}/chat サブコレクションを購読
  const { messages: chatMessages, loading: chatLoading, error: chatError, sendMessage } = useChat(
    "products",
    productId
  )
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
  const [transactionStatus, setTransactionStatus] = useState<"negotiating" | "agreed" | "completed">("negotiating")

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
  if (error || !product) {
    notFound()
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    if (!user) {
      // ログインしていない場合は送信を防ぐ（AuthProvider側でログイン導線を出す）
      return
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

  const handleAgree = () => {
    setTransactionStatus("agreed")
  }

  const handleComplete = () => {
    setTransactionStatus("completed")
  }

  return (
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
                {transactionStatus === "agreed" && (
                  <Badge variant="secondary" className="shrink-0">
                    取引合意済み
                  </Badge>
                )}
                {transactionStatus === "completed" && <Badge className="shrink-0">取引完了</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/seller-avatar.png" />
                  <AvatarFallback>{product.sellerName[0]}</AvatarFallback>
                </Avatar>
                {product.sellerName}とのチャット
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
                            <AvatarImage src="/diverse-user-avatars.png" />
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

              {transactionStatus === "negotiating" && (
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

          {transactionStatus === "negotiating" && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">取引の進行</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  取引内容について双方が合意したら、「取引に合意する」ボタンを押してください。
                </p>
                <Button onClick={handleAgree} className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  取引に合意する
                </Button>
              </CardContent>
            </Card>
          )}

          {transactionStatus === "agreed" && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">商品の受け取り</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  商品を受け取ったら、「取引を完了する」ボタンを押して、出品者を評価してください。
                </p>
                <Button onClick={handleComplete} className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  取引を完了する
                </Button>
              </CardContent>
            </Card>
          )}

          {transactionStatus === "completed" && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">出品者を評価する</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  取引はいかがでしたか？出品者を評価してください。
                </p>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button key={rating} variant="outline" size="lg" className="flex-1 bg-transparent">
                      {rating}
                    </Button>
                  ))}
                </div>
                <Input placeholder="コメントを入力（任意）" className="mb-4" />
                <Button className="w-full">評価を送信</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
