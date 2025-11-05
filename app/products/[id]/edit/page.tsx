"use client"

import { use } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react"
import Link from "next/link"
import { mockProducts } from "@/lib/mock-data"
import { notFound } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const product = mockProducts.find((p) => p.id === id)

  if (!product) {
    notFound()
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">商品を編集</h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>商品情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">商品名</Label>
                <Input id="title" defaultValue={product.title} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">価格（円）</Label>
                <Input id="price" type="number" defaultValue={product.price} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">商品の状態</Label>
                <Select defaultValue={product.condition}>
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
                <Label htmlFor="description">商品の説明</Label>
                <Textarea id="description" rows={6} defaultValue={product.description} />
              </div>

              <div className="space-y-2">
                <Label>商品画像</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <img
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-48 object-cover rounded-lg mb-2"
                  />
                  <Button variant="outline" className="w-full bg-transparent">
                    画像を変更
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1">変更を保存</Button>
            <Button variant="outline" className="flex-1 bg-transparent" asChild>
              <Link href={`/products/${product.id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                商品ページを見る
              </Link>
            </Button>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
      </div>
    </ProtectedRoute>
  )
}
