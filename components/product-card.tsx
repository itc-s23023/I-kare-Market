"use client"

import type React from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useLikes } from "@/hooks/uselike"

import type { Product } from "@/hooks/useProducts"

interface ProductCardProps {
  product: Product
  showActions?: boolean
}

const conditionLabels = {
  new: "新品",
  "like-new": "未使用に近い",
  good: "良好",
  fair: "可",
} as const

export function ProductCard({ product, showActions = false }: ProductCardProps) {
  const { isLiked, toggleLike } = useLikes()

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (product.id) {
      toggleLike(product.id)
    }
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }


  const getConditionLabel = (condition?: string) => {
    if (!condition) return "状態不明"
    return conditionLabels[condition as keyof typeof conditionLabels] || condition
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="aspect-square relative overflow-hidden bg-muted">
        <Image 
          src={product.image_url || "/placeholder.svg"} 
          alt={product.productname || "商品画像"} 
          fill 
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.svg";
          }}
        />
        
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-3 right-3 h-9 w-9 rounded-full shadow-md"
          onClick={handleLikeClick}
        >
          <Heart className={`h-5 w-5 ${product.id && isLiked(product.id) ? "fill-red-500 text-red-500" : ""}`} />
        </Button>

        {/* 交渉可能バッジ */}
        {product.is_trading && (
          <Badge className="absolute top-3 left-3 bg-blue-500 text-white">
            交渉可
          </Badge>
        )}

        {/* 売却済み表示（将来のために残す） */}
        {product.status === "sold" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-lg">
              売却済み
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-base line-clamp-2 leading-snug">
            {product.productname || "商品名なし"}
          </h3>
        </div>

        {/* カテゴリーと商品状態 */}
        <div className="flex items-center gap-2 mb-2">
          {product.category && (
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
          )}
          {product.condition && (
            <Badge variant="outline" className="text-xs">
              {getConditionLabel(product.condition)}
            </Badge>
          )}
        </div>

        {/* 商品説明（短縮版） */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.content || "説明なし"}
        </p>

        {/* 価格 */}
        <p className="text-2xl font-bold text-primary mt-auto">
          {formatPrice(product.price || 0)}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex flex-col gap-1">
          <span className="truncate font-medium">
            出品者: {product.sellerName || "匿名ユーザー"}
          </span>
          <span className="text-xs">
            {formatDate(product.createdAt)}
          </span>
        </div>
        
        {showActions && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              編集
            </Button>
            <Button variant="destructive" size="sm">
              削除
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}