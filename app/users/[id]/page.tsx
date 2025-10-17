import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Package, ShoppingBag, Calendar } from "lucide-react"
import { mockUsers, mockProducts, mockAuctions, userTransactionCounts } from "@/lib/mock-data"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

const conditionLabels = {
  new: "新品",
  "like-new": "未使用に近い",
  good: "良好",
  fair: "可",
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const user = mockUsers.find((u) => u.id === params.id)

  if (!user) {
    notFound()
  }

  // ユーザーの出品中の商品を取得
  const userProducts = mockProducts.filter((p) => p.sellerId === params.id && p.status === "available")

  // ユーザーの出品中のオークションを取得
  const userAuctions = mockAuctions.filter((a) => a.sellerId === params.id && a.status === "active")

  const transactionCount = userTransactionCounts[params.id] || 0

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8 max-w-6xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">登録日: {new Date(user.joinedDate).toLocaleDateString("ja-JP")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950 px-4 py-2 rounded-lg">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <div>
                      <p className="text-2xl font-bold">{user.rating}</p>
                      <p className="text-xs text-muted-foreground">{user.reviewCount}件の評価</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold">{transactionCount}</p>
                      <p className="text-xs text-muted-foreground">取引完了数</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950 px-4 py-2 rounded-lg">
                    <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-2xl font-bold">{userProducts.length + userAuctions.length}</p>
                      <p className="text-xs text-muted-foreground">出品中</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {userProducts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                出品中の商品（フリマ）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-square relative bg-muted">
                        <Image
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2 text-balance">{product.title}</h3>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold text-primary">¥{product.price.toLocaleString()}</p>
                          <Badge variant="secondary" className="text-xs">
                            {conditionLabels[product.condition]}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {userAuctions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                出品中の商品（オークション）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userAuctions.map((auction) => (
                  <Link key={auction.id} href={`/auctions/${auction.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-square relative bg-muted">
                        <Image
                          src={auction.images[0] || "/placeholder.svg"}
                          alt={auction.title}
                          fill
                          className="object-cover"
                        />
                        <Badge className="absolute top-2 right-2 bg-red-600">オークション</Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2 text-balance">{auction.title}</h3>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">現在価格</span>
                            <p className="text-xl font-bold text-primary">¥{auction.currentBid.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{auction.bidCount}件の入札</span>
                            <Badge variant="secondary" className="text-xs">
                              {conditionLabels[auction.condition]}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {userProducts.length === 0 && userAuctions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">現在出品中の商品はありません</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
