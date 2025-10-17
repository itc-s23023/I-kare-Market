import { Header } from "@/components/header"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { mockProducts } from "@/lib/mock-data"

export default function HomePage() {
  const categories = ["すべて", "教科書", "電子機器", "文房具", "生活用品", "その他"]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="border-b bg-muted/30">
        <div className="container px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="フリマ商品を検索..." className="pl-10" />
            </div>
          </div>
        </div>
      </div>

      <main className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-balance">学内で不要なものを売買しよう</h1>
          <p className="text-muted-foreground text-balance">学生同士で安心・安全に取引できるマーケットプレイス</p>
        </div>

        <div className="mb-6 overflow-x-auto">
          <Tabs defaultValue="すべて" className="w-full">
            <TabsList className="inline-flex w-auto">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {mockProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">商品が見つかりませんでした</p>
            <Button asChild>
              <a href="/sell">最初の商品を出品する</a>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
