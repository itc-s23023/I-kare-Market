"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useAuction, useBidding, useBiddingHistory, useAuctionManagement, useAuctionAutoClose } from "@/hooks/useAuctions"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/components/confirm-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, TrendingUp, User, Heart, Gavel, AlertCircle, History, ShoppingCart, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const { placeBid, isSubmitting } = useBidding()
  const { biddingHistory, loading: historyLoading, error: historyError } = useBiddingHistory(auctionId)
  const { closeAuction, buyNow, isProcessing } = useAuctionManagement()

  useAuctionAutoClose()

  const [bidAmount, setBidAmount] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [bidError, setBidError] = useState<string | null>(null)
  const [bidSuccess, setBidSuccess] = useState<string | null>(null)
  
  // リアルタイム更新エフェクト用の状態
  const [priceUpdated, setPriceUpdated] = useState(false)
  const [previousPrice, setPreviousPrice] = useState<number | null>(null)

  // 価格更新の監視とエフェクト
  useEffect(() => {
    if (auction) {
      if (previousPrice !== null && auction.currentBid !== previousPrice) {
        setPriceUpdated(true)
        // 2秒後にエフェクトを終了
        setTimeout(() => setPriceUpdated(false), 2000)
      }
      setPreviousPrice(auction.currentBid)
    }
  }, [auction?.currentBid, previousPrice])

  useEffect(() => {
    if (auction) {
      const minimumBid = auction.currentBid + 100
      setBidAmount(minimumBid.toString())
    }
  }, [auction?.currentBid])

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
  const isAuctionEnded = auction.status === "ended" || timeRemaining.isEnded

  const handleLikeClick = () => {
    setIsLiked(!isLiked)
  }

  const handleBid = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setBidError(null)
    setBidSuccess(null)

    const bid = Number(bidAmount)
    if (bid < minimumBid) {
      setBidError(`入札額は現在価格より100円以上高く設定してください（最低入札額: ¥${minimumBid.toLocaleString()}）`)
      return
    }

    try {
      const result = await placeBid(auctionId, bid)
      setBidSuccess(result.message)
      setBidAmount("")
      window.location.reload()
    } catch (error: any) {
      setBidError(error.message)
    }
  }

  const handleBuyNow = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setBidError(null)
    setBidSuccess(null)

    try {
      const result = await buyNow(auctionId)
      setBidSuccess(result.message)

      setTimeout(() => {
          router.push(`/chat/${auctionId}?type=auction`)
      }, 2000)
    } catch (error: any) {
      setBidError(error.message)
    }
  }

  const handleManualClose = async () => {
    if (!isOwner) return

    setBidError(null)
    setBidSuccess(null)

    try {
      const result = await closeAuction(auctionId, "expired")
      setBidSuccess(result.message)

      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      setBidError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                {isAuctionEnded && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="secondary" className="text-lg">
                      オークション終了
                    </Badge>
                  </div>
                )}
              </div>

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

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {hasNoBids ? "開始価格" : "現在の最高入札額"}
                      </p>
                      <p className={`text-4xl font-bold transition-colors duration-500 ${
                        priceUpdated ? "text-green-500" : "text-primary"
                      }`}>
                        ¥{auction.currentBid.toLocaleString()}
                      </p>
                      {priceUpdated && (
                        <p className="text-sm text-green-600 font-medium animate-pulse">
                          ↗ 価格が更新されました！
                        </p>
                      )}
                    </div>

                    {auction.buyNowPrice && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">即決価格</p>
                        <p className="text-xl font-semibold">
                          ¥{auction.buyNowPrice.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {bidError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{bidError}</p>
                      </div>
                    )}

                    {bidSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-600 text-sm">{bidSuccess}</p>
                      </div>
                    )}

                    {isOwner && !isAuctionEnded && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-muted-foreground">出品者オプション</p>
                              <p className="text-xs text-muted-foreground">オークションを手動で終了できます</p>
                            </div>
                            <ConfirmDialog
                              trigger={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isProcessing}
                                  className="flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {isProcessing ? "処理中..." : "終了"}
                                </Button>
                              }
                              title="オークションを終了しますか？"
                              description={(
                                <>
                                  手動終了すると現在の最高入札者が落札者となり、以後の入札はできなくなります。<br />
                                  この操作は取り消せません。よろしいですか？
                                </>
                              )}
                              confirmLabel="終了を確定"
                              onConfirm={handleManualClose}
                              confirmDisabled={isProcessing}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {!isAuctionEnded && !isOwner && (
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
                            <ConfirmDialog
                              trigger={
                                <Button
                                  className="px-6"
                                  disabled={!bidAmount || Number(bidAmount) < minimumBid || isSubmitting}
                                >
                                  <Gavel className="h-4 w-4 mr-2" />
                                  {isSubmitting ? "入札中..." : "入札"}
                                </Button>
                              }
                              title="本当に入札しますか？"
                              description={(
                                <>
                                  入札額: <span className="font-bold">¥{bidAmount}</span> で入札します。<br />
                                  この操作は取り消せません。
                                </>
                              )}
                              confirmLabel="入札を確定"
                              onConfirm={handleBid}
                              confirmDisabled={!bidAmount || Number(bidAmount) < minimumBid || isSubmitting}
                              loading={isSubmitting}
                            />
                          </div>
                        </div>

                        {auction.buyNowPrice && (
                          <ConfirmDialog
                            trigger={
                              <Button
                                variant="outline"
                                size="lg"
                                className="w-full"
                                disabled={isProcessing}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                {isProcessing ? "処理中..." : `¥${auction.buyNowPrice.toLocaleString()} で即決購入`}
                              </Button>
                            }
                            title="即決購入の確認"
                            description={(
                              <>
                                即決価格 <span className="font-bold">¥{auction.buyNowPrice.toLocaleString()}</span> で購入を確定します。<br />
                                確定後は入札が終了し、取引チャット画面へ移動します。<br />
                                この操作は取り消せません。よろしいですか？
                              </>
                            )}
                            confirmLabel="即決購入を確定"
                            onConfirm={handleBuyNow}
                            confirmDisabled={isProcessing}
                            loading={isProcessing}
                          />
                        )}
                      </div>
                    )}

                    {isOwner && auction.status === "active" && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">これはあなたが出品したオークションです</span>
                        </div>
                      </div>
                    )}

                    {isAuctionEnded && (
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="font-semibold text-muted-foreground">
                          このオークションは終了しています
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          入札履歴は自動的に削除されました
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">商品情報</TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2" disabled={isAuctionEnded}>
                    <History className="h-4 w-4" />
                    入札履歴 ({isAuctionEnded ? 0 : auction.bidCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info">
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
                </TabsContent>

                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        入札履歴
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isAuctionEnded ? (
                        <div className="text-center py-8">
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-700 font-medium">オークション終了</p>
                            <p className="text-yellow-600 text-sm mt-1">
                              入札履歴は自動的に削除されました
                            </p>
                          </div>
                        </div>
                      ) : historyLoading ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">入札履歴を読み込み中...</p>
                        </div>
                      ) : historyError ? (
                        <div className="text-center py-8">
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{historyError}</p>
                          </div>
                        </div>
                      ) : biddingHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">まだ入札がありません</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {biddingHistory.map((bid, index) => (
                            <div key={bid.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge variant={index === 0 ? "default" : "secondary"} className="min-w-fit">
                                  {index === 0 ? "最高額" : `${index + 1}位`}
                                </Badge>
                                <div>
                                  <p className="font-medium">{bid.username}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(bid.bid_time).toLocaleString("ja-JP")}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">
                                  ¥{bid.bid_amount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
