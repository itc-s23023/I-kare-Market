"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Heart, ShoppingCart, AlertCircle, User, Calendar, Package, Shield } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/components/firebaseConfig"
import { useEffect } from "react"

interface Product {
  id: string
  productname: string
  image_url: string
  image_urls: string[]
  price: number
  userid: string
  content: string
  is_trading: boolean
  condition?: string
  createdAt: string
  status: string
  sellerName: string
  sellerEmail: string
}

const conditionLabels = {
  new: "新品",
  "like-new": "未使用に近い",
  good: "良好",
  fair: "可",
} as const


export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const productId = params.id as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (!productId) return

    const fetchProduct = async () => {
      try {
        console.log("🔄 商品詳細取得開始:", productId)
        
        const docRef = doc(db, "products", productId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          console.log("📄 取得した商品詳細:", data)
          
          const productData: Product = {
            id: docSnap.id,
            productname: String(data.productname || "商品名なし"),
            image_url: String(data.image_url || "/placeholder.jpg"),
            image_urls: Array.isArray(data.image_urls) ? data.image_urls : [],
            price: Number(data.price) || 0,
            userid: String(data.userid || ""),
            content: String(data.content || ""),
            is_trading: Boolean(data.is_trading),
            condition: data.condition ? String(data.condition) : undefined,
            createdAt: String(data.createdAt || new Date().toISOString()),
            status: String(data.status || "active"),
            sellerName: String(data.sellerName || "匿名ユーザー"),
            sellerEmail: String(data.sellerEmail || "")
          }
          
          setProduct(productData)
          console.log("✅ 商品詳細取得完了")
        } else {
          console.log("❌ 商品が見つかりません")
          setError("商品が見つかりません")
        }
      } catch (error: any) {
        console.error("❌ 商品詳細取得エラー:", error)
        setError(`商品詳細の取得に失敗しました: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

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
              商品詳細を読み込み中...
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

  const isOwner = user?.uid === product.userid
  const isSold = product.status === "sold"
  const displayImages = product.image_urls.length > 0 ? product.image_urls : [product.image_url]

  const handleLikeClick = () => {
    setIsLiked(!isLiked)
  }

  const handlePurchase = () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (isSold) {
      alert("この商品は既に売却済みです")
      return
    }


    alert("購入機能は準備中です")
  }

  const handleChat = () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (isOwner) {
      alert("自分の商品とはチャットできません")
      return
    }

    // チャットページにリダイレクト
    router.push(`/chat/${productId}`)
  }

  const getConditionLabel = (condition?: string) => {
    if (!condition) return "状態不明"
    return conditionLabels[condition as keyof typeof conditionLabels] || condition
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 画像エリア */}
            <div className="space-y-4">
              <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
                <Image
                  src={displayImages[currentImageIndex] || "/placeholder.svg"}
                  alt={product.productname}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
                
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-4 right-4 h-10 w-10 rounded-full shadow-md"
                  onClick={handleLikeClick}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                </Button>

                {/* 交渉可能バッジ */}
                {product.is_trading && (
                  <Badge className="absolute top-4 left-4 bg-blue-500 text-white">
                    交渉可
                  </Badge>
                )}

                {/* 売却済み表示 */}
                {isSold && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="secondary" className="text-lg">
                      売却済み
                    </Badge>
                  </div>
                )}
              </div>

              {/* サムネイル画像 */}
              {displayImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {displayImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                        currentImageIndex === index ? "border-primary" : "border-muted"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.productname} ${index + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 詳細エリア */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-4">{product.productname}</h1>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <Link 
                    href={`/users/${product.userid}`}
                    className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    <span className="underline-offset-4 hover:underline">{product.sellerName}</span>
                  </Link>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(product.createdAt).toLocaleDateString("ja-JP")}</span>
                  </div>
                </div>

                {/* 商品ステータス */}
                <div className="flex items-center gap-2 mb-6">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span className={`text-lg font-medium ${isSold ? "text-destructive" : "text-green-600"}`}>
                    {isSold ? "売却済み" : "販売中"}
                  </span>
                </div>
              </div>

              {/* 価格・購入エリア */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">価格</p>
                      <p className="text-4xl font-bold text-primary">
                        ¥{product.price.toLocaleString()}
                      </p>
                    </div>

                    {!isSold && !isOwner && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleChat}
                            className="flex-1 bg-black text-white hover:bg-gray-800"
                            size="lg"
                          >
                            <MessageCircle className="h-5 w-5 mr-2 text-white" />
                            チャット
                          </Button>
                        </div>
                      </div>
                    )}

                    {isOwner && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">これはあなたが出品した商品です</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {isSold && (
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="font-semibold text-muted-foreground">この商品は売却済みです</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 商品情報 */}
              <Card>
                <CardHeader>
                  <CardTitle>商品情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">商品説明</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {product.content || "商品説明はありません"}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">商品の状態:</span>
                        <Badge variant="outline">
                          {getConditionLabel(product.condition)}
                        </Badge>
                      </div>
                    </div>
                  
             

                  <Separator />

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>出品日時: {new Date(product.createdAt).toLocaleString("ja-JP")}</p>
                    <p>出品者: {product.sellerName}</p>
                    {product.sellerEmail && (
                      <p>連絡先: {product.sellerEmail}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 取引に関する注意事項 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">取引に関する注意事項</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• 学内での取引を推奨しています</p>
                    <p>• 商品の状態は出品者の主観による判断です</p>
                    <p>• トラブルがあった場合は運営まで報告してください</p>
                    <p>• 取引前に必ずチャットで詳細を確認することをお勧めします</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
