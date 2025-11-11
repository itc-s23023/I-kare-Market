"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  DocumentData,
  QuerySnapshot,
  getDoc,
  getDocs,
} from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { create } from "domain"
import { createDecipheriv } from "crypto"

export type ChatMessage = {
  id: string
  senderId: string
  senderName: string
  content: string
  createdAt: Date | null
}

export type ChatUsers =
  | {
      sellerId?: string
      sellerImage?: string
      buyerId?: string
      buyerImage?: string
    }
  | null

// 通知送信用の関数
const sendChatNotification = async (notificationData: {
  userId: string
  type: "chat_message"
  title: string
  message: string
  auctionId?: string
  productId?: string
  senderId?: string
}) => {
  try {
    // undefinedのフィールドを除外してFirestoreに送信
    const cleanData: any = {
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      senderId: notificationData.senderId,
      read: false,
      createdAt: new Date().toISOString()
    }

    // undefined以外のフィールドのみ追加
    if (notificationData.auctionId) {
      cleanData.auctionId = notificationData.auctionId
    }
    if (notificationData.productId) {
      cleanData.productId = notificationData.productId
    }

    await addDoc(collection(db, "notifications"), cleanData)
  } catch (error) {
    console.error("チャット通知送信エラー:", error)
  }
}

/**
 * useChat hook
 * - pathRoot: 'products' or 'auctions'
 * - id: productId or auctionId
 */
