"use client"

import { useState, useEffect } from "react"


import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"

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

export function useProducts(userId?: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchProducts = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log("🔄 商品データ取得開始", userId ? `(userId=${userId})` : "(all users)")

        const productsCollection = collection(db, "products")

        // ✅ orderBy を削除（インデックス不要化）
        const q = userId
          ? query(productsCollection, where("userid", "==", userId))
          : query(productsCollection, orderBy("createdAt", "desc"))

        const querySnapshot = await getDocs(q)
        const productsData: Product[] = []

        querySnapshot.forEach((doc) => {
          const data: any = doc.data()

          const createdAt =
            data?.createdAt && typeof data.createdAt === "object" && typeof data.createdAt.toDate === "function"
              ? data.createdAt.toDate().toISOString()
              : data?.createdAt || new Date().toISOString()

          productsData.push({
            id: doc.id,
            productname: data?.productname || "商品名なし",
            image_url: data?.image_url || "/placeholder.jpg",
            image_urls: Array.isArray(data?.image_urls) ? data.image_urls : [],
            price: typeof data?.price === "number" ? data.price : Number(data?.price) || 0,
            userid: data?.userid || "",
            content: data?.content || "",
            is_trading: !!data?.is_trading,
            category: data?.category || "other",
            condition: data?.condition || "good",
            createdAt,
            status: data?.status || "active",
            sellerName: data?.sellerName || "匿名ユーザー",
            sellerEmail: data?.sellerEmail || ""
          })
        })

        // ✅ Firestore側で orderBy を使わない代わりに、クライアントで並び替え
        productsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        if (!mounted) return
        console.log(`✅ 商品データ取得完了: ${productsData.length}件`)
        setProducts(productsData)
      } catch (err: any) {
        console.error("❌ 商品データ取得エラー:", err)
        if (!mounted) return
        setError(err?.message ? `商品データの取得に失敗しました: ${err.message}` : "商品データの取得に失敗しました")
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    fetchProducts()

    return () => {
      mounted = false
    }
  }, [userId])

  return { products, loading, error }
}
