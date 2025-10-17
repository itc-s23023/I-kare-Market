import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react"
import Link from "next/link"
import { mockAuctions } from "@/lib/mock-data"
import { notFound } from "next/navigation"

export default function EditAuctionPage({ params }: { params: { id: string } }) {
  const auction = mockAuctions.find((a) => a.id === params.id)

  if (!auction) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">オークションを編集</h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>オークション情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">商品名</Label>
                <Input id="title" defaultValue={auction.title} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startingPrice">開始価格（円）</Label>
                  <Input id="startingPrice" type="number" defaultValue={auction.startingPrice} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentBid">現在価格（円）</Label>
                  <Input id="currentBid" type="number" defaultValue={auction.currentBid} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">カテゴリー</Label>
                <Select defaultValue={auction.category}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="教科書">教科書</SelectItem>
                    <SelectItem value="電子機器">電子機器</SelectItem>
                    <SelectItem value="文房具">文房具</SelectItem>
                    <SelectItem value="衣類">衣類</SelectItem>
                    <SelectItem value="その他">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">商品の状態</Label>
                <Select defaultValue={auction.condition}>
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="新品・未使用">新品・未使用</SelectItem>
                    <SelectItem value="未使用に近い">未使用に近い</SelectItem>
                    <SelectItem value="目立った傷や汚れなし">目立った傷や汚れなし</SelectItem>
                    <SelectItem value="やや傷や汚れあり">やや傷や汚れあり</SelectItem>
                    <SelectItem value="傷や汚れあり">傷や汚れあり</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">終了日時</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  defaultValue={new Date(auction.endTime).toISOString().slice(0, 16)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="buyNow">即決価格を設定</Label>
                  <p className="text-sm text-muted-foreground">この価格で即座に落札できます</p>
                </div>
                <Switch id="buyNow" defaultChecked={!!auction.buyNowPrice} />
              </div>

              {auction.buyNowPrice && (
                <div className="space-y-2">
                  <Label htmlFor="buyNowPrice">即決価格（円）</Label>
                  <Input id="buyNowPrice" type="number" defaultValue={auction.buyNowPrice} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">商品の説明</Label>
                <Textarea id="description" rows={6} defaultValue={auction.description} />
              </div>

              <div className="space-y-2">
                <Label>商品画像</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <img
                    src={auction.image || "/placeholder.svg"}
                    alt={auction.title}
                    className="w-full h-48 object-cover rounded-lg mb-2"
                  />
                  <Button variant="outline" className="w-full bg-transparent">
                    画像を変更
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">入札数</span>
                  <span className="font-semibold">{auction.bidCount}件</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ステータス</span>
                  <span className="font-semibold">{auction.status === "active" ? "進行中" : "終了"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1">変更を保存</Button>
            <Button variant="outline" className="flex-1 bg-transparent" asChild>
              <Link href={`/auctions/${auction.id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                オークションページを見る
              </Link>
            </Button>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
