"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useChat } from "@/hooks/useChat"
import { useAuth } from "@/components/auth-provider"
import { useAuction } from "@/hooks/useAuctions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, ArrowLeft, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const auctionId = params.id as string
  const { auction, loading: auctionLoading } = useAuction(auctionId)
  const { messages, loading, error, sendMessage } = useChat("auctions", auctionId)

  // メッセージが更新されたら自動スクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || !user || sending) return

    setSending(true)
    try {
      await sendMessage({
        senderId: user.uid,
        senderName: user.displayName || "匿名ユーザー",
        content: message.trim()
      })
      setMessage("")
    } catch (error) {
      console.error("メッセージ送信エラー:", error)
    } finally {
      setSending(false)
    }
  }

  const isMyMessage = (senderId: string) => {
    return user?.uid === senderId
  }

  const getMessageTime = (createdAt: Date | null) => {
    if (!createdAt) return ""
    return format(createdAt, "MM/dd HH:mm", { locale: ja })
  }

  if (auctionLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">オークションが見つかりません</p>
            <Button 
              variant="outline" 
              onClick={() => router.push("/auctions")}
              className="mt-4"
            >
              オークション一覧に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg">{auction.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={auction.status === "active" ? "default" : "secondary"}>
                    {auction.status === "active" ? "開催中" : "終了"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    出品者: {auction.sellerName}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* チャットエリア */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">取引チャット</CardTitle>
        </CardHeader>

        {/* メッセージ一覧 */}
        <CardContent className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="text-center text-red-500 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${isMyMessage(msg.senderId) ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-start gap-2 max-w-[70%] ${isMyMessage(msg.senderId) ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {msg.senderId === "system" ? "S" : msg.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`rounded-lg p-3 ${
                    msg.senderId === "system"
                      ? "bg-muted text-muted-foreground text-center"
                      : isMyMessage(msg.senderId)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    {msg.senderId !== "system" && (
                      <div className="text-xs opacity-70 mb-1">
                        {msg.senderName}
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isMyMessage(msg.senderId) ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {getMessageTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                メッセージはまだありません。<br />
                取引についてやり取りを開始しましょう。
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </CardContent>

        {/* メッセージ入力 */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="メッセージを入力..."
              disabled={sending}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={sending || !message.trim()}
              size="icon"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}