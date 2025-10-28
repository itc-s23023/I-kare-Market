"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useAuction } from "@/hooks/useAuctions"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, TrendingUp, User, Heart, Gavel, AlertCircle } from "lucide-react"
import Image from "next/image"

function getTimeRemaining(endTime: string) {
  const now = new Date()
  const end = new Date(endTime)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return { text: "終了", isEnding: false, isEnded: true }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return { text: `残り${days}日`, isEnding: days <= 1, isEnded: false }
  if (hours > 0) return { text: `残り${hours}時間`, isEnding: true, isEnded: false }
  return { text: `残り${minutes}分`, isEnding: true, isEnded: false }
}

export default function AuctionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const auctionId = params.id as string
  const { auction, loading, error } = useAuction(auctionId)
  
  const [bidAmount, setBidAmount] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              オークション詳細を読み込み中...
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <h3 className="text-red-800 font-semibold mb-2">エラーが発生しました</h3>
              <p className="text-red-600 text-sm mb-4">{error || "オークションが見つかりません"}</p>
              <Button onClick={() => router.back()} variant="outline">
                戻る
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const timeRemaining = getTimeRemaining(auction.endTime)
  const hasNoBids = auction.bidCount === 0
  const isOwner = user?.uid === auction.sellerId
  const minimumBid = auction.currentBid + 100

  const handleLikeClick = () => {
    setIsLiked(!isLiked)
  }

  const handleBid = () => {
    if (!user) {
      router.push("/login")
      return
    }

    const bid = Number(bidAmount)
    if (bid < minimumBid) {
      alert(`入札額は現在価格より100円以上高く設定してください（最低入札額: ¥${minimumBid.toLocaleString()}）`)
      return
    }

    // 実際の入札機能は今後実装
    alert("入札機能は準備中です")
  }

  const handleBuyNow = () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (auction.buyNowPrice) {
      // 即決購入機能は今後実装
      alert("即決購入機能は準備中です")
    }
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
                  src={auction.images[currentImageIndex] || "/placeholder.svg"}
                  alt={auction.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-4 right-4 h-10 w-10 rounded-full shadow-md"
                  onClick={handleLikeClick}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                </Button>

                {timeRemaining.isEnded && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="secondary" className="text-lg">
                      オークション終了
                    </Badge>
                  </div>
                )}
              </div>

              {/* サムネイル画像 */}
              {auction.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {auction.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                        currentImageIndex === index ? "border-primary" : "border-muted"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${auction.title} ${index + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 詳細エリア */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-4">{auction.title}</h1>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{auction.sellerName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{hasNoBids ? "入札なし" : `${auction.bidCount}件の入札`}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className={`text-lg font-medium ${timeRemaining.isEnding ? "text-destructive" : "text-muted-foreground"}`}>
                    {timeRemaining.text}
                  </span>
                </div>
              </div>

              {/* 価格・入札エリア */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {hasNoBids ? "開始価格" : "現在の最高入札額"}
                      </p>
                      <p className="text-4xl font-bold text-primary">
                        ¥{auction.currentBid.toLocaleString()}
                      </p>
                    </div>

                    {auction.buyNowPrice && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">即決価格</p>
                        <p className="text-xl font-semibold">
                          ¥{auction.buyNowPrice.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {!timeRemaining.isEnded && !isOwner && (
                      <div className="space-y-3">
                        <Separator />
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            入札額 (最低: ¥{minimumBid.toLocaleString()})
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              placeholder={minimumBid.toString()}
                              min={minimumBid}
                              className="flex-1"
                            />
                            <Button 
                              onClick={handleBid}
                              className="px-6"
                              disabled={!bidAmount || Number(bidAmount) < minimumBid}
                            >
                              <Gavel className="h-4 w-4 mr-2" />
                              入札
                            </Button>
                          </div>
                        </div>

                        {auction.buyNowPrice && (
                          <Button 
                            onClick={handleBuyNow}
                            variant="outline"
                            size="lg"
                            className="w-full"
                          >
                            ¥{auction.buyNowPrice.toLocaleString()} で即決購入
                          </Button>
                        )}
                      </div>
                    )}

                    {isOwner && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">これはあなたが出品したオークションです</span>
                        </div>
                      </div>
                    )}

                    {timeRemaining.isEnded && (
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="font-semibold text-muted-foreground">このオークションは終了しています</p>
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
                    <p className="text-muted-foreground whitespace-pre-wrap">{auction.description}</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {auction.category && (
                      <div>
                        <span className="font-medium">カテゴリー:</span>
                        <Badge variant="secondary" className="ml-2">
                          {auction.category}
                        </Badge>
                      </div>
                    )}
                    {auction.condition && (
                      <div>
                        <span className="font-medium">商品の状態:</span>
                        <Badge variant="outline" className="ml-2">
                          {auction.condition}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>オークション開始: {new Date(auction.createdAt).toLocaleString("ja-JP")}</p>
                    <p>オークション終了: {new Date(auction.endTime).toLocaleString("ja-JP")}</p>
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
