"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"

interface SellerRanking {
  userId: string
  name: string
  avatar: string
  rating: number
  transactions: number
  totalSales: number
}

// スケルトンアイテムコンポーネント
function SkeletonItem({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg">
      {/* ランキング番号 */}
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
        <span className="text-lg font-bold text-muted-foreground">
          {index + 1}
        </span>
      </div>

      {/* アバター */}
      <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />

      {/* ユーザー情報 */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        <div className="h-3 w-32 bg-muted rounded animate-pulse" />
      </div>

      {/* 総売上 */}
      <div className="flex-shrink-0 text-right space-y-2">
        <div className="h-3 w-12 bg-muted rounded animate-pulse ml-auto" />
        <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
      </div>
    </div>
  )
}

export function TopSellers() {
  const [topSellers, setTopSellers] = useState<SellerRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopSellers = async () => {
      try {
        setLoading(true)
        setError(null)

        // Firestoreからユーザーデータを取得（Salesでソート、上位5件）
        const usersRef = collection(db, "users")
        const q = query(usersRef, orderBy("Sales", "desc"), limit(5))
        const querySnapshot = await getDocs(q)

        const sellers: SellerRanking[] = querySnapshot.docs.map((doc) => {
          const data = doc.data()

          return {
            userId: doc.id,
            name: data.username || "匿名ユーザー",
            avatar: data.avatar || "",
            rating: data.evalution || 0,
            transactions: data.transactions || 0,
            totalSales: data.Sales || 0,
          }
        })

        setTopSellers(sellers)
      } catch (err) {
        console.error("❌ 売上ランキング取得エラー:", err)
        setError("ランキングデータの取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchTopSellers()
  }, [])

  // スケルトンを含めた表示用配列を作成（5件に満たない場合は埋める）
  const displayItems = [...topSellers]
  const skeletonCount = Math.max(0, 5 - topSellers.length)
  
  if (!loading && topSellers.length < 5) {
    for (let i = 0; i < skeletonCount; i++) {
      displayItems.push({
        userId: `skeleton-${i}`,
        name: "",
        avatar: "",
        rating: 0,
        transactions: 0,
        totalSales: 0,
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          売上ランキング TOP5
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((index) => (
              <SkeletonItem key={index} index={index} />
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {displayItems.map((seller, index) => {
              // スケルトン表示
              if (seller.userId.startsWith("skeleton-")) {
                return <SkeletonItem key={seller.userId} index={index} />
              }

              // 実データ表示
              return (
                <Link
                  key={seller.userId}
                  href={`/users/${seller.userId}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  {/* ランキング番号 */}
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    <span
                      className={`text-lg font-bold ${
                        index === 0
                          ? "text-yellow-500"
                          : index === 1
                          ? "text-gray-400"
                          : index === 2
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </div>

                  {/* アバター */}
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage src={seller.avatar} alt={seller.name} />
                    <AvatarFallback>{seller.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>

                  {/* ユーザー情報 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{seller.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span>{seller.rating > 0 ? seller.rating.toFixed(1) : "未評価"}</span>
                      </div>
                      <div>
                        <span>{seller.transactions}件の取引</span>
                      </div>
                    </div>
                  </div>

                  {/* 総売上 */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm text-muted-foreground">総売上</p>
                    <p className="font-bold text-primary">
                      ¥{seller.totalSales.toLocaleString()}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
