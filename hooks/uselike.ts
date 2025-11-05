"use client"

import { useState, useEffect } from "react"
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { useAuth } from "@/components/auth-provider"
import type { Product } from "@/hooks/useProducts"

export function useLikes() {
  const { user } = useAuth()
  const [likedProductIds, setLikedProductIds] = useState<string[]>([])
  const [likedProducts, setLikedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // ユーザーのいいね一覧を取得
  useEffect(() => {
    if (!user) {
      setLikedProductIds([])
      setLikedProducts([])
      setLoading(false)
      return
    }
    
    const fetchUserLikes = async () => {
      try {
        const userRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const likedIds = userData.likeProductId || []
          setLikedProductIds(likedIds)
          
          // いいねした商品の詳細を取得
          if (likedIds.length > 0) {
            const productsCollection = collection(db, "products")
            const q = query(productsCollection, where("__name__", "in", likedIds))
            const querySnapshot = await getDocs(q)
            
            const products: Product[] = []
            querySnapshot.forEach((doc) => {
              const data = doc.data()
              const createdAt = data?.createdAt && typeof data.createdAt === "object" && typeof data.createdAt.toDate === "function"
                ? data.createdAt.toDate().toISOString()
                : data?.createdAt || new Date().toISOString()
              
              products.push({
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
            
            // 作成日時で降順ソート
            products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            setLikedProducts(products)
          } else {
            setLikedProducts([])
          }
        }
      } catch (error) {
        console.error("❌ いいね一覧取得エラー:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserLikes()
  }, [user])

  // いいねを追加
  const addLike = async (productId: string) => {
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        likeProductId: arrayUnion(productId),
        updatedAt: new Date().toISOString()
      })
      
      // ローカル状態を更新
      setLikedProductIds(prev => [...prev, productId])
      console.log("✅ いいね追加完了:", productId)
    } catch (error) {
      console.error("❌ いいね追加エラー:", error)
    }
  }

  // いいねを削除
  const removeLike = async (productId: string) => {
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        likeProductId: arrayRemove(productId),
        updatedAt: new Date().toISOString()
      })
      
      // ローカル状態を更新
      setLikedProductIds(prev => prev.filter(id => id !== productId))
      setLikedProducts(prev => prev.filter(product => product.id !== productId))
      console.log("✅ いいね削除完了:", productId)
    } catch (error) {
      console.error("❌ いいね削除エラー:", error)
    }
  }

  // 特定の商品がいいねされているかチェック
  const isLiked = (productId: string) => {
    return likedProductIds.includes(productId)
  }

  // いいねの切り替え
  const toggleLike = async (productId: string) => {
    if (isLiked(productId)) {
      await removeLike(productId)
    } else {
      await addLike(productId)
    }
  }

  return {
    likedProductIds,
    likedProducts,
    loading,
    isLiked,
    toggleLike,
    addLike,
    removeLike
  }
}