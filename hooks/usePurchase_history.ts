"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/components/firebaseConfig"

export interface PurchaseHistory {
  id: string
  productId: string
  productName: string
  productImage: string
  price: number
  sellerId: string
  sellerName: string
  buyerId: string
  purchaseDate: string
  status: "completed" | "pending" | "cancelled"
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
        
        // purchasesコレクションから購入履歴を取得
        const q = query(
          collection(db, "purchases"),
          where("buyerId", "==", userId)
        )
        
        const querySnapshot = await getDocs(q)
        const historyData: PurchaseHistory[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("📄 取得した購入履歴:", doc.id, data)
          
          historyData.push({
            id: doc.id,
            productId: data.productId || "",
            productName: data.productName || "商品名なし",
            productImage: data.productImage || "/placeholder.jpg",
            price: data.price || 0,
            sellerId: data.sellerId || "",
            sellerName: data.sellerName || "匿名ユーザー",
            buyerId: data.buyerId || "",
            purchaseDate: data.purchaseDate || new Date().toISOString(),
            status: data.status || "completed"
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