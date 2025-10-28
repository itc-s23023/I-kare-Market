"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, TrendingUp } from "lucide-react"
import { mockUsers, userTotalSales, userTransactionCounts } from "@/lib/mock-data"

interface SellerRanking {
  userId: string
  name: string
  avatar: string
  rating: number
  transactions: number
  totalSales: number
}

export function TopSellers() {
  // 総売上でソートして上位5人を取得
  const topSellers: SellerRanking[] = mockUsers
    .map((user) => ({
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      rating: user.rating,
      transactions: userTransactionCounts[user.id] || 0,
      totalSales: userTotalSales[user.id] || 0,
    }))
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          売上ランキング TOP5
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topSellers.map((seller, index) => (
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
                    <span>{seller.rating.toFixed(1)}</span>
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
