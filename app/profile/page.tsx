"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Package, ShoppingBag, Calendar, Heart } from "lucide-react"
import { mockUser } from "@/lib/mock-data"
import { ProductCard } from "@/components/product-card"
import { AuctionCard } from "@/components/auction-card"
import Link from "next/link"

import { useProducts } from "@/hooks/useProducts"
import { usePurchaseHistory } from "@/hooks/usePurchase_history"
import { useLikes } from "@/hooks/uselike"
import { useAuctions } from "@/hooks/useAuctions"
import { useAuth } from "@/components/auth-provider"
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

  // ユーザーが出品したオークション商品をフィルタリング（アクティブなもののみ）
  const userAuctions = allAuctions.filter((auction) => 
    auction.sellerId === user?.uid && auction.status === "active"
  )

  const profile = {
    name: user?.displayName || mockUser.name,
    avatar: (user as any)?.photoURL || mockUser.avatar || "/placeholder.svg",
    rating: mockUser.rating,
    reviewCount: mockUser.reviewCount,
    joinedDate: mockUser.joinedDate,
  }

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
                <ShoppingBag className="h-4 w-4 mr-2" />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userProducts.map((product: any) => (
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userAuctions.map((auction) => (
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
                      {purchaseHistory.map((purchase: any, idx: number, arr: any[]) => (
                        <tr
                          key={purchase.id}
                          className={`transition-colors hover:bg-accent/60 ${idx === arr.length - 1 ? 'last:rounded-b-xl' : ''}`}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="space-y-4">
                {[
                  {
                    id: "1",
                    reviewer: "佐藤花子",
                    rating: 5,
                    comment: "迅速な対応ありがとうございました！商品も綺麗でした。",
                    date: "2024-01-10",
                  },
                  {
                    id: "2",
                    reviewer: "鈴木一郎",
                    rating: 4,
                    comment: "良い取引でした。また機会があればよろしくお願いします。",
                    date: "2024-01-05",
                  },
                ].map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src="/reviewer-avatar.png" />
                          <AvatarFallback>{review.reviewer[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{review.reviewer}</span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{review.comment}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.date).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      </div>
    </ProtectedRoute>
  )
}