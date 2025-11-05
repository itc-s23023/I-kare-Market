"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { ImageUpload } from "@/components/image-upload"
import { ProductForm } from "@/components/product-form"
import { useProductUpload } from "@/hooks/useProductUpload"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"

export default function SellPage() {
  const router = useRouter()
  const { submitProduct, isSubmitting, user } = useProductUpload()
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFormSubmit = async (formData: {
    productname: string
    content: string
    price: number
    is_trading: boolean
    category: string
    condition: string
  }) => {
    setError(null)
    setSuccess(null)
    
    console.log("フォーム送信開始:", formData)
    
    try {
      const result = await submitProduct({
        ...formData,
        images: selectedImages
      })
      
      if (result.success) {
        setSuccess(result.message)
        console.log("出品成功")
        
        // 3秒後にホームページにリダイレクト
        setTimeout(() => {
          router.push("/")
        }, 3000)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "出品に失敗しました"
      console.error("出品エラー:", errorMessage)
      setError(errorMessage)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">商品を出品する</h1>
          <p className="text-muted-foreground mb-8">
            不要になった教科書や物品を出品しましょう
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            出品者: {user!.displayName} (ID: {user!.uid})
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                {success} 3秒後にホームページに移動します...
              </p>
            </div>
          )}

          <div className="space-y-6">
            <ImageUpload 
              onImagesChange={setSelectedImages}
              maxImages={5}
            />
            
            <ProductForm 
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
            />

            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
            </div>

            {isSubmitting && (
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  出品処理中です...
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
