"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Send, ArrowLeft, Package } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/components/firebaseConfig"
import Link from "next/link"

interface Product {
  id: string
  productname: string
  image_url: string
  price: number
  sellerName: string
  userid: string
  status: string
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const productId = params.productId as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Array<{
    id: string
    senderId: string
    senderName: string
    message: string
    timestamp: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) return

    const fetchProduct = async () => {
      try {
        console.log("🔄 商品情報取得開始:", productId)
        
        const docRef = doc(db, "products", productId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          
          const productData: Product = {
            id: docSnap.id,
            productname: String(data.productname || "商品名なし"),
            image_url: String(data.image_url || "/placeholder.jpg"),
            price: Number(data.price) || 0,
            sellerName: String(data.sellerName || "匿名ユーザー"),
            userid: String(data.userid || ""),
            status: String(data.status || "active")
          }
          
          setProduct(productData)
          console.log("✅ 商品情報取得完了")
        } else {
          console.log("❌ 商品が見つかりません")
          setError("商品が見つかりません")
        }
      } catch (error: any) {
        console.error("❌ 商品情報取得エラー:", error)
        setError(`商品情報の取得に失敗しました: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="mb-4">チャット機能を利用するにはログインが必要です</p>
                <Button asChild>
                  <Link href="/login">ログインページへ</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

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
              チャット情報を読み込み中...
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <h3 className="text-red-800 font-semibold mb-2">エラーが発生しました</h3>
              <p className="text-red-600 text-sm mb-4">{error || "商品が見つかりません"}</p>
              <Button onClick={() => router.back()} variant="outline">
                戻る
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const isOwner = user.uid === product.userid

  if (isOwner) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="mb-4">自分の商品とはチャットできません</p>
                <Button asChild variant="outline">
                  <Link href={`/products/${productId}`}>商品詳細に戻る</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  const handleSendMessage = () => {
    if (!message.trim()) return

    // 実際のチャット機能は今後実装
    alert("チャット機能は準備中です")
    setMessage("")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* チャットヘッダー */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 relative rounded-md overflow-hidden bg-muted">
                    <img
                      src={product.image_url}
                      alt={product.productname}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold truncate">{product.productname}</h2>
                    <p className="text-sm text-muted-foreground">
                      出品者: {product.sellerName}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      ¥{product.price.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="shrink-0">
                    <Badge variant={product.status === "sold" ? "secondary" : "default"}>
                      {product.status === "sold" ? "売却済み" : "販売中"}
                    </Badge>
                  </div>
                </div>
                
                <Button asChild variant="outline" size="sm">
                  <Link href={`/products/${productId}`}>
                    <Package className="h-4 w-4 mr-2" />
                    商品詳細
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* チャットエリア */}
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                チャット
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* メッセージ表示エリア */}
              <div className="flex-1 mb-4 p-4 bg-muted/30 rounded-lg min-h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-2">チャット機能は準備中です</p>
                  <p className="text-sm">
                    現在、リアルタイムチャット機能を開発中です。<br />
                    しばらくお待ちください。
                  </p>
                </div>
              </div>

              {/* メッセージ入力エリア */}
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="メッセージを入力..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage()
                    }
                  }}
                  disabled
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                チャット機能は現在開発中です
              </div>
            </CardContent>
          </Card>

          {/* 取引に関する注意事項 */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2 text-sm">取引時の注意事項</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 学内での直接取引を推奨しています</p>
                <p>• 商品の状態や詳細は事前によく確認してください</p>
                <p>• 個人情報の交換は慎重に行ってください</p>
                <p>• トラブルがあった場合は運営まで報告してください</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
