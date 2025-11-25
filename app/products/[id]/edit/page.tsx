"use client"

import { use, useState, useEffect, useMemo } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ExternalLink, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useProducts } from "@/hooks/useProducts"
import { doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/firebaseConfig"
import { ImageUpload } from "@/components/image-upload"

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    productname: "",
    price: 0,
    condition: "good",
    content: "",
    images: [] as File[]
  })
  const [existingImages, setExistingImages] = useState<string[]>([])
  // 取引中判定はuseMemoで厳密に
  const isTrading = useMemo(() => {
     return product && [
       "reserved", "sold", "negotiating", "agreed", "completed"
     ].includes(product.status);
  }, [product]);

  // 商品データを取得
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id)
        const docSnap = await getDoc(docRef)
        
        if (!docSnap.exists()) {
          notFound()
          return
        }

        const data = docSnap.data()
        
        // 権限チェック: 出品者本人のみ編集可能
        if (data.userid !== user?.uid) {
          router.push(`/products/${id}`)
          return
        }

        setProduct({ id: docSnap.id, ...data })
        setFormData({
          productname: data.productname || "",
          price: data.price || 0,
          condition: data.condition || "good",
          content: data.content || "",
          images: []
        })
        setExistingImages(data.image_urls || [data.image_url] || [])
        setLoading(false)
      } catch (error) {
        console.error("商品データ取得エラー:", error)
        notFound()
      }
    }

    if (user) {
      fetchProduct()
    }
  }, [id, user, router])

  // 画像アップロード処理
  const uploadImages = async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const fileName = `${timestamp}_${randomId}.${fileExtension}`
      const fileRef = ref(storage, `products/${fileName}`)
      
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'uploadedBy': user?.uid || 'anonymous',
          'originalName': file.name
        }
      }
      
      const snapshot = await uploadBytes(fileRef, file, metadata)
      return await getDownloadURL(snapshot.ref)
    })
    
    return await Promise.all(uploadPromises)
  }

  // 商品更新処理
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !product) return
    
    setIsSubmitting(true)
    
    try {
      let imageUrls = [...existingImages]
      
      // 新しい画像がある場合はアップロード
      if (formData.images.length > 0) {
        const newImageUrls = await uploadImages(formData.images)
        imageUrls = [...imageUrls, ...newImageUrls]
      }
      
      const docRef = doc(db, "products", id)
      await updateDoc(docRef, {
        productname: formData.productname,
        price: Number(formData.price),
        condition: formData.condition,
        content: formData.content,
        image_url: imageUrls[0] || "/placeholder.jpg",
        image_urls: imageUrls,
      })
      
      alert("商品情報を更新しました")
      router.push(`/products/${id}`)
    } catch (error) {
      console.error("更新エラー:", error)
      alert("更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 商品削除処理
  const handleDelete = async () => {
    if (!confirm("本当にこの商品を削除しますか？")) return
    
    setIsSubmitting(true)
    
    try {
      // Firestoreから削除
      await deleteDoc(doc(db, "products", id))
      
      // Storageから画像を削除（オプション）
      // 注: エラーが発生しても続行
      try {
        for (const imageUrl of existingImages) {
          if (imageUrl.includes('firebase')) {
            const imageRef = ref(storage, imageUrl)
            await deleteObject(imageRef)
          }
        }
      } catch (storageError) {
        console.warn("画像削除エラー（商品は削除されました）:", storageError)
      }
      
      alert("商品を削除しました")
      router.push("/profile")
    } catch (error) {
      console.error("削除エラー:", error)
      alert("削除に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>読み込み中...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

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
            {isTrading && (
              <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded">
                この商品は取引中のため編集できません。
              </div>
            )}
            <form onSubmit={handleUpdate}>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>商品情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="productname">商品名</Label>
                    <Input
                      id="productname"
                      value={formData.productname}
                      onChange={(e) => setFormData({ ...formData, productname: e.target.value })}
                      required
                      disabled={isTrading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">価格（円）</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      required
                      disabled={isTrading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">商品の状態</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData({ ...formData, condition: value })}
                      disabled={isTrading}
                    >
                      <SelectTrigger id="condition">
                        <SelectValue />
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
                    <Label htmlFor="content">商品の説明</Label>
                    <Textarea
                      id="content"
                      rows={6}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                      disabled={isTrading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>既存の商品画像</Label>
                    {existingImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {existingImages.map((imageUrl, index) => (
                          <div key={index} className="relative">
                            <img
                              src={imageUrl}
                              alt={`既存画像 ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setExistingImages(existingImages.filter((_, i) => i !== index))
                              }}
                              disabled={isTrading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Label>新しい画像を追加</Label>
                    <ImageUpload
                      onImagesChange={(files) => setFormData({ ...formData, images: files })}
                      maxImages={5 - existingImages.length}
                      disabled={isTrading}
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting || isTrading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "変更を保存"
                  )}
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" asChild>
                  <Link href={`/products/${id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    商品ページを見る
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isSubmitting || isTrading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
