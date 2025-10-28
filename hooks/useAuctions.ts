"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/components/firebaseConfig"
import { useAuth } from "@/components/auth-provider"

export interface Auction {
  id: string
  title: string
  description: string
  images: string[]
  startingPrice: number
  currentBid: number
  buyNowPrice?: number
  bidCount: number
  endTime: string
  status: "active" | "ended"
  sellerId: string
  sellerName: string
  category?: string
  condition?: string
  createdAt: string
}

export function useAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        console.log("🔄 オークションデータ取得開始")
        
        const querySnapshot = await getDocs(collection(db, "auctions"))
        const auctionsData: Auction[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("📄 取得したオークション:", doc.id, data)
          
          auctionsData.push({
            id: doc.id,
            title: String(data.title || "タイトルなし"),
            description: String(data.description || ""),
            images: Array.isArray(data.images) ? data.images : [],
            startingPrice: Number(data.startingPrice) || 0,
            currentBid: Number(data.currentBid) || Number(data.startingPrice) || 0,
            buyNowPrice: data.buyNowPrice ? Number(data.buyNowPrice) : undefined,
            bidCount: Number(data.bidCount) || 0,
            endTime: String(data.endTime || new Date().toISOString()),
            status: String(data.status || "active") as "active" | "ended",
            sellerId: String(data.sellerId || ""),
            sellerName: String(data.sellerName || "匿名ユーザー"),
            category: data.category ? String(data.category) : undefined,
            condition: data.condition ? String(data.condition) : undefined,
            createdAt: String(data.createdAt || new Date().toISOString())
          })
        })

        // 終了日時でソート（新しい順）
        auctionsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        console.log(`✅ オークションデータ取得完了: ${auctionsData.length}件`)
        setAuctions(auctionsData)
        setError(null)
      } catch (error: any) {
        console.error("❌ オークションデータ取得エラー:", error)
        setError(`オークションデータの取得に失敗しました: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchAuctions()
  }, [])

  return { auctions, loading, error }
}

export function useAuction(id: string) {
  const [auction, setAuction] = useState<Auction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchAuction = async () => {
      try {
        console.log("🔄 オークション詳細取得開始:", id)
        
        const docRef = doc(db, "auctions", id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          console.log("📄 取得したオークション詳細:", data)
          
          const auctionData: Auction = {
            id: docSnap.id,
            title: String(data.title || "タイトルなし"),
            description: String(data.description || ""),
            images: Array.isArray(data.images) ? data.images : [],
            startingPrice: Number(data.startingPrice) || 0,
            currentBid: Number(data.currentBid) || Number(data.startingPrice) || 0,
            buyNowPrice: data.buyNowPrice ? Number(data.buyNowPrice) : undefined,
            bidCount: Number(data.bidCount) || 0,
            endTime: String(data.endTime || new Date().toISOString()),
            status: String(data.status || "active") as "active" | "ended",
            sellerId: String(data.sellerId || ""),
            sellerName: String(data.sellerName || "匿名ユーザー"),
            category: data.category ? String(data.category) : undefined,
            condition: data.condition ? String(data.condition) : undefined,
            createdAt: String(data.createdAt || new Date().toISOString())
          }
          
          setAuction(auctionData)
          console.log("✅ オークション詳細取得完了")
        } else {
          console.log("❌ オークションが見つかりません")
          setError("オークションが見つかりません")
        }
      } catch (error: any) {
        console.error("❌ オークション詳細取得エラー:", error)
        setError(`オークション詳細の取得に失敗しました: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchAuction()
  }, [id])

  return { auction, loading, error }
}

export function useAuctionSubmit() {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitAuction = async (auctionData: {
    title: string
    description: string
    startingPrice: number
    buyNowPrice?: number
    endTime: string
    images: string[]
    category?: string
    condition?: string
  }) => {
    console.log("オークション出品開始:", auctionData)
    
    if (!user) {
      throw new Error("ログインが必要です")
    }

    if (!auctionData.title || !auctionData.description || !auctionData.startingPrice) {
      throw new Error("必須項目を入力してください")
    }

    setIsSubmitting(true)

    try {
      console.log("Firestoreにオークションデータ保存開始")
      
      const docData = {
        title: auctionData.title,
        description: auctionData.description,
        images: auctionData.images,
        startingPrice: Number(auctionData.startingPrice),
        currentBid: Number(auctionData.startingPrice),
        buyNowPrice: auctionData.buyNowPrice ? Number(auctionData.buyNowPrice) : null,
        bidCount: 0,
        endTime: auctionData.endTime,
        status: "active",
        sellerId: user.uid,
        sellerName: user.displayName || "匿名ユーザー",
        category: auctionData.category || "other",
        condition: auctionData.condition || "good",
        createdAt: new Date().toISOString()
      }
      
      console.log("保存するオークションデータ:", docData)
      const docRef = await addDoc(collection(db, "auctions"), docData)
      console.log("Firestore保存完了:", docRef.id)

      return { success: true, message: "オークションを出品しました！" }
    } catch (error: any) {
      console.error("オークション出品エラー詳細:", error)
      if (error instanceof Error) {
        throw new Error(`オークション出品に失敗しました: ${error.message}`)
      } else {
        throw new Error("オークション出品に失敗しました: 不明なエラー")
      }
    } finally {
      console.log("オークション出品処理終了")
      setIsSubmitting(false)
    }
  }

  return {
    submitAuction,
    isSubmitting,
    user
  }
}