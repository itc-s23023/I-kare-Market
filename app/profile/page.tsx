"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Package, History, Calendar, Heart, Pencil } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { AuctionCard } from "@/components/auction-card"
import Link from "next/link"
import { useMemo, useState, useEffect } from "react"

import { useProducts } from "@/hooks/useProducts"
import { usePurchaseHistory } from "@/hooks/usePurchase_history"
import { useLikes } from "@/hooks/uselike"
import { useAuctions } from "@/hooks/useAuctions"
import { useAuth } from "@/components/auth-provider"
import { useEvaluations } from "@/hooks/useEvaluations"
import { ProtectedRoute } from "@/components/protected-route"

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const { user } = useAuth()
  // fetch user-specific data; hooks should handle empty userId gracefully
  const {
    products: userProducts = [],
    loading: productsLoading,
    error: productsError,
  } = useProducts(user?.uid || "")
  const {
    purchaseHistory = [],
    loading: historyLoading,
    error: historyError,
  } = usePurchaseHistory(user?.uid || "")
  const {
    likedProducts = [],
    likedAuctions = [],
    loading: likesLoading,
  } = useLikes()
  const {
    auctions: allAuctions = [],
    loading: auctionsLoading,
    error: auctionsError,
  } = useAuctions()
  const { evaluations, loading: evaluationsLoading, error: evaluationsError } = useEvaluations()

  // 取引履歴ページネーション制御
  const [historyPage, setHistoryPage] = useState(1)
  useEffect(() => {
    // データ件数が変わったら1ページ目に戻す
    setHistoryPage(1)
  }, [purchaseHistory.length])

  // ユーザーが出品したオークション商品をフィルタリング（アクティブなもののみ）
  const userAuctions = allAuctions.filter((auction) => 
    auction.sellerId === user?.uid && auction.status === "active"
  )

  // 評価データから平均評価とレビュー数を計算
  const { averageRating, reviewCount } = useMemo(() => {
    if (!evaluations || evaluations.length === 0) {
      return { averageRating: 0, reviewCount: 0 }
    }
    const totalScore = evaluations.reduce((sum, ev) => sum + ev.score, 0)
    return {
      averageRating: Math.round((totalScore / evaluations.length) * 10) / 10,
      reviewCount: evaluations.length
    }
  }, [evaluations])

  // Firebase Authから登録日を取得
  const joinedDate = useMemo(() => {
    if (user?.metadata?.creationTime) {
      return new Date(user.metadata.creationTime).toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  }, [user])

  const profile = {
    name: user?.displayName || "匿名ユーザー",
    avatar: (user as any)?.photoURL || "/placeholder-user.jpg",
    rating: averageRating,
    reviewCount: reviewCount,
    joinedDate: joinedDate,
  }

  // 取引履歴のページネーション用の計算
  const HISTORY_PAGE_SIZE = 5
  const totalHistoryPages = Math.max(1, Math.ceil((purchaseHistory?.length || 0) / HISTORY_PAGE_SIZE))
  const safeHistoryPage = Math.min(historyPage, totalHistoryPages)
  const historyStart = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE
  const historyEnd = Math.min(historyStart + HISTORY_PAGE_SIZE, purchaseHistory?.length || 0)
  const paginatedHistory = (purchaseHistory || []).slice(historyStart, historyEnd)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback>{profile.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold mb-2">{profile.name}</h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{profile.rating}</span>
                      <span className="text-muted-foreground">({profile.reviewCount}件)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        登録日: {new Date(profile.joinedDate).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="selling" className="mb-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="selling">
                <Package className="h-4 w-4 mr-2" />
                出品中
              </TabsTrigger>
              <TabsTrigger value="buying">
                <History className="h-4 w-4 mr-2" />
                購入履歴
              </TabsTrigger>
              <TabsTrigger value="likes">
                <Heart className="h-4 w-4 mr-2" />
                いいね
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="h-4 w-4 mr-2" />
                評価
              </TabsTrigger>
            </TabsList>

            <TabsContent value="selling" className="mt-6">
              <Tabs defaultValue="flea-market" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="flea-market">
                    フリマ ({productsLoading ? "読み込み中..." : userProducts.length})
                  </TabsTrigger>
                  <TabsTrigger value="auction">
                    オークション ({auctionsLoading ? "読み込み中..." : userAuctions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="flea-market">
                  {productsLoading ? (
                    <div className="text-center py-12">読み込み中...</div>
                  ) : productsError ? (
                    <div className="text-center py-12 text-red-500">{productsError}</div>
                  ) : userProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                      {userProducts.map((product: any) => (
                        <div key={product.id} className="relative group">
                          <Link
                            href={`/products/${product.id}/edit`}
                            style={{ display: "block", height: "100%" }}
                            aria-label="商品を編集"
                            title="商品を編集"
                          >
                            <ProductCard product={product} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">出品中の商品はありません</p>
                      <Button asChild>
                        <Link href="/sell">商品を出品する</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="auction">
                  {auctionsLoading ? (
                    <div className="text-center py-12">読み込み中...</div>
                  ) : auctionsError ? (
                    <div className="text-center py-12 text-red-500">{auctionsError}</div>
                  ) : userAuctions.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                      {userAuctions.map((auction) => (
                        <div key={auction.id} className="relative group">
                          <Link
                            href={`/auctions/${auction.id}/edit`}
                            style={{ display: "block", height: "100%" }}
                            aria-label="オークションを編集"
                            title="オークションを編集"
                          >
                            <AuctionCard auction={auction} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">出品中のオークションはありません</p>
                      <Button asChild>
                        <Link href="/auctions/sell">オークションを出品する</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="buying" className="mt-6">
              {historyLoading ? (
                <div className="text-center py-12">読み込み中...</div>
              ) : historyError ? (
                <div className="text-center py-12 text-red-500">{historyError}</div>
              ) : purchaseHistory && purchaseHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm bg-card rounded-xl shadow-md border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-muted text-muted-foreground">
                        <th className="px-6 py-3 font-semibold text-left rounded-tl-xl">商品名</th>
                        <th className="px-6 py-3 font-semibold text-left">日付</th>
                        <th className="px-6 py-3 font-semibold text-right">金額</th>
                        <th className="px-6 py-3 font-semibold text-left rounded-tr-xl">取引相手</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHistory.map((purchase: any, idx: number) => (
                        <tr
                          key={purchase.id}
                          className={`transition-colors hover:bg-accent/60 ${idx === paginatedHistory.length - 1 ? 'last:rounded-b-xl' : ''}`}
                          style={{ boxShadow: '0 1px 0 0 #e5e7eb' }}
                        >
                          <td className="px-6 py-4 font-semibold">
                            {purchase.productName || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {purchase.purchaseDate
                              ? new Date(purchase.purchaseDate).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-base text-green-700">
                            ¥{(purchase.price ?? 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={purchase.sellerAvatar || "/seller-avatar.png"} />
                                <AvatarFallback>{(purchase.sellerName || "-").charAt(0)}</AvatarFallback>
                              </Avatar>
                              {purchase.sellerId ? (
                                <Link href={`/users/${purchase.sellerId}`} className="hover:underline text-primary">
                                  {purchase.sellerName || "---"}
                                </Link>
                              ) : (
                                <span>{purchase.sellerName || "---"}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* ページネーション */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                    <div className="text-sm text-muted-foreground">
                      {purchaseHistory.length > 0 && (
                        <span>
                          {historyStart + 1} - {historyEnd} 件 / 全 {purchaseHistory.length} 件
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={safeHistoryPage === 1}
                        aria-label="前のページへ"
                      >
                        前へ
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalHistoryPages }).map((_, i) => {
                          const page = i + 1
                          return (
                            <Button
                              key={page}
                              variant={page === safeHistoryPage ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setHistoryPage(page)}
                              aria-current={page === safeHistoryPage ? "page" : undefined}
                              aria-label={`ページ ${page}`}
                            >
                              {page}
                            </Button>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                        disabled={safeHistoryPage === totalHistoryPages}
                        aria-label="次のページへ"
                      >
                        次へ
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">購入履歴はありません</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="likes" className="mt-6">
              {likesLoading ? (
                <div className="text-center py-12">読み込み中...</div>
              ) : (likedProducts.length > 0 || likedAuctions.length > 0) ? (
                <Tabs defaultValue="products" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="products">
                      フリマ ({likedProducts.length})
                    </TabsTrigger>
                    <TabsTrigger value="auctions">
                      オークション ({likedAuctions.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="products">
                    {likedProducts.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {likedProducts.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.id}`}
                            style={{ display: "block", height: "100%" }}
                          >
                            <ProductCard product={product} />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">いいねしたフリマ商品はありません</p>
                        <Button asChild>
                          <Link href="/">フリマ商品を探す</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="auctions">
                    {likedAuctions.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {likedAuctions.map((auction) => (
                          <Link
                            key={auction.id}
                            href={`/auctions/${auction.id}`}
                            style={{ display: "block", height: "100%" }}
                          >
                            <AuctionCard auction={auction} />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">いいねしたオークション商品はありません</p>
                        <Button asChild>
                          <Link href="/auctions">オークション商品を探す</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">まだいいねした商品がありません</p>
                  <Button asChild>
                    <Link href="/">商品を探す</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              {evaluationsLoading ? (
                <div className="text-center py-12">評価を読み込み中...</div>
              ) : evaluationsError ? (
                <div className="text-center py-12 text-red-500">{evaluationsError}</div>
              ) : evaluations.length > 0 ? (
                <div className="space-y-4">
                  {evaluations.map((evaluation) => (
                    <Card key={evaluation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={evaluation.userimageURL} />
                            <AvatarFallback>{evaluation.user[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{evaluation.user}</span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: evaluation.score }).map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                                {Array.from({ length: 5 - evaluation.score }).map((_, i) => (
                                  <Star key={i} className="h-4 w-4 text-gray-300" />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">({evaluation.score}/5)</span>
                            </div>
                            {evaluation.content && (
                              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                                {evaluation.content}
                              </p>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleDateString("ja-JP") : ""}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">まだ評価がありません</p>
                  <p className="text-sm text-muted-foreground">
                    取引を完了すると、相手から評価を受けることができます
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      </div>
    </ProtectedRoute>
  )
}