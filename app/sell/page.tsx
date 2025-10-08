"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SellPage() {
  const router = useRouter()
  const [images, setImages] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/")
  }

  const handleImageUpload = () => {
    setImages([...images, "/modern-tech-product.png"])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">商品を出品する</h1>
          <p className="text-muted-foreground mb-8">不要になった教科書や物品を出品しましょう</p>

          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>商品画像</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`商品画像 ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-2 transition-colors"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">画像を追加</span>
                    </button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">最大5枚まで画像をアップロードできます</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>商品情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">商品名</Label>
                  <Input id="title" placeholder="例: 微積分の教科書（第3版）" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">価格（円）</Label>
                  <Input id="price" type="number" placeholder="2500" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">カテゴリー</Label>
                  <Select required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="カテゴリーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="textbook">教科書</SelectItem>
                      <SelectItem value="electronics">電子機器</SelectItem>
                      <SelectItem value="stationery">文房具</SelectItem>
                      <SelectItem value="daily">生活用品</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">商品の状態</Label>
                  <Select required>
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="状態を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">新品</SelectItem>
                      <SelectItem value="like-new">未使用に近い</SelectItem>
                      <SelectItem value="good">良好</SelectItem>
                      <SelectItem value="fair">可</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">商品の説明</Label>
                  <Textarea id="description" placeholder="商品の詳細な説明を入力してください" rows={5} required />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                キャンセル
              </Button>
              <Button type="submit" className="flex-1">
                出品する
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
