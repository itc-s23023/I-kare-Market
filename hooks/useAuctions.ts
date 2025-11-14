"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where, orderBy, deleteDoc, writeBatch, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
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

export interface BiddingHistory {
  id: string
  auction_productid: string
  userid: string
  username: string
  bid_amount: number
  bid_time: string
}

export function useAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  // 入札履歴を取得する関数
  const getBiddingHistory = async (auctionId: string): Promise<BiddingHistory[]> => {
    try {
      // orderByを削除してインデックス不要にする
      const q = query(
        collection(db, "bidding_history"),
        where("auction_productid", "==", auctionId)
      )
      const querySnapshot = await getDocs(q)
      const bids: BiddingHistory[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        bids.push({
          id: doc.id,
          auction_productid: data.auction_productid,
          userid: data.userid,
          username: data.username,
          bid_amount: Number(data.bid_amount),
          bid_time: data.bid_time
        })
      })
      
      // クライアント側で入札額の降順でソート
      bids.sort((a, b) => b.bid_amount - a.bid_amount)
      
      return bids
    } catch (error) {
      console.error("入札履歴取得エラー:", error)
      return []
    }
  }

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

  // オークション終了チェックと通知送信
  const checkAndEndExpiredAuctions = async () => {
    const now = new Date()
    
    for (const auction of auctions) {
      const endTime = new Date(auction.endTime)
      
      // 期間切れかつまだ終了処理されていないオークションをチェック
      if (now >= endTime && auction.status === 'active') {
        try {
          // 入札履歴を取得
          const bids = await getBiddingHistory(auction.id)
          
          if (bids.length > 0) {
            // 入札がある場合：ステータスのみ更新（データは残す）
            const highestBid = bids[0]
            
              // 落札者の画像URLを取得
              let buyerImage = "/placeholder-user.jpg"
              try {
                const buyerRef = doc(db, "users", highestBid.userid)
                const buyerSnap = await getDoc(buyerRef)
                if (buyerSnap.exists()) {
                  const buyerData = buyerSnap.data()
                  buyerImage = buyerData.imageURL || buyerData.photoURL || "/placeholder-user.jpg"
                }
              } catch (e) {
                console.error("落札者画像取得エラー:", e)
              }
            
            // オークション状態をFirestoreで終了に更新
            const auctionRef = doc(db, "auctions", auction.id)
            await updateDoc(auctionRef, {
              status: "ended",
              endReason: "expired",
                buyerId: highestBid.userid,
                buyerName: highestBid.username,
                buyerImage: buyerImage,
              finalPrice: highestBid.bid_amount,
              actualEndTime: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            
            // ローカル状態も更新
            setAuctions(prev => prev.map(a => 
              a.id === auction.id ? { ...a, status: 'ended' as const } : a
            ))
            
              // チャットmeta作成
              try {
                const metaRef = doc(db, "auctions", auction.id, "chat", "meta")
                await setDoc(metaRef, {
                  users: {
                    seller: {
                      id: auction.sellerId,
                      imageURL: auction.images?.[0] || "/placeholder-user.jpg",
                    },
                    buyer: {
                      id: highestBid.userid,
                      imageURL: buyerImage,
                    },
                  },
                })
                console.log(`チャットmeta作成: オークション ${auction.id}`)
              } catch (metaError) {
                console.error("チャットmeta作成エラー:", metaError)
              }
            
              // チャット初回メッセージを送信
            try {
              const chatRef = collection(db, "auctions", auction.id, "chat")
              await addDoc(chatRef, {
                senderId: "system",
                senderName: "システム",
                  content: `オークションが終了しました。落札者: ${highestBid.username}さん (¥${highestBid.bid_amount.toLocaleString()})\n出品者の${auction.sellerName}さんとの取引を開始してください。`,
                createdAt: serverTimestamp()
              })
              console.log(`チャット開始: オークション ${auction.id}`)
            } catch (chatError) {
              console.error("チャット開始エラー:", chatError)
            }
            
            console.log(`✅ オークション ${auction.id} が終了しました（データ保持）。落札者: ${highestBid.username}`)
          } else {
            // 入札がない場合：完全にデータを削除
            console.log(`入札がないオークション ${auction.id} を完全削除します`)
            
            const auctionRef = doc(db, "auctions", auction.id)
            await deleteDoc(auctionRef)
            
            // ローカル状態からも削除
            setAuctions(prev => prev.filter(a => a.id !== auction.id))
            
            console.log(`🗑️ 入札なしオークション ${auction.id} のデータを完全に削除しました`)
          }
        } catch (error) {
          console.error(`オークション ${auction.id} の処理でエラー:`, error)
        }
      }
    }
  }

  // 定期的にオークション終了をチェック
  useEffect(() => {
    if (auctions.length > 0) {
      checkAndEndExpiredAuctions()
      
      // 1分毎にチェック
      const interval = setInterval(checkAndEndExpiredAuctions, 60000)
      
      return () => clearInterval(interval)
    }
  }, [auctions])

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


export function useBidding() {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const placeBid = async (auctionId: string, bidAmount: number) => {
    if (!user) {
      throw new Error("ログインが必要です")
    }

    if (!auctionId || bidAmount <= 0) {
      throw new Error("入札情報が無効です")
    }

    setIsSubmitting(true)

    try {
      console.log("🔄 入札処理開始:", { auctionId, bidAmount, userId: user.uid })

      
      const auctionRef = doc(db, "auctions", auctionId)
      const auctionSnap = await getDoc(auctionRef)
      
      if (!auctionSnap.exists()) {
        throw new Error("オークションが見つかりません")
      }

      const auctionData = auctionSnap.data()
      const currentBid = Number(auctionData.currentBid) || Number(auctionData.startingPrice) || 0
      const minimumBid = currentBid + 100

    
      if (bidAmount < minimumBid) {
        throw new Error(`入札額は現在価格より100円以上高く設定してください（最低入札額: ¥${minimumBid.toLocaleString()}）`)
      }

     
      const endTime = new Date(auctionData.endTime)
      const now = new Date()
      if (now >= endTime) {
        throw new Error("このオークションは既に終了しています")
      }

    
      if (user.uid === auctionData.sellerId) {
        throw new Error("自分が出品したオークションには入札できません")
      }

    
      const biddingData = {
        auction_productid: auctionId,
        userid: user.uid,
        username: user.displayName || "匿名ユーザー",
        bid_amount: Number(bidAmount),
        bid_time: new Date().toISOString()
      }

      console.log("💾 入札履歴保存:", biddingData)
      await addDoc(collection(db, "bidding_history"), biddingData)

    
      const newBidCount = Number(auctionData.bidCount || 0) + 1
      const updateData = {
        currentBid: Number(bidAmount),
        bidCount: newBidCount,

        highestBidderId: user.uid,
        highestBidderName: user.displayName || "匿名ユーザー",
        updatedAt: new Date().toISOString()
      }

      console.log("📈 オークション情報更新:", updateData)
      await updateDoc(auctionRef, updateData)

      console.log("✅ 入札完了")
      return { 
        success: true, 
        message: "入札が完了しました！",
        newCurrentBid: bidAmount,
        bidCount: newBidCount
      }
    } catch (error: any) {
      console.error("❌ 入札エラー:", error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    placeBid,
    isSubmitting
  }
}

export function useBiddingHistory(auctionId: string) {
  const [biddingHistory, setBiddingHistory] = useState<BiddingHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auctionId) {
      setLoading(false)
      return
    }

    const fetchBiddingHistory = async () => {
      try {
        console.log("🔄 入札履歴取得開始:", auctionId)

        const simpleQuery = query(
          collection(db, "bidding_history"),
          where("auction_productid", "==", auctionId)
        )
        
        console.log("📊 シンプルクエリ実行中...")
        const querySnapshot = await getDocs(simpleQuery)
        const historyData: BiddingHistory[] = []
        
        console.log(`📄 取得した入札履歴件数: ${querySnapshot.size}`)
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("📝 入札履歴データ:", doc.id, data)
          
          historyData.push({
            id: doc.id,
            auction_productid: String(data.auction_productid || ""),
            userid: String(data.userid || ""),
            username: String(data.username || "匿名ユーザー"),
            bid_amount: Number(data.bid_amount) || 0,
            bid_time: String(data.bid_time || new Date().toISOString())
          })
        })

        historyData.sort((a, b) => new Date(b.bid_time).getTime() - new Date(a.bid_time).getTime())

        console.log(`✅ 入札履歴取得完了: ${historyData.length}件`)
        setBiddingHistory(historyData)
        setError(null)
      } catch (error: any) {
        console.error("❌ 入札履歴取得エラー:", error)
        console.error("エラー詳細:", error.code, error.message)
        
        
        if (error.code === 'failed-precondition') {
          setError("データベースのインデックスが不足しています。Firebase Consoleでインデックスを作成してください。")
        } else if (error.code === 'permission-denied') {
          setError("入札履歴へのアクセス権限がありません。")
        } else {
          setError(`入札履歴の取得に失敗しました: ${error.message}`)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBiddingHistory()
  }, [auctionId])

  return { biddingHistory, loading, error }
}

// オークション管理フック
export function useAuctionManagement() {
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)

  // 最高入札者への通知とチャット開始
  const notifyHighestBidder = async (auctionId: string, auctionData: any) => {
    try {
      console.log("🔔 最高入札者への通知開始")
      
      if (!auctionData.highestBidderId) {
        console.log("入札者がいないため通知をスキップ")
        return
      }

      // 通知を作成
      const notificationData = {
        userId: auctionData.highestBidderId,
        userName: auctionData.highestBidderName,
        type: "auction_won",
        title: "オークション落札",
        message: `「${auctionData.title}」のオークションで最高入札者となりました。出品者とのチャットが開始されました。`,
        auctionId: auctionId,
        sellerId: auctionData.sellerId,
        sellerName: auctionData.sellerName,
        finalPrice: auctionData.currentBid,
        read: false,
        createdAt: new Date().toISOString()
      }

      await addDoc(collection(db, "notifications"), notificationData)

      // チャットを開始（初期メッセージを追加）
      const chatColRef = collection(db, "auctions", auctionId, "chat")
      await addDoc(chatColRef, {
        senderId: "system",
        senderName: "システム",
        content: `おめでとうございます！${auctionData.highestBidderName}さんが最高入札者となりました。出品者の${auctionData.sellerName}さんとの取引を開始してください。`,
        createdAt: new Date(),
      })

      console.log("✅ 最高入札者への通知とチャット開始完了")
    } catch (error) {
      console.error("❌ 最高入札者への通知エラー:", error)
    }
  }

  // オークション終了処理（期間切れ対応）
  const closeExpiredAuction = async (auctionId: string) => {
    setIsProcessing(true)

    try {
      console.log(`🔄 期間切れオークション終了処理開始: ${auctionId}`)

      const auctionRef = doc(db, "auctions", auctionId)
      const auctionSnap = await getDoc(auctionRef)
      
      if (!auctionSnap.exists()) {
        throw new Error("オークションが見つかりません")
      }

      const auctionData = auctionSnap.data()
      
      // 既に終了している場合はスキップ
      if (auctionData.status === "ended") {
        return { success: true, message: "既に終了済み" }
      }

      // 最高入札者がいる場合は通知とチャット開始
      if (auctionData.highestBidderId) {
        await notifyHighestBidder(auctionId, auctionData)
      }

      // オークション状態を更新
      await updateDoc(auctionRef, {
        status: "ended",
        endReason: "expired",
        actualEndTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      console.log("✅ 期間切れオークション終了処理完了")
      return { 
        success: true, 
        message: auctionData.highestBidderId 
          ? "オークションが終了し、最高入札者に通知を送信しました" 
          : "オークションが終了しました（入札者なし）"
      }
    } catch (error: any) {
      console.error("❌ 期間切れオークション終了処理エラー:", error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  // オークション終了処理
  const closeAuction = async (auctionId: string, reason: 'expired' | 'bought') => {
    if (!user) {
      throw new Error("ログインが必要です")
    }

    setIsProcessing(true)

    try {
      console.log(`🔄 オークション終了処理開始: ${auctionId} (理由: ${reason})`)

    
      const auctionRef = doc(db, "auctions", auctionId)
      const auctionSnap = await getDoc(auctionRef)
      
      if (!auctionSnap.exists()) {
        throw new Error("オークションが見つかりません")
      }

      const auctionData = auctionSnap.data()
      
  
      if (user.uid !== auctionData.sellerId) {
        throw new Error("このオークションを終了する権限がありません")
      }

      
      const batch = writeBatch(db)

      
      batch.update(auctionRef, {
        status: "ended",
        endReason: reason,
        actualEndTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // 2. 入札履歴を削除
      console.log("🗑️ 入札履歴削除開始")
      const biddingQuery = query(
        collection(db, "bidding_history"),
        where("auction_productid", "==", auctionId)
      )
      
      const biddingSnapshot = await getDocs(biddingQuery)
      console.log(`📄 削除対象の入札履歴: ${biddingSnapshot.size}件`)
      
      biddingSnapshot.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // 3. バッチ実行
      await batch.commit()

      console.log("✅ オークション終了処理完了")
      return { 
        success: true, 
        message: reason === 'expired' ? "オークションが終了し、入札履歴を削除しました" : "購入が確定し、入札履歴を削除しました",
        deletedBids: biddingSnapshot.size
      }
    } catch (error: any) {
      console.error("❌ オークション終了処理エラー:", error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  // 即決購入処理
  const buyNow = async (auctionId: string) => {
    if (!user) {
      throw new Error("ログインが必要です")
    }

    setIsProcessing(true)

    try {
      console.log(`🔄 即決購入処理開始: ${auctionId}`)

      // オークション情報を取得
      const auctionRef = doc(db, "auctions", auctionId)
      const auctionSnap = await getDoc(auctionRef)
      
      if (!auctionSnap.exists()) {
        throw new Error("オークションが見つかりません")
      }

      const auctionData = auctionSnap.data()
      
      // 即決価格が設定されているかチェック
      if (!auctionData.buyNowPrice) {
        throw new Error("このオークションには即決価格が設定されていません")
      }

      // 自分の出品商品への購入を防ぐ
      if (user.uid === auctionData.sellerId) {
        throw new Error("自分が出品したオークションは購入できません")
      }

      // オークション終了時間の確認
      const endTime = new Date(auctionData.endTime)
      const now = new Date()
      if (now >= endTime) {
        throw new Error("このオークションは既に終了しています")
      }

      // オークション情報を更新（購入履歴保存はチャット後に行う）
      await updateDoc(auctionRef, {
        status: "ended",
        endReason: "bought",
        buyerId: user.uid,
        buyerName: user.displayName || "匿名ユーザー",
        buyerImage: user.photoURL || "/placeholder-user.jpg",
        finalPrice: auctionData.buyNowPrice,
        actualEndTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // チャット初期化（meta作成）
      console.log("💬 チャット初期化開始")
      const metaRef = doc(db, "auctions", auctionId, "chat", "meta")
      await setDoc(metaRef, {
        users: {
          seller: {
            id: auctionData.sellerId,
            imageURL: auctionData.sellerImage || "/placeholder-user.jpg",
          },
          buyer: {
            id: user.uid,
            imageURL: user.photoURL || "/placeholder-user.jpg",
          },
        },
      })

      // 初回メッセージを送信
      const chatRef = collection(db, "auctions", auctionId, "chat")
      await addDoc(chatRef, {
        senderId: "system",
        senderName: "システム",
        content: `即決購入が完了しました。出品者の${auctionData.sellerName}さんとの取引を開始してください。`,
        createdAt: serverTimestamp()
      })

      console.log("✅ 即決購入処理完了")
      return { 
        success: true, 
        message: "即決購入が完了しました。チャットで取引を進めてください。",
        purchasePrice: auctionData.buyNowPrice
      }
    } catch (error: any) {
      console.error("❌ 即決購入処理エラー:", error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    closeAuction,
    closeExpiredAuction,
    buyNow,
    isProcessing
  }
}

// 自動オークション終了チェック機能
export function useAuctionAutoClose() {
  useEffect(() => {
    const checkExpiredAuctions = async () => {
      try {
        console.log("🔄 期限切れオークションチェック開始")
        
        const now = new Date()
        const q = query(
          collection(db, "auctions"),
          where("status", "==", "active")
        )
        
        const snapshot = await getDocs(q)
        const expiredAuctions: { id: string, data: any }[] = []
        
        snapshot.forEach((doc) => {
          const data = doc.data()
          const endTime = new Date(data.endTime)
          
          if (now >= endTime) {
            expiredAuctions.push({ id: doc.id, data })
          }
        })

        if (expiredAuctions.length > 0) {
          console.log(`⏰ 期限切れオークション発見: ${expiredAuctions.length}件`)
          
          // 各期限切れオークションを処理
          for (const auction of expiredAuctions) {
            try {
              // 入札履歴を確認
              const biddingQuery = query(
                collection(db, "bidding_history"),
                where("auction_productid", "==", auction.id)
              )
              const biddingSnapshot = await getDocs(biddingQuery)
              
              if (biddingSnapshot.size > 0) {
                // 入札がある場合：ステータスのみ更新（データは残す）
                const bids: any[] = []
                biddingSnapshot.forEach((doc) => {
                  bids.push({ id: doc.id, ...doc.data() })
                })
                
                // 最高入札額でソート
                bids.sort((a, b) => b.bid_amount - a.bid_amount)
                const highestBid = bids[0]
                
                  // 落札者の画像URLを取得
                  let buyerImage = "/placeholder-user.jpg"
                  try {
                    const buyerRef = doc(db, "users", highestBid.userid)
                    const buyerSnap = await getDoc(buyerRef)
                    if (buyerSnap.exists()) {
                      const buyerData = buyerSnap.data()
                      buyerImage = buyerData.imageURL || buyerData.photoURL || "/placeholder-user.jpg"
                    }
                  } catch (e) {
                    console.error("落札者画像取得エラー:", e)
                  }
                
                // オークションステータス更新
                const auctionRef = doc(db, "auctions", auction.id)
                await updateDoc(auctionRef, {
                  status: "ended",
                  endReason: "expired",
                    buyerId: highestBid.userid,
                    buyerName: highestBid.username,
                    buyerImage: buyerImage,
                  finalPrice: highestBid.bid_amount,
                  actualEndTime: now.toISOString(),
                  updatedAt: now.toISOString()
                })
                
                  // チャットmeta作成
                  try {
                    const metaRef = doc(db, "auctions", auction.id, "chat", "meta")
                    await setDoc(metaRef, {
                      users: {
                        seller: {
                          id: auction.data.sellerId,
                          imageURL: auction.data.sellerImage || "/placeholder-user.jpg",
                        },
                        buyer: {
                          id: highestBid.userid,
                          imageURL: buyerImage,
                        },
                      },
                    })
                    console.log(`チャットmeta作成: オークション ${auction.id}`)
                  } catch (metaError) {
                    console.error("チャットmeta作成エラー:", metaError)
                }
                
                  // チャット初回メッセージを送信
                  try {
                    const chatRef = collection(db, "auctions", auction.id, "chat")
                    await addDoc(chatRef, {
                      senderId: "system",
                      senderName: "システム",
                      content: `オークションが終了しました。落札者: ${highestBid.username}さん (¥${highestBid.bid_amount.toLocaleString()})\n出品者の${auction.data.sellerName}さんとの取引を開始してください。`,
                      createdAt: serverTimestamp()
                    })
                    console.log(`チャット開始: オークション ${auction.id}`)
                  } catch (chatError) {
                    console.error("チャット開始エラー:", chatError)
                  }
                
                console.log(`✅ 期限切れオークション終了処理完了（データ保持）: ${auction.id}`)
              } else {
                // 入札がない場合：完全にデータを削除
                const auctionRef = doc(db, "auctions", auction.id)
                await deleteDoc(auctionRef)
                console.log(`🗑️ 入札なしオークション完全削除: ${auction.id}`)
              }
            } catch (error) {
              console.error(`❌ 期限切れオークション処理エラー: ${auction.id}`, error)
            }
          }
        }
      } catch (error) {
        console.error("❌ 期限切れオークションチェックエラー:", error)
      }
    }

    // 初回チェック
    checkExpiredAuctions()

    // 10分ごとにチェック
    const interval = setInterval(checkExpiredAuctions, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])
}