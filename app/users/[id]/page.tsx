"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Package, ShoppingBag, Calendar } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/components/firebaseConfig"

interface UserProfile {
  id: string
  name: string
  email: string
  joinedDate: string
  avatar?: string
}

interface Product {
  id: string
  productname: string
  image_url: string
  price: number
  status: string
  condition?: string
  createdAt: string
}

const conditionLabels = {
  new: "新品",
  "like-new": "未使用に近い",
  good: "良好",
  fair: "可",
}

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id as string
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userProducts, setUserProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchUserData = async () => {
      try {
        // ユーザーの商品を取得してユーザー情報も取得
        const productsQuery = query(
          collection(db, "products"),
          where("userid", "==", userId)
        )
        const productsSnapshot = await getDocs(productsQuery)
        
        const products: Product[] = []
        let userName = "匿名ユーザー"
        let userEmail = ""
        let earliestDate = new Date().toISOString()
        
        productsSnapshot.forEach((doc) => {
          const data = doc.data()
          
          // 最初の商品からユーザー情報を取得
          if (products.length === 0) {
            userName = String(data.sellerName || "匿名ユーザー")
            userEmail = String(data.sellerEmail || "")
          }
          
          // 最も古い出品日を取得
          if (data.createdAt && data.createdAt < earliestDate) {
            earliestDate = data.createdAt
          }
          
          products.push({
            id: doc.id,
            productname: String(data.productname || "商品名なし"),
            image_url: String(data.image_url || "/placeholder.svg"),
            price: Number(data.price) || 0,
            status: String(data.status || "active"),
            condition: data.condition ? String(data.condition) : undefined,
            createdAt: String(data.createdAt || new Date().toISOString())
          })
        })

        // 作成日時でソート（新しい順）
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        const profile: UserProfile = {
          id: userId,
          name: userName,
          email: userEmail,
          joinedDate: earliestDate,
          avatar: undefined
        }

        setUserProfile(profile)
        setUserProducts(products)
      } catch (error: any) {
        console.error("❌ ユーザー情報取得エラー:", error)
        setError(`ユーザー情報の取得に失敗しました`)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8 max-w-6xl mx-auto">
          <div className="text-center py-16">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              ユーザー情報を読み込み中...
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8 max-w-6xl mx-auto">
          <div className="text-center py-16">
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <h3 className="text-red-800 font-semibold mb-2">エラーが発生しました</h3>
              <p className="text-red-600 text-sm mb-4">{error || "ユーザーが見つかりません"}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const activeProducts = userProducts.filter(p => p.status === "active")
  const soldProducts = userProducts.filter(p => p.status === "sold")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8 max-w-6xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">{userProfile.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{userProfile.name}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">登録日: {new Date(userProfile.joinedDate).toLocaleDateString("ja-JP")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold">{soldProducts.length}</p>
                      <p className="text-xs text-muted-foreground">売却済み</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950 px-4 py-2 rounded-lg">
                    <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-2xl font-bold">{activeProducts.length}</p>
                      <p className="text-xs text-muted-foreground">販売中</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {activeProducts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                販売中の商品 ({activeProducts.length}件)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-square relative bg-muted">
                        <Image
                          src={product.image_url}
                          alt={product.productname}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2 text-balance">{product.productname}</h3>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold text-primary">¥{product.price.toLocaleString()}</p>
                          {product.condition && (
                            <Badge variant="secondary" className="text-xs">
                              {conditionLabels[product.condition as keyof typeof conditionLabels] || product.condition}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {soldProducts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                売却済みの商品 ({soldProducts.length}件)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {soldProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer opacity-60">
                      <div className="aspect-square relative bg-muted">
                        <Image
                          src={product.image_url}
                          alt={product.productname}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                        <Badge className="absolute top-2 right-2 bg-gray-600">売却済み</Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2 text-balance">{product.productname}</h3>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold text-muted-foreground">¥{product.price.toLocaleString()}</p>
                          {product.condition && (
                            <Badge variant="outline" className="text-xs">
                              {conditionLabels[product.condition as keyof typeof conditionLabels] || product.condition}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {userProducts.length === 0 && (
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
