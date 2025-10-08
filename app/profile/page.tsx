import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Package, ShoppingBag, Calendar } from "lucide-react"
import { mockUser, mockProducts } from "@/lib/mock-data"
import { ProductCard } from "@/components/product-card"

export default function ProfilePage() {
  const userProducts = mockProducts.filter((p) => p.sellerId === "user1")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={mockUser.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{mockUser.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold mb-2">{mockUser.name}</h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{mockUser.rating}</span>
                      <span className="text-muted-foreground">({mockUser.reviewCount}件)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        登録日: {new Date(mockUser.joinedDate).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </div>
                  <Button>プロフィールを編集</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="selling" className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="selling">
                <Package className="h-4 w-4 mr-2" />
                出品中
              </TabsTrigger>
              <TabsTrigger value="buying">
                <ShoppingBag className="h-4 w-4 mr-2" />
                購入履歴
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="h-4 w-4 mr-2" />
                評価
              </TabsTrigger>
            </TabsList>

            <TabsContent value="selling" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {userProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">出品中の商品はありません</p>
                  <Button>商品を出品する</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="buying" className="mt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground">購入履歴はありません</p>
              </div>
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
  )
}
