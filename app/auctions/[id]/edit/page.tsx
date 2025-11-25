"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useRouter, notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { ImageUpload } from "@/components/image-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from "lucide-react"
import { db, storage } from "@/lib/firebaseConfig"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

// 動的レンダリングを強制
export const dynamic = "force-dynamic"

export default function EditAuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const [auction, setAuction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startingPrice: 0,
    buyNowPrice: undefined as number | undefined,
    endTime: "",
    condition: "good",
    images: [] as File[],
  })
  const [existingImages, setExistingImages] = useState<string[]>([])

  const hasBids = useMemo(() => {
    if (!auction) return false
    const bidCount = Number(auction.bidCount || 0)
    const start = Number(auction.startingPrice || 0)
    const current = Number(auction.currentBid || start)
    return bidCount > 0 || current > start
  }, [auction])

  const isEnded = useMemo(() => auction?.status === "ended", [auction])

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const docRef = doc(db, "auctions", id)
        const snap = await getDoc(docRef)
        if (!snap.exists()) {
          notFound()
          return
        }
        const data = snap.data()

        // 権限チェック: 出品者本人のみ編集可
        if (!user || data.sellerId !== user.uid) {
          router.push(`/auctions/${id}`)
          return
        }

        setAuction({ id: snap.id, ...data })
        setFormData({
          title: String(data.title || ""),
          description: String(data.description || ""),
          startingPrice: Number(data.startingPrice) || 0,
          buyNowPrice: data.buyNowPrice != null ? Number(data.buyNowPrice) : undefined,
          endTime: String(data.endTime || new Date().toISOString()).slice(0, 16), // datetime-local 形式
          condition: String(data.condition || "good"),
          images: [],
        })
        setExistingImages(Array.isArray(data.images) ? data.images : [])
        setLoading(false)
      } catch (e) {
        console.error("オークション取得エラー:", e)
        notFound()
      }
    }
    if (user) fetchAuction()
  }, [id, user, router])

  // 画像アップロード
  const uploadImages = async (files: File[]) => {
    const uploads = files.map(async (file) => {
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).slice(2)
      const ext = file.name.split(".").pop() || "jpg"
      const fileName = `${timestamp}_${randomId}.${ext}`
      const fileRef = ref(storage, `auctions/${fileName}`)
      const metadata = {
        contentType: file.type,
        customMetadata: { uploadedBy: user?.uid || "anonymous", originalName: file.name },
      }
      const snap = await uploadBytes(fileRef, file, metadata)
      return await getDownloadURL(snap.ref)
    })
    return await Promise.all(uploads)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auction || !user) return

    setIsSubmitting(true)
    try {
      let imageUrls = [...existingImages]
      if (formData.images.length > 0) {
        const newUrls = await uploadImages(formData.images)
        imageUrls = [...imageUrls, ...newUrls]
      }

      const payload: any = {
        description: formData.description,
        condition: formData.condition,
        images: imageUrls,
        imageUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // 入札なし＆未終了のみ変更可能な項目
      if (!hasBids && !isEnded) {
        payload.title = formData.title
        payload.startingPrice = Number(formData.startingPrice)
        payload.currentBid = Math.max(Number(auction.currentBid || 0), Number(formData.startingPrice) || 0)
        payload.buyNowPrice = formData.buyNowPrice != null ? Number(formData.buyNowPrice) : null
        // datetime-local から ISO に変換（ローカルタイム想定）
        try {
          const local = new Date(formData.endTime)
          payload.endTime = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString()
        } catch {}
      }

      await updateDoc(doc(db, "auctions", auction.id), payload)
      alert("オークション情報を更新しました")
      router.push(`/auctions/${auction.id}`)
    } catch (err) {
      console.error("オークション更新エラー:", err)
      alert("更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!auction) return
    if (hasBids || isEnded) {
      alert("入札済み、または終了済みのオークションは削除できません")
      return
    }
    if (!confirm("本当にこのオークションを削除しますか？")) return

    setIsSubmitting(true)
    try {
      await deleteDoc(doc(db, "auctions", auction.id))

      // 画像削除（オプション、失敗しても続行）
      try {
        for (const url of existingImages) {
          if (url.includes("firebase")) {
            const imageRef = ref(storage, url)
            await deleteObject(imageRef)
          }
        }
      } catch (e) {
        console.warn("画像削除エラー（レコード削除は完了）:", e)
      }

      alert("オークションを削除しました")
      router.push("/profile")
    } catch (e) {
      console.error("削除エラー:", e)
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

  if (!auction) {
    notFound()
  }

  // 取引中判定（auction取得後に判定）
  const isTrading = auction && [
    "sold", "negotiating", "agreed", "completed"
  ].includes(auction.status)

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
              <h1 className="text-2xl font-bold">オークションを編集</h1>
            </div>
            {(hasBids || isEnded || isTrading) && (
              <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded">
                {isTrading
                  ? "このオークションは取引中のため編集できません。"
                  : "入札がある、または終了済みのため編集できません"}
              </div>
            )}
            <form onSubmit={handleUpdate}>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>オークション情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">商品名</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      disabled={hasBids || isEnded || isTrading}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startingPrice">開始価格（円）</Label>
                      <Input
                        id="startingPrice"
                        type="number"
                        value={formData.startingPrice}
                        onChange={(e) => setFormData({ ...formData, startingPrice: Number(e.target.value) })}
                        disabled={hasBids || isEnded || isTrading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyNowPrice">即決価格（円・任意）</Label>
                      <Input
                        id="buyNowPrice"
                        type="number"
                        value={formData.buyNowPrice ?? ""}
                        onChange={(e) => {
                          const v = e.target.value
                          setFormData({ ...formData, buyNowPrice: v === "" ? undefined : Number(v) })
                        }}
                        disabled={hasBids || isEnded || isTrading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">終了日時</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      disabled={hasBids || isEnded || isTrading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">商品の状態</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData({ ...formData, condition: value })}
                      disabled={hasBids || isEnded || isTrading}
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
                    <Label htmlFor="description">商品の説明</Label>
                    <Textarea
                      id="description"
                      rows={6}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      disabled={hasBids || isEnded || isTrading}
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
                              disabled={hasBids || isEnded || isTrading}
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
                      maxImages={Math.max(0, 5 - existingImages.length)}
                      disabled={hasBids || isEnded || isTrading}
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" className="flex-1" disabled={isSubmitting || hasBids || isEnded || isTrading}>
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
                  <Link href={`/auctions/${id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    オークションページを見る
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isSubmitting || hasBids || isEnded || isTrading}
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
