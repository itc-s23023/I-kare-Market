"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MessageCircle, Calendar, Heart } from "lucide-react"
import { mockProducts, mockLikedProducts } from "@/lib/mock-data"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

const conditionLabels = {
  new: "新品",
  "like-new": "未使用に近い",
  good: "良好",
  fair: "可",
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const product = mockProducts.find((p) => p.id === params.id)
  const [isLiked, setIsLiked] = useState(mockLikedProducts.includes(params.id))

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
              <Image src={product.images[0] || "/placeholder.svg"} alt={product.title} fill className="object-cover" />
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
                <h1 className="text-3xl font-bold text-balance leading-tight">{product.title}</h1>
                {product.status === "sold" && (
                  <Badge variant="secondary" className="shrink-0">
                    売却済み
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{product.category}</Badge>
                <Badge variant="secondary">{conditionLabels[product.condition]}</Badge>
              </div>
              <p className="text-4xl font-bold text-primary mb-4">¥{product.price.toLocaleString()}</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-3">商品の説明</h2>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">出品者情報</h2>
                <Link
                  href={`/users/${product.sellerId}`}
                  className="block hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="/diverse-user-avatars.png" />
                      <AvatarFallback>{product.sellerName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold hover:underline">{product.sellerName}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{product.sellerRating}</span>
                        <span className="ml-2">(15件の評価)</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>出品日: {new Date(product.createdAt).toLocaleDateString("ja-JP")}</span>
            </div>

            {product.status === "available" ? (
              <Button asChild size="lg" className="w-full">
                <Link href={`/chat/${product.id}`}>
                  <MessageCircle className="h-5 w-5 mr-2" />
                  購入について相談する
                </Link>
              </Button>
            ) : (
              <Button size="lg" className="w-full" disabled>
                売却済み
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
