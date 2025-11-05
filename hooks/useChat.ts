"use client"

import { useEffect, useState, useRef } from "react"
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"

export type ChatMessage = {
  id: string
  senderId: string
  senderName: string
  content: string
  createdAt: Date | null
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
  const unsubscribeRef = useRef<() => void | null>(null)

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
      return () => {
        unsub()
        unsubscribeRef.current = null
      }
    } catch (e: any) {
      setError(e.message || "不明なエラー")
      setLoading(false)
    }
  }, [pathRoot, id])

  async function sendMessage(payload: { senderId: string; senderName: string; content: string }) {
    try {
      const colRef = collection(db, pathRoot, id, "chat")
      await addDoc(colRef, {
        ...payload,
        createdAt: serverTimestamp(),
      })
    } catch (e: any) {
      console.error("sendMessage error:", e)
      throw e
    }
  }

  return { messages, loading, error, sendMessage }
}
