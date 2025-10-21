import { Header } from "@/components/header"
import { AuctionCard } from "@/components/auction-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { mockAuctions } from "@/lib/mock-data"
import { Gavel } from "lucide-react"
import Link from "next/link"

export default function AuctionsPage() {
  const activeAuctions = mockAuctions.filter((a) => a.status === "active")
  const endingSoonAuctions = activeAuctions
    .filter((a) => {
      const timeLeft = new Date(a.endTime).getTime() - new Date().getTime()
      return timeLeft < 24 * 60 * 60 * 1000 // 24時間以内
    })
    .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div>
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="オークション商品を検索..." className="pl-10" />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Gavel className="h-8 w-8 text-primary" />
                オークション
              </h1>
              <p className="text-muted-foreground">入札して欲しい商品を手に入れよう</p>
            </div>
            <Button size="lg" asChild>
              <Link href="/auctions/sell">オークションに出品</Link>
            </Button>
          </div>

          <Tabs defaultValue="all" className="mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="ending">まもなく終了</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ending" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {endingSoonAuctions.length > 0 ? (
                  endingSoonAuctions.map((auction) => <AuctionCard key={auction.id} auction={auction} />)
                ) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    まもなく終了するオークションはありません
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
