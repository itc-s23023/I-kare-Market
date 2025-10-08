import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import type { Product } from "@/lib/mock-data"

interface ProductCardProps {
  product: Product
}

const conditionLabels = {
  new: "新品",
  "like-new": "未使用に近い",
  good: "良好",
  fair: "可",
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square relative overflow-hidden bg-muted">
          <Image src={product.images[0] || "/placeholder.svg"} alt={product.title} fill className="object-cover" />
          {product.status === "sold" && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="secondary" className="text-lg">
                売却済み
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-base line-clamp-2 leading-snug">{product.title}</h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {conditionLabels[product.condition]}
            </Badge>
          </div>
          <p className="text-2xl font-bold text-primary">¥{product.price.toLocaleString()}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{product.sellerName}</span>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{product.sellerRating}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
