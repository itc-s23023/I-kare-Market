"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/components/firebaseConfig"

export interface Product {
  id: string
  productname: string
  image_url: string
  image_urls: string[]
  price: number
  userid: string
  content: string
  is_trading: boolean
  category?: string
  condition?: string
  createdAt: string
  status: string
  sellerName: string
  sellerEmail: string
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("🔄 商品データ取得開始")
        
        const querySnapshot = await getDocs(collection(db, "products"))
        const productsData: Product[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("📄 取得したドキュメント:", doc.id, data)
          
          productsData.push({
            id: doc.id,
            productname: data.productname || "商品名なし",
            image_url: data.image_url || "/placeholder.jpg",
            image_urls: data.image_urls || [],
            price: data.price || 0,
            userid: data.userid || "",
            content: data.content || "",
            is_trading: data.is_trading || false,
            category: data.category || "other",
            condition: data.condition || "good",
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || "active",
            sellerName: data.sellerName || "匿名ユーザー",
            sellerEmail: data.sellerEmail || ""
          })
        })

        // 日付でソート（新しい順）
        productsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        console.log(`✅ 商品データ取得完了: ${productsData.length}件`)
        setProducts(productsData)
        setError(null)
      } catch (error: any) {
        console.error("❌ 商品データ取得エラー:", error)
        setError(`商品データの取得に失敗しました: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { products, loading, error }
}