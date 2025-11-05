"use client"

import { useState, useEffect } from "react"
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { useAuth } from "@/components/auth-provider"
import type { Product } from "@/hooks/useProducts"
import type { Auction } from "@/hooks/useAuctions"

export function useLikes() {
  const { user } = useAuth()
  const [likedItemIds, setLikedItemIds] = useState<string[]>([])
  const [likedProducts, setLikedProducts] = useState<Product[]>([])
  const [likedAuctions, setLikedAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)

  // ユーザーのいいね一覧を取得
  useEffect(() => {
    if (!user) {
      setLikedItemIds([])
      setLikedProducts([])
      setLikedAuctions([])
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
          console.log("💝 いいねされたID一覧:", likedIds)
          setLikedItemIds(likedIds)
          
          if (likedIds.length > 0) {
            const products: Product[] = []
            const auctions: Auction[] = []
            
            // 各IDに対してproductsとauctionsの両方を確認
            for (const id of likedIds) {
              // productsテーブルから確認
              try {
                const productRef = doc(db, "products", id)
                const productSnap = await getDoc(productRef)
                
                if (productSnap.exists()) {
                  const data = productSnap.data()
                  const createdAt = data?.createdAt && typeof data.createdAt === "object" && typeof data.createdAt.toDate === "function"
                    ? data.createdAt.toDate().toISOString()
                    : data?.createdAt || new Date().toISOString()
                  
                  products.push({
                    id: productSnap.id,
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
                  console.log("🛍️ フリマ商品発見:", productSnap.id, data?.productname)
                  continue // 見つかったので次のIDへ
                }
              } catch (error) {
                console.error("フリマ商品取得エラー:", id, error)
              }
              
              // auctionsテーブルから確認
              try {
                const auctionRef = doc(db, "auctions", id)
                const auctionSnap = await getDoc(auctionRef)
                
                if (auctionSnap.exists()) {
                  const data = auctionSnap.data()
                  
                  auctions.push({
                    id: auctionSnap.id,
                    title: String(data?.title || "タイトルなし"),
                    description: String(data?.description || ""),
                    images: Array.isArray(data?.images) ? data.images : [],
                    startingPrice: Number(data?.startingPrice) || 0,
                    currentBid: Number(data?.currentBid) || Number(data?.startingPrice) || 0,
                    buyNowPrice: data?.buyNowPrice ? Number(data.buyNowPrice) : undefined,
                    bidCount: Number(data?.bidCount) || 0,
                    endTime: String(data?.endTime || new Date().toISOString()),
                    status: String(data?.status || "active") as "active" | "ended",
                    sellerId: String(data?.sellerId || ""),
                    sellerName: String(data?.sellerName || "匿名ユーザー"),
                    category: data?.category ? String(data.category) : undefined,
                    condition: data?.condition ? String(data.condition) : undefined,
                    createdAt: String(data?.createdAt || new Date().toISOString())
                  })
                  
                  if (String(data?.status || "active") === "ended") {
                    console.log("🏁 終了したオークション商品も表示:", auctionSnap.id, data?.title)
                  } else {
                    console.log("🎯 アクティブオークション商品発見:", auctionSnap.id, data?.title)
                  }
                }
              } catch (error) {
                console.error("オークション商品取得エラー:", id, error)
              }
            }
            
            // 作成日時で降順ソート
            products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            auctions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            
            console.log("✅ いいね商品取得完了 - フリマ:", products.length, "オークション:", auctions.length)
            setLikedProducts(products)
            setLikedAuctions(auctions)
          } else {
            setLikedProducts([])
            setLikedAuctions([])
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

  // いいねを追加（フリマ商品・オークション商品共通）
  const addLike = async (itemId: string) => {
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        likeProductId: arrayUnion(itemId),
        updatedAt: new Date().toISOString()
      })
      
      setLikedItemIds(prev => [...prev, itemId])
      console.log("✅ いいね追加完了:", itemId)
    } catch (error) {
      console.error("❌ いいね追加エラー:", error)
    }
  }

  // いいねを削除（フリマ商品・オークション商品共通）
  const removeLike = async (itemId: string) => {
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        likeProductId: arrayRemove(itemId),
        updatedAt: new Date().toISOString()
      })
      
      setLikedItemIds(prev => prev.filter(id => id !== itemId))
      setLikedProducts(prev => prev.filter(product => product.id !== itemId))
      setLikedAuctions(prev => prev.filter(auction => auction.id !== itemId))
      console.log("✅ いいね削除完了:", itemId)
    } catch (error) {
      console.error("❌ いいね削除エラー:", error)
    }
  }

  // 特定の商品/オークションがいいねされているかチェック
  const isLiked = (itemId: string) => {
    return likedItemIds.includes(itemId)
  }

  // いいねの切り替え（フリマ商品・オークション商品共通）
  const toggleLike = async (itemId: string) => {
    if (isLiked(itemId)) {
      await removeLike(itemId)
    } else {
      await addLike(itemId)
    }
  }

  return {
    // 共通
    likedItemIds,
    likedProducts,
    likedAuctions,
    loading,
    isLiked,
    toggleLike,
    addLike,
    removeLike,
    
    // 後方互換性のエイリアス
    likedProductIds: likedItemIds,
    likedAuctionIds: likedItemIds,
    isProductLiked: isLiked,
    isAuctionLiked: isLiked,
    toggleProductLike: toggleLike,
    toggleAuctionLike: toggleLike,
    addProductLike: addLike,
    removeProductLike: removeLike,
    addAuctionLike: addLike,
    removeAuctionLike: removeLike
  }
}