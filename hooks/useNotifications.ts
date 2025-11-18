"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { useAuth } from "@/components/auth-provider"

export interface Notification {
  id: string
  userId: string
  type: "bid_placed" | "auction_won" | "auction_ended" | "transaction_started" | "chat_message" | "transaction_agreed"
  title: string
  message: string
  auctionId?: string
  productId?: string
  sellerId?: string
  buyerId?: string
  read: boolean
  createdAt: string
  itemType?: "product" | "auction" // チャット遷移に必要
}

export interface Toast {
  id: string
  title: string
  description: string
  variant?: "default" | "destructive"
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // リアルタイム通知の監視
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData: Notification[] = []
      let newToasts: Toast[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        const notification: Notification = {
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          auctionId: data.auctionId,
          productId: data.productId,
          sellerId: data.sellerId,
          buyerId: data.buyerId,
          read: data.read,
          createdAt: data.createdAt
        }
        notificationsData.push(notification)

        // 新しい通知の場合はトーストとして表示
        if (!notification.read) {
          newToasts.push({
            id: doc.id,
            title: notification.title,
            description: notification.message,
            variant: notification.type === "auction_ended" ? "destructive" : "default"
          })
        }
      })

      // 作成日時でソート（新しい順）
      notificationsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setNotifications(notificationsData)
      setUnreadCount(notificationsData.filter(n => !n.read).length)

      // 新しいトーストを追加
      if (newToasts.length > 0) {
        setToasts(prev => [...prev, ...newToasts])
      }
    })

    return () => unsubscribe()
  }, [user])

  // 通知を既読にする
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
        readAt: new Date().toISOString()
      })
    } catch (error) {
      console.error("通知の既読更新エラー:", error)
    }
  }, [])

  // トーストを削除
  const removeToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId))
    // 対応する通知も既読にする
    markAsRead(toastId)
  }, [markAsRead])

  // 通知を送信する関数
  const sendNotification = useCallback(async (notificationData: Omit<Notification, "id" | "createdAt">) => {
    try {
      await addDoc(collection(db, "notifications"), {
        ...notificationData,
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error("通知送信エラー:", error)
    }
  }, [])


  return {
    notifications,
    toasts,
    unreadCount,
    markAsRead,
    removeToast,
    sendNotification
  }
}

// 自動でトーストを削除するHook
export function useToastAutoRemove() {
  const { toasts, removeToast } = useNotifications()

  useEffect(() => {
    toasts.forEach(toast => {
      const timer = setTimeout(() => {
        removeToast(toast.id)
      }, 5000) // 5秒後に自動削除

      return () => clearTimeout(timer)
    })
  }, [toasts, removeToast])

  return { toasts, removeToast }
}