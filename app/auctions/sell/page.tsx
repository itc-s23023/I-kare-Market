"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { ImageUpload } from "@/components/image-upload"
import { useAuctionSubmit } from "@/hooks/useAuctions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebaseConfig"
import { ProtectedRoute } from "@/components/protected-route"

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

export default function AuctionSellPage() {
  const router = useRouter()
  const { submitAuction, isSubmitting, user } = useAuctionSubmit()
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startingPrice, setStartingPrice] = useState("")
  const [buyNowPrice, setBuyNowPrice] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [category, setCategory] = useState("")
  const [condition, setCondition] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const uploadImages = async (files: File[]) => {
    console.log("🔄 画像アップロード開始:", files.length, "枚")
    
    const uploadPromises = files.map(async (file, index) => {
      try {
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 15)
        const fileExtension = file.name.split('.').pop() || 'jpg'
        const fileName = `${timestamp}_${randomId}.${fileExtension}`
        const fileRef = ref(storage, `auctions/${fileName}`)
        
        const metadata = {
          contentType: file.type,
          customMetadata: {
            'uploadedBy': user?.uid || 'anonymous',
            'originalName': file.name
          }
        }
        
        const snapshot = await uploadBytes(fileRef, file, metadata)
        const downloadURL = await getDownloadURL(snapshot.ref)
        console.log(`✅ 画像${index + 1}のURL取得完了:`, downloadURL)
        
        return downloadURL
      } catch (error: any) {
        console.error(`❌ 画像${index + 1}のアップロードエラー:`, error)
        throw new Error(`画像のアップロードに失敗しました: ${error.message}`)
      }
    })
    
    const results = await Promise.all(uploadPromises)
    console.log(`🎉 全画像アップロード完了:`, results)
    return results
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    console.log("=== オークション出品開始 ===")
    
    try {
      // バリデーション
      if (!title || !description || !startingPrice || !endDate || !endTime) {
        throw new Error("必須項目を入力してください")
      }
      
      if (Number(startingPrice) <= 0) {
        throw new Error("開始価格は0円より大きく設定してください")
      }
      
      if (buyNowPrice && Number(buyNowPrice) <= Number(startingPrice)) {
        throw new Error("即決価格は開始価格より大きく設定してください")
      }
      
      // 終了日時の作成
      const endDateTime = new Date(`${endDate}T${endTime}`)
      if (endDateTime <= new Date()) {
        throw new Error("終了日時は現在時刻より後に設定してください")
      }
      
      // 画像アップロード
      let imageUrls: string[] = []
      if (selectedImages.length > 0) {
        try {
          console.log("画像アップロード処理開始")
          imageUrls = await uploadImages(selectedImages)
          console.log("全画像アップロード完了:", imageUrls)
        } catch (uploadError: any) {
          console.warn("画像アップロードに失敗:", uploadError)
          throw new Error("画像のアップロードに失敗しました")
        }
      }
      
      // オークション出品
      const auctionData = {
        title,
        description,
        startingPrice: Number(startingPrice),
        buyNowPrice: buyNowPrice ? Number(buyNowPrice) : undefined,
        endTime: endDateTime.toISOString(),
        images: imageUrls,
        category: category || "other",
        condition: condition || "good"
      }
      
      const result = await submitAuction(auctionData)
      
      if (result.success) {
        setSuccess(result.message)
        console.log("✅ オークション出品成功")
        
        // 3秒後にオークション一覧にリダイレクト
        setTimeout(() => {
          router.push("/auctions")
        }, 3000)
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "オークション出品に失敗しました"
      console.error("❌ オークション出品エラー:", errorMessage)
      setError(errorMessage)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">オークション出品</h1>
          <p className="text-muted-foreground mb-8">
            商品をオークション形式で出品しましょう
          </p>
          {user && (
            <p className="text-sm text-muted-foreground mb-6">
              出品者: {user.displayName} (ID: {user.uid})
            </p>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                {success} 3秒後にオークション一覧に移動します...
              </p>
            </div>
          )}

          <div className="space-y-6">
            <ImageUpload 
              onImagesChange={setSelectedImages}
              maxImages={5}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>オークション情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">商品名 *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="商品名を入力してください"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">商品説明 *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="商品の詳細な説明を入力してください"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">カテゴリー</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="textbook">教科書</SelectItem>
                          <SelectItem value="electronics">電子機器</SelectItem>
                          <SelectItem value="stationery">文房具</SelectItem>
                          <SelectItem value="clothing">衣類</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="condition">商品の状態</Label>
                      <Select value={condition} onValueChange={setCondition}>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">新品</SelectItem>
                          <SelectItem value="like-new">未使用に近い</SelectItem>
                          <SelectItem value="good">良好</SelectItem>
                          <SelectItem value="fair">可</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startingPrice">開始価格 (円) *</Label>
                      <Input
                        id="startingPrice"
                        type="number"
                        value={startingPrice}
                        onChange={(e) => setStartingPrice(e.target.value)}
                        placeholder="1000"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="buyNowPrice">即決価格 (円)</Label>
                      <Input
                        id="buyNowPrice"
                        type="number"
                        value={buyNowPrice}
                        onChange={(e) => setBuyNowPrice(e.target.value)}
                        placeholder="3000 (任意)"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="endDate">終了日 *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="endTime">終了時刻 *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1" 
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                    >
                      キャンセル
                    </Button>
                    <Button 
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "出品中..." : "オークション出品"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {isSubmitting && (
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  オークション出品処理中です...
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  画像のアップロードとデータの保存を行っています。しばらくお待ちください。
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </ProtectedRoute>
  )
}
