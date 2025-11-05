"use client"

import { Header } from "@/components/header"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
import { useProducts } from "@/hooks/useProducts"
import { useState } from "react"
import Link from "next/link"
import { TopSellers } from "@/components/top-sellers"

export default function HomePage() {
  const { products, loading, error } = useProducts()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = products.filter(product =>
    product.productname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="フリマ商品を検索..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                学内で不要なものを売買しよう
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                学生同士で安心・安全に取引できるマーケットプレイス
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/20 px-3 py-1.5 rounded-full text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-orange-700 dark:text-orange-300 font-medium">学内限定</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 dark:text-green-300 font-medium">安心取引</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 px-3 py-1.5 rounded-full text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">簡単出品</span>
                </div>
              </div>
            </div>
          </div>
          
          {!loading && !error && (
            <div className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg inline-block">
              {searchTerm ? (
                <p>「{searchTerm}」の検索結果: <span className="font-semibold text-primary">{filteredProducts.length}件</span></p>
              ) : (
                <p>全<span className="font-semibold text-primary">{products.length}件</span>の商品が出品中</p>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              商品を読み込み中...
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <h3 className="text-red-800 font-semibold mb-2">エラーが発生しました</h3>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                ページを再読み込み
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <h2 className="text-xl font-semibold mb-4">
                    {searchTerm ? "検索結果が見つかりませんでした" : "商品がまだありません"}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm ? 
                      "別のキーワードで検索してみてください" : 
                      "最初の商品を出品してマーケットを盛り上げましょう！"
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {searchTerm && (
                      <Button variant="outline" onClick={() => setSearchTerm("")}>
                        検索をクリア
                      </Button>
                    )}
                    <Button asChild>
                      <Link href="/sell">
                        <Plus className="w-4 h-4 mr-2" />
                        商品を出品する
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="group cursor-pointer">
                    <Link href={`/products/${product.id}`}>
                      <div className="transform transition-transform group-hover:scale-105">
                        <ProductCard product={product} />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 売上ランキング */}
        <div className="mt-12">
          <TopSellers />
        </div>
      </main>
    </div>
  )
}