"use client"
import { use } from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, Clock, TrendingUp, Gavel, MessageCircle, Heart } from "lucide-react"
import { mockAuctions, mockBids, mockLikedProducts } from "@/lib/mock-data"
import Image from "next/image"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"

const conditionLabels = {
  new: "新品",
  "like-new": "未使用に近い",
  good: "良好",
  fair: "可",
}

function getTimeRemaining(endTime: string) {
  const now = new Date()
  const end = new Date(endTime)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return { text: "終了", isEnded: true }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return { text: `${days}日 ${hours}時間`, isEnded: false }
  if (hours > 0) return { text: `${hours}時間 ${minutes}分`, isEnded: false }
  return { text: `${minutes}分`, isEnded: false }
}

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const auction = mockAuctions.find((a) => a.id === id)
  const bids = mockBids[id] || []
  const [bidAmount, setBidAmount] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLiked, setIsLiked] = useState(mockLikedProducts.includes(id))

  if (!auction) {
    notFound()
  }

  const timeRemaining = getTimeRemaining(auction.endTime)
  const minBid = auction.currentBid + 100

  const handleBid = () => {
    const amount = Number.parseInt(bidAmount)
    if (amount >= minBid) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setBidAmount("")
      }, 2000)
    }
  }

  const handleBuyNow = () => {
    router.push(`/chat/${auction.id}`)
  }

  const handleContactWinner = () => {
    router.push(`/chat/${auction.id}`)
  }

  const handleContactSeller = () => {
    router.push(`/chat/${auction.id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
              <Image src={auction.images[0] || "/placeholder.svg"} alt={auction.title} fill className="object-cover" />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-4 right-4 h-12 w-12 rounded-full shadow-lg"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`h-6 w-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-3xl font-bold text-balance leading-tight">{auction.title}</h1>
                {auction.status === "ended" && (
                  <Badge variant="secondary" className="shrink-0">
                    終了
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{auction.category}</Badge>
                <Badge variant="secondary">{conditionLabels[auction.condition]}</Badge>
              </div>
            </div>

            <Card className="border-primary">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">現在の入札額</span>
                  <span className="text-4xl font-bold text-primary">¥{auction.currentBid.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>{auction.bidCount}件の入札</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className={timeRemaining.isEnded ? "text-destructive" : ""}>
                      残り時間: {timeRemaining.text}
                    </span>
                  </div>
                </div>

                {auction.highestBidderName && (
                  <div className="text-sm text-muted-foreground">
                    最高入札者: <span className="font-semibold">{auction.highestBidderName}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {!timeRemaining.isEnded && auction.status === "active" ? (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="bid-amount">入札額を入力</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="bid-amount"
                        type="number"
                        placeholder={`¥${minBid.toLocaleString()}以上`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min={minBid}
                      />
                      <Button onClick={handleBid} disabled={!bidAmount || Number.parseInt(bidAmount) < minBid}>
                        <Gavel className="h-4 w-4 mr-2" />
                        入札
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">最低入札額: ¥{minBid.toLocaleString()}</p>
                  </div>

                  {showSuccess && (
                    <div className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm">
                      入札が完了しました！
                    </div>
                  )}

                  {auction.buyNowPrice && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">即決価格</span>
                        <span className="text-2xl font-bold">¥{auction.buyNowPrice.toLocaleString()}</span>
                      </div>
                      <Button onClick={handleBuyNow} variant="secondary" className="w-full">
                        即決で購入
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <p className="text-lg font-semibold">オークションが終了しました</p>
                    {auction.highestBidderName && (
                      <div>
                        <p className="text-muted-foreground mb-4">
                          落札者: <span className="font-semibold">{auction.highestBidderName}</span>
                        </p>
                        <Button onClick={handleContactSeller} className="w-full">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          出品者とチャットで取引を進める
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">商品の説明</h2>
                <p className="text-muted-foreground leading-relaxed">{auction.description}</p>
              </CardContent>
            </Card>

            {bids.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold mb-4">入札履歴</h2>
                  <div className="space-y-3">
                    {bids.map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{bid.bidderName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(bid.timestamp).toLocaleString("ja-JP")}
                          </p>
                        </div>
                        <p className="font-bold text-primary">¥{bid.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">出品者情報</h2>
                <Link
                  href={`/users/${auction.sellerId}`}
                  className="block hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="/diverse-user-avatars.png" />
                      <AvatarFallback>{auction.sellerName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold hover:underline">{auction.sellerName}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{auction.sellerRating}</span>
                        <span className="ml-2">(15件の評価)</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