export function useChat(pathRoot: "products" | "auctions", id: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chatUsers, setChatUsers] = useState<ChatUsers>(null)
  const unsubscribeRef = useRef<() => void | null>(null)
  const unsubscribeMetaRef = useRef<() => void | null>(null)

  useEffect(() => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const colRef = collection(db, pathRoot, id, "chat")
      const q = query(colRef, orderBy("createdAt", "asc"))

      const unsub = onSnapshot(
        q,
        (snap: QuerySnapshot<DocumentData>) => {
          const msgs: ChatMessage[] = []
          snap.forEach((doc) => {
            const data = doc.data()
            msgs.push({
              id: doc.id,
              senderId: data.senderId || "",
              senderName: data.senderName || "",
              content: data.content || "",
              createdAt: data.createdAt ? data.createdAt.toDate() : null,
            })
          })
          setMessages(msgs)
          setLoading(false)
        },
        (err) => {
          console.error("useChat onSnapshot error:", err)
          setError(err.message || "メッセージの購読に失敗しました")
          setLoading(false)
        }
      )

      unsubscribeRef.current = unsub
      // subscribe to meta doc in chat collection (doc id: 'meta') to get users info
      try {
        const metaDocRef = doc(db, pathRoot, id, "chat", "meta")
        const unsubMeta = onSnapshot(
          metaDocRef,
          (snap) => {
            if (snap.exists()) {
              const d = snap.data() as DocumentData
              // expect structure: { users: { seller: { id, imageURL }, buyer: { id, imageURL } } }
              const users = d.users || null
              if (users) {
                setChatUsers({
                  sellerId: users.seller?.id,
                  sellerImage: users.seller?.imageURL,
                  buyerId: users.buyer?.id,
                  buyerImage: users.buyer?.imageURL,
                })
              } else {
                setChatUsers(null)
              }
            } else {
              setChatUsers(null)
            }
          },
          (err) => {
            console.error("useChat meta onSnapshot error:", err)
          }
        )
        unsubscribeMetaRef.current = unsubMeta
      } catch (e) {
        console.error("useChat meta subscription failed", e)
      }

      return () => {
        unsub()
        unsubscribeRef.current = null
        if (unsubscribeMetaRef.current) {
          unsubscribeMetaRef.current()
          unsubscribeMetaRef.current = null
        }
      }
    } catch (e: any) {
      setError(e.message || "不明なエラー")
      setLoading(false)
    }
  }, [pathRoot, id])

  async function sendMessage(payload: { senderId: string; senderName: string; content: string }) {
    try {
      console.log("🔄 チャットメッセージ送信開始:", payload)
      
      const colRef = collection(db, pathRoot, id, "chat")
      await addDoc(colRef, {
        ...payload,
        createdAt: serverTimestamp(),
      })

      console.log("✅ チャットメッセージ送信完了")

      // チャットメッセージ送信時に通知を送る
      try {
        console.log("🔔 チャット通知の送信開始")
        
        // オークション/商品情報を取得して相手を特定
        const itemRef = doc(db, pathRoot, id)
        const itemSnap = await getDoc(itemRef)
        
        if (itemSnap.exists()) {
          const itemData = itemSnap.data()
          console.log("📄 取得したアイテムデータ:", itemData)
          
          // 相手のユーザーIDを特定
          let recipientId = ""
          let itemTitle = ""
          
          if (pathRoot === "auctions") {
            itemTitle = itemData.title || "オークション商品"
            // オークションの場合、出品者と落札者を判定
            if (payload.senderId === itemData.sellerId) {
              // 送信者が出品者の場合、落札者に通知
              recipientId = itemData.winnerId || itemData.highestBidderId || ""
              console.log("📤 出品者から落札者への通知:", { recipientId, winnerId: itemData.winnerId, highestBidderId: itemData.highestBidderId })
            } else {
              // 送信者が落札者の場合、出品者に通知
              recipientId = itemData.sellerId || ""
              console.log("📤 落札者から出品者への通知:", { recipientId, sellerId: itemData.sellerId })
            }
          } else {
            // 商品の場合の処理
            itemTitle = itemData.productname || itemData.title || "商品"
            
            if (payload.senderId === itemData.userid) {
              // 送信者が出品者の場合、購入希望者を特定
              console.log("📤 商品出品者からのメッセージ")
              
              // チャット履歴から購入希望者を特定
              try {
                const chatQuery = query(
                  collection(db, pathRoot, id, "chat"),
                  orderBy("createdAt", "desc")
                )
                const chatSnapshot = await getDocs(chatQuery)
                
                // システムメッセージ以外で、出品者以外のユーザーを探す
                for (const chatDoc of chatSnapshot.docs) {
                  const chatData = chatDoc.data()
                  if (chatData.senderId !== "system" && chatData.senderId !== itemData.userid) {
                    recipientId = chatData.senderId
                    console.log("📤 商品チャット履歴から購入希望者を特定:", { 
                      recipientId, 
                      senderName: chatData.senderName 
                    })
                    break
                  }
                }
              } catch (chatError) {
                console.error("商品チャット履歴取得エラー:", chatError)
              }
            } else {
              // 送信者が購入希望者の場合、出品者に通知
              recipientId = itemData.userid || ""
              console.log("📤 購入希望者から商品出品者への通知:", { 
                recipientId, 
                sellerId: itemData.userid 
              })
            }
            
            console.log("📦 商品チャット通知処理完了:", { recipientId, senderId: payload.senderId })
          }

          // 相手が特定できた場合のみ通知を送信
          if (recipientId && recipientId !== payload.senderId) {
            console.log("💌 通知送信:", {
              recipientId,
              senderId: payload.senderId,
              itemTitle,
              senderName: payload.senderName
            })
            
            await sendChatNotification({
              userId: recipientId,
              type: "chat_message",
              title: "新しいメッセージ",
              message: `${payload.senderName}さんから「${itemTitle}」についてメッセージが届きました`,
              auctionId: pathRoot === "auctions" ? id : undefined,
              productId: pathRoot === "products" ? id : undefined,
              senderId: payload.senderId
            })
            
            console.log("✅ チャット通知送信完了")
          } else {
            console.log("❌ 通知送信スキップ:", {
              recipientId,
              senderId: payload.senderId,
              reason: recipientId ? "送信者と受信者が同じ" : "受信者が特定できない"
            })
          }
        } else {
          console.log("❌ アイテムが見つかりません:", { pathRoot, id })
        }
      } catch (notificationError) {
        console.error("❌ チャット通知の送信に失敗:", notificationError)
        // 通知の失敗はメッセージ送信を阻害しない
      }
    } catch (e: any) {
      console.error("❌ sendMessage error:", e)
      throw e
    }
  }

  return { messages, loading, error, sendMessage, chatUsers }
}
