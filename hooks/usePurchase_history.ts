"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"

// ユーザーサブコレクション保存版購入履歴
export interface PurchaseHistory {
  id: string
  productName: string
  purchaseDate: string
  price: number
  sellerId: string
  sellerName: string
  sellerAvatar: string
}

export function usePurchaseHistory(userId: string) {
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchPurchaseHistory = async () => {
      try {
        console.log("🔄 購入履歴取得開始:", userId)
        
  // ユーザー単位で保存された purchases を取得
  const q = query(collection(db, "users", userId, "purchases"))
        
        const querySnapshot = await getDocs(q)
        const historyData: PurchaseHistory[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("📄 取得した購入履歴:", doc.id, data)
          
          historyData.push({
            id: doc.id,
            productName: data.productName || "商品名なし",
            purchaseDate: data.purchaseDate || new Date().toISOString(),
            price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
            sellerId: data.sellerId || "",
            sellerName: data.sellerName || "匿名ユーザー",
            sellerAvatar: data.sellerAvatar || "/seller-avatar.png"
          })
        })

        // 購入日でソート（新しい順）
        historyData.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())

        console.log(`✅ 購入履歴取得完了: ${historyData.length}件`)
        setPurchaseHistory(historyData)
        setError(null)
      } catch (error: any) {
        console.error("❌ 購入履歴取得エラー:", error)
        setError(`購入履歴の取得に失敗しました: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchPurchaseHistory()
  }, [userId])

  return { purchaseHistory, loading, error }
}