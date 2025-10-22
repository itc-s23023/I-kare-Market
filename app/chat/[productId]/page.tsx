"use client"
import { use, useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Check } from "lucide-react"
import { mockProducts, mockUser } from "@/lib/mock-data"
import Image from "next/image"
import { notFound } from "next/navigation"

export default function ChatPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = use(params)
  const product = mockProducts.find((p) => p.id === productId)
  const [messages, setMessages] = useState([
    {
      id: "1",
      senderId: product?.sellerId || "",
      senderName: product?.sellerName || "",
      content: "こんにちは！商品に興味を持っていただきありがとうございます。",
      timestamp: "2024-01-15 10:30",
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [transactionStatus, setTransactionStatus] = useState<"negotiating" | "agreed" | "completed">("negotiating")

  if (!product) {
    notFound()
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      id: Date.now().toString(),
      senderId: mockUser.id,
      senderName: mockUser.name,
      content: newMessage,
      timestamp: new Date().toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    setMessages([...messages, message])
    setNewMessage("")
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
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {messages.map((message) => {
                  const isCurrentUser = message.senderId === mockUser.id
                  return (
                    <div key={message.id} className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src="/diverse-user-avatars.png" />
                        <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${isCurrentUser ? "items-end" : "items-start"} flex flex-col`}>
                        <div
                          className={`rounded-lg px-4 py-2 max-w-[80%] ${
                            isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">{message.timestamp}</span>
                      </div>
                    </div>
                  )
                })}
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
