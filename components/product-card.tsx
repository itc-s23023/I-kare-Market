"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Heart } from "lucide-react"
import type { Product } from "@/lib/mock-data"
import { mockLikedProducts } from "@/lib/mock-data"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/components/firebaseConfig"

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
  const [isLiked, setIsLiked] = useState(mockLikedProducts.includes(product.id))
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"))
        const usersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        setUsers(usersData)
      } catch (error) {
        console.error("ユーザーデータの取得に失敗しました:", error)
      }
    }

    fetchUsers()
  }, [])

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLiked(!isLiked)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="aspect-square relative overflow-hidden bg-muted">
        <Image src={product.images[0] || "/placeholder.svg"} alt={product.title} fill className="object-cover" />
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-3 right-3 h-9 w-9 rounded-full shadow-md"
          onClick={handleLikeClick}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
        </Button>
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
        <p className="text-2xl font-bold text-primary mt-auto">¥{product.price.toLocaleString()}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="truncate">{product.sellerName}</span>
        <div className="flex items-center gap-1 shrink-0">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span>{product.sellerRating}</span>
        </div>
      </CardFooter>
      
      {/* ユーザー情報の表示 */}
      <div className="p-4 pt-0">
        <h3 className="text-sm font-semibold mb-2">登録ユーザー ({users.length}人):</h3>
        {users.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {users.map((user, index) => (
              <div key={user.id} className="text-xs bg-gray-50 p-2 rounded border">
                <div className="font-medium">ユーザー {index + 1}</div>
                <div>ID: {user.id}</div>
                {user.name && <div>名前: {user.name}</div>}
                {user.email && <div>メール: {user.email}</div>}
                {user.displayName && <div>表示名: {user.displayName}</div>}
                {user.createdAt && <div>登録日: {user.createdAt}</div>}
                {/* その他のフィールドも表示 */}
                {Object.keys(user).filter(key => !['id', 'name', 'email', 'displayName', 'createdAt'].includes(key)).map(key => (
                  <div key={key}>{key}: {String(user[key])}</div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">ユーザーデータを読み込み中...</p>
        )}
        
        {/* デバッグ用：生データの表示 */}
        <details className="mt-2">
          <summary className="text-xs cursor-pointer text-blue-600">生データを表示</summary>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-20">
            {JSON.stringify(users, null, 2)}
          </pre>
        </details>
      </div>
    </Card>
  )
}
