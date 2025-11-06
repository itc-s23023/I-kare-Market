"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductFormProps {
  onSubmit: (data: {
    productname: string
    content: string
    price: number
    is_trading: boolean
    condition: string
  }) => void
  isSubmitting: boolean
}

export function ProductForm({ onSubmit, isSubmitting }: ProductFormProps) {
  const [productname, setProductname] = useState("")
  const [content, setContent] = useState("")
  const [price, setPrice] = useState("")
  const [is_trading, setIsTrading] = useState(false)
  const [condition, setCondition] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!productname || !content || !price ||  !condition) {
      alert("必須項目を入力してください")
      return
    }

    onSubmit({
      productname,
      content,
      price: Number(price),
      is_trading,
      condition
    })


    setProductname("")
    setContent("")
    setPrice("")
    setIsTrading(false)
  // ...existing code...
    setCondition("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>商品情報</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productname">商品名 *</Label>
            <Input
              id="productname"
              value={productname}
              onChange={(e) => setProductname(e.target.value)}
              placeholder="例: 微積分の教科書（第3版）"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">価格（円）*</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="2500"
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">商品の状態 *</Label>
            <Select value={condition} onValueChange={setCondition} required>
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
            <Label htmlFor="content">商品の説明 *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="商品の詳細な説明を入力してください"
              rows={5}
              required
            />
          </div>

          {/* <div className="flex items-center space-x-2">
            <input

              id="is_trading"
              checked={is_trading}
              onChange={(e) => setIsTrading(e.target.checked)}
              className="rounded"
            />
          </div> */}

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "出品中..." : "商品を出品する"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}