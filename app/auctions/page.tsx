"use client"

import { Header } from "@/components/header"
import { AuctionCard } from "@/components/auction-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Gavel, Plus } from "lucide-react"
import { useAuctions, useAuctionManagement } from "@/hooks/useAuctions"
import { TopSellers } from "@/components/top-sellers"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function AuctionsPage() {
  const { auctions, loading, error } = useAuctions()
  const { closeExpiredAuction } = useAuctionManagement()
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all')
  const [visibleCount, setVisibleCount] = useState(8)

  // 期間切れオークションの自動終了チェック
  useEffect(() => {
    if (!auctions.length) return

    const checkExpiredAuctions = async () => {
      const now = new Date()
      
      for (const auction of auctions) {
        if (auction.status === 'active' && new Date(auction.endTime) <= now) {
          try {
            console.log(`期間切れオークションを終了: ${auction.id}`)
            await closeExpiredAuction(auction.id)
          } catch (error) {
            console.error(`オークション${auction.id}の終了処理でエラー:`, error)
          }
        }
      }
    }

    checkExpiredAuctions()
  }, [auctions, closeExpiredAuction])

  // 検索フィルター
  const filteredAuctions = auctions.filter(auction =>
    auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    auction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (auction.category?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  const activeAuctions = filteredAuctions.filter((a) => a.status === "active")
  const endingSoonAuctions = activeAuctions
    .filter((a) => {
      const timeLeft = new Date(a.endTime).getTime() - new Date().getTime()
      return timeLeft < 24 * 60 * 60 * 1000 // 24時間以内
    })
    .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())

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
                placeholder="オークション商品を検索..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Gavel className="h-8 w-8 text-primary" />
                オークション
              </h1>
              <p className="text-muted-foreground">入札して欲しい商品を手に入れよう</p>
              {!loading && !error && (
                <div className="text-sm text-muted-foreground mt-2">
                  {searchTerm ? (
                    <p>「{searchTerm}」の検索結果: {filteredAuctions.length}件</p>
                  ) : (
                    <p>全{auctions.length}件のオークション</p>
                  )}
                </div>
              )}
            </div>
            <Button asChild className="shrink-0">
              <Link href="/auctions/sell">
                <Plus className="w-4 h-4 mr-2" />
                オークション出品
              </Link>
            </Button>
          </div>

          {loading && (
            <div className="text-center py-16">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                オークションを読み込み中...
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
            <Tabs defaultValue="all" className="mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="all">すべて</TabsTrigger>
                <TabsTrigger value="ending">まもなく終了</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {activeAuctions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <h2 className="text-xl font-semibold mb-4">
                        {searchTerm ? "検索結果が見つかりませんでした" : "オークションがまだありません"}
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        {searchTerm ? 
                          "別のキーワードで検索してみてください" : 
                          "最初のオークションを出品してみましょう！"
                        }
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {searchTerm && (
                          <Button 
                            variant="outline" 
                            onClick={() => setSearchTerm("")}
                          >
                            検索をクリア
                          </Button>
                        )}
                        <Button asChild>
                          <Link href="/auctions/sell">
                            <Plus className="w-4 h-4 mr-2" />
                            オークション出品
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {activeAuctions.slice(0, visibleCount).map((auction) => (
                        <div key={auction.id} className="group cursor-pointer">
                          <Link href={`/auctions/${auction.id}`}>
                            <div className="transform transition-transform group-hover:scale-105">
                              <AuctionCard auction={auction} />
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                    {activeAuctions.length > visibleCount && (
                      <div className="text-center mt-8">
                        <Button onClick={() => setVisibleCount(visibleCount + 8)}>
                          もっと見る
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="ending" className="mt-6">
                {endingSoonAuctions.length === 0 ? (
                  <div className="text-center py-16">
                    <h2 className="text-xl font-semibold mb-4">まもなく終了するオークションはありません</h2>
                    <p className="text-muted-foreground">現在アクティブなオークションを確認してみてください。</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {endingSoonAuctions.slice(0, visibleCount).map((auction) => (
                        <div key={auction.id} className="group cursor-pointer">
                          <Link href={`/auctions/${auction.id}`}>
                            <div className="transform transition-transform group-hover:scale-105">
                              <AuctionCard auction={auction} />
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                    {endingSoonAuctions.length > visibleCount && (
                      <div className="text-center mt-8">
                        <Button onClick={() => setVisibleCount(visibleCount + 8)}>
                          もっと見る
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
        {/* 売上ランキング */}
        <div className="mt-12">
          <TopSellers />
        </div>
      </main>
    </div>
  )
}
