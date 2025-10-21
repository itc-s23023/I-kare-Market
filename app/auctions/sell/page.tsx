"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, X } from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function AuctionSellPage() {
  const [images, setImages] = useState<string[]>([])
  const [endDate, setEndDate] = useState<Date>()
  const [enableBuyNow, setEnableBuyNow] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file))
      setImages([...images, ...newImages].slice(0, 5))
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">オークションに出品</h1>
            <p className="text-muted-foreground">商品情報を入力してオークションを開始しましょう</p>
          </div>

          <form className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>商品画像</CardTitle>
                <CardDescription>最大5枚まで画像をアップロードできます</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
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
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer flex items-center justify-center">
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">画像追加</span>
                      </div>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">商品名</Label>
                  <Input id="title" placeholder="例: iPad Air 第5世代 64GB" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">商品の状態</Label>
                  <Select>
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="状態を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">新品・未使用</SelectItem>
                      <SelectItem value="like-new">未使用に近い</SelectItem>
                      <SelectItem value="good">目立った傷や汚れなし</SelectItem>
                      <SelectItem value="fair">やや傷や汚れあり</SelectItem>
                      <SelectItem value="poor">傷や汚れあり</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">商品説明</Label>
                  <Textarea
                    id="description"
                    placeholder="商品の詳細、使用状況、付属品などを記載してください"
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>オークション設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="starting-price">開始価格</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                    <Input id="starting-price" type="number" placeholder="1000" className="pl-8" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">終了日時</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="end-date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: ja }) : "日付を選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="buy-now">即決価格を設定</Label>
                    <p className="text-sm text-muted-foreground">この価格で即座に落札できるようにします</p>
                  </div>
                  <Switch id="buy-now" checked={enableBuyNow} onCheckedChange={setEnableBuyNow} />
                </div>

                {enableBuyNow && (
                  <div className="space-y-2">
                    <Label htmlFor="buy-now-price">即決価格</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                      <Input id="buy-now-price" type="number" placeholder="5000" className="pl-8" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1 bg-transparent">
                キャンセル
              </Button>
              <Button type="submit" className="flex-1">
                オークションを開始
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
